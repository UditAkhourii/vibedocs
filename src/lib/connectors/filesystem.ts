import { promises as fsPromises } from 'fs';
import path from 'path';
import { Connector, ConnectorType, FileNode, ProjectMetadata } from '../uccp/types';

export class FileSystemConnector implements Connector {
    type: ConnectorType = 'filesystem';

    async connect(config: { path: string, name?: string }): Promise<ProjectMetadata> {
        const rootPath = config.path;
        const stat = await fsPromises.stat(rootPath);

        if (!stat.isDirectory()) {
            throw new Error(`Path ${rootPath} is not a directory`);
        }

        // Basic metadata inference
        const packageJsonPath = path.join(rootPath, 'package.json');
        let framework = 'unknown';
        const packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun' | undefined = undefined;

        try {
            const pkgContent = await fsPromises.readFile(packageJsonPath, 'utf-8');
            const pkg = JSON.parse(pkgContent);
            if (pkg.dependencies?.next) framework = 'Next.js';
            if (pkg.dependencies?.react) framework = framework === 'unknown' ? 'React' : framework;
            if (pkg.dependencies?.fastapi) framework = 'FastAPI'; // unlikely in package.json but logical placeholder
        } catch (_e) {
            // Ignored
        }

        return {
            id: Buffer.from(rootPath).toString('base64'),
            name: config.name || path.basename(rootPath),
            framework,
            packageManager, // Detection logic would go here
            entryPoints: [],
            envFiles: [], // creating logic to scan for .env
            createdAt: Date.now()
        };
    }

    async scan(dirPath?: string): Promise<FileNode[]> {
        // efficient recursive scan
        if (!dirPath) throw new Error("Path is required for filesystem scan");

        // Safety check: ensure we are scanning a valid path
        // In a real app, we would sandbox this.

        const nodes: FileNode[] = [];
        const items = await fsPromises.readdir(dirPath, { withFileTypes: true });

        for (const item of items) {
            const fullPath = path.join(dirPath, item.name);

            // Ignore node_modules, .git, .next, etc.
            if (['node_modules', '.git', '.next', 'dist', 'build'].includes(item.name)) continue;

            if (item.isDirectory()) {
                const children = await this.scan(fullPath);
                nodes.push({
                    path: fullPath,
                    name: item.name,
                    type: 'directory',
                    children
                });
            } else {
                const stats = await fsPromises.stat(fullPath);
                nodes.push({
                    path: fullPath,
                    name: item.name,
                    type: 'file',
                    size: stats.size,
                    lastModified: stats.mtimeMs
                });
            }
        }
        return nodes;
    }

    async getFileContent(filePath: string): Promise<string> {
        return fsPromises.readFile(filePath, 'utf-8');
    }
}
