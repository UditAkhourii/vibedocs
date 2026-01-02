import { Octokit } from "@octokit/rest";
import { Connector, ConnectorType, FileNode, ProjectMetadata } from '../uccp/types';

export class GitHubConnector implements Connector {
    type: ConnectorType = 'github';
    private octokit: Octokit;
    private owner: string = '';
    private repo: string = '';
    private branch: string = 'main';

    constructor() {
        this.octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN
        });
    }

    async connect(config: { repoUrl: string, token?: string }): Promise<ProjectMetadata> {
        if (config.token) {
            this.octokit = new Octokit({ auth: config.token });
        }

        // Parse URL: https://github.com/owner/repo
        const match = config.repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!match) {
            throw new Error("Invalid GitHub URL");
        }

        this.owner = match[1];
        this.repo = match[2].replace('.git', '');

        // Fetch repo details to verify access and get default branch
        const { data: repoData } = await this.octokit.request('GET /repos/{owner}/{repo}', {
            owner: this.owner,
            repo: this.repo,
        });

        this.branch = repoData.default_branch;

        // Detect framework from files (naive check of root files)
        // We do a shallow root scan first to check for package.json
        const { data: rootContents } = await this.octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
            owner: this.owner,
            repo: this.repo,
            path: '',
        });

        let framework = 'unknown';
        const packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun' | undefined = undefined;

        if (Array.isArray(rootContents)) {
            const packageJsonFile = rootContents.find(f => f.name === 'package.json');
            if (packageJsonFile) {
                // Fetch content to detect framework
                try {
                    const pkgContent = await this.getFileContent('package.json');
                    const pkg = JSON.parse(pkgContent);
                    if (pkg.dependencies?.next) framework = 'Next.js';
                    else if (pkg.dependencies?.react) framework = 'React';
                    else if (pkg.dependencies?.vue) framework = 'Vue';
                } catch (_e) {
                    // ignore
                }
            }
        }

        return {
            id: `${this.owner}/${this.repo}`,
            name: this.repo,
            framework,
            packageManager,
            entryPoints: [],
            envFiles: [],
            readme: undefined, // Could fetch README.md here
            createdAt: Date.now()
        };
    }

    async scan(_path: string = ''): Promise<FileNode[]> {
        if (!this.owner || !this.repo) {
            throw new Error("Connector not initialized. Call connect() first.");
        }

        const { data: refData } = await this.octokit.request('GET /repos/{owner}/{repo}/git/refs/heads/{ref}', {
            owner: this.owner,
            repo: this.repo,
            ref: this.branch
        });

        const treeSha = refData.object.sha;

        const { data: treeData } = await this.octokit.request('GET /repos/{owner}/{repo}/git/trees/{tree_sha}', {
            owner: this.owner,
            repo: this.repo,
            tree_sha: treeSha,
            recursive: 'true'
        });

        // Store actual tree for other methods
        this.rawTree = treeData.tree;

        return this.buildFileTree(treeData.tree);
    }

    private rawTree: any[] = [];

    async getTreeString(): Promise<string> {
        if (this.rawTree.length === 0) {
            await this.scan();
        }
        return this.rawTree
            .map(item => `${item.type === 'tree' ? '[DIR]' : '[FILE]'} ${item.path}`)
            .join('\n');
    }

    async getMostImportantFiles(limit: number = 15): Promise<{ path: string, score: number }[]> {
        const nodes = await this.scan();
        const importantExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', '.cpp', '.c', '.html', '.css'];
        const ignoreDirs = ['node_modules', 'dist', 'build', '.next', '.git', 'package-lock.json', 'yarn.lock'];

        const files: { path: string, score: number }[] = [];

        const traverse = (currentNodes: FileNode[]) => {
            for (const node of currentNodes) {
                if (node.type === 'directory') {
                    if (!ignoreDirs.some(id => node.path.includes(id))) {
                        traverse(node.children || []);
                    }
                } else {
                    const ext = '.' + node.name.split('.').pop();
                    if (importantExtensions.includes(ext.toLowerCase())) {
                        let score = 0;
                        const name = node.name.toLowerCase();
                        if (name.includes('route') || name.includes('api')) score += 10;
                        if (name.includes('page') || name.includes('view')) score += 8;
                        if (name.includes('model') || name.includes('schema') || name.includes('types')) score += 7;
                        if (name.includes('service') || name.includes('lib') || name.includes('utils')) score += 5;
                        if (name.includes('index') || name.includes('main') || name.includes('app')) score += 5;

                        // Component detection
                        if (name.match(/^[A-Z]/)) score += 3;

                        files.push({ path: node.path, score });
                    }
                }
            }
        };

        traverse(nodes);
        return files
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    async getFileContent(filePath: string): Promise<string> {
        // GET /repos/{owner}/{repo}/contents/{path}
        // Returns base64 encoded content
        const { data } = await this.octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
            owner: this.owner,
            repo: this.repo,
            path: filePath,
        });

        if (Array.isArray(data) || !('content' in data)) {
            throw new Error(`Path ${filePath} is a directory, not a file.`);
        }

        return Buffer.from(data.content, 'base64').toString('utf-8');
    }

    private buildFileTree(items: { path: string, type: string, size?: number }[]): FileNode[] {
        const root: FileNode[] = [];
        const map = new Map<string, FileNode>();

        // Sort by path length to ensure parents are processed before children (mostly)
        // Actually, we just need to handle path splitting strings.

        // 1. Create all nodes
        items.forEach(item => {
            // GitHub API returns: { path: "src/utils.ts", mode: "100644", type: "blob" | "tree", sha, size, url }
            // type: "blob" (file), "tree" (directory)
            const node: FileNode = {
                path: item.path,
                name: item.path.split('/').pop()!,
                type: item.type === 'tree' ? 'directory' : 'file',
                size: item.size,
                children: item.type === 'tree' ? [] : undefined
            };
            map.set(item.path, node);
        });

        // 2. Build Hierarchy
        items.forEach(item => {
            const node = map.get(item.path)!;
            const parts = item.path.split('/');

            if (parts.length === 1) {
                root.push(node);
            } else {
                const parentPath = parts.slice(0, -1).join('/');
                const parent = map.get(parentPath);
                if (parent) {
                    parent.children = parent.children || [];
                    parent.children.push(node);
                } else {
                    // Parent might be missing if Git didn't explicilty list folder object (rare but possible in sparse checkouts or diffs)
                    // For standard tree API it should be there. If not, add to root as fallback.
                    root.push(node);
                }
            }
        });

        return root;
    }
}
