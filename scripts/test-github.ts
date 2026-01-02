import { GitHubConnector } from '../src/lib/connectors/github';
import { FileNode } from '../src/lib/uccp/types';

async function testGitHub() {
    const connector = new GitHubConnector();
    const repoUrl = 'https://github.com/facebook/react'; // Good test case

    console.log(`Connecting to: ${repoUrl}`);

    try {
        const metadata = await connector.connect({ repoUrl });
        console.log('Project Metadata:', metadata);
        console.log(`Connector configured for branch: ${metadata.name}`); // Branch is internal to connector state, but metadata name is repo name

        console.log('Scanning repo...');
        const nodes = await connector.scan();

        // Helper to print structure (limit depth and count)
        let count = 0;
        function printNodes(nodes: FileNode[], indent = 0) {
            for (const node of nodes) {
                if (count > 20) return; // Print first 20 items only
                console.log('  '.repeat(indent) + `[${node.type}] ${node.name}`);
                count++;
                if (node.children) {
                    printNodes(node.children, indent + 1);
                }
            }
        }

        console.log('Partial Tree Structure:');
        printNodes(nodes);

        // Test file content fetch (package.json)
        console.log('\nFetching package.json...');
        const packageCtx = await connector.getFileContent('package.json');
        console.log('package.json content preview:', packageCtx.substring(0, 100) + '...');

    } catch (err) {
        console.error('GitHub Connector Test Failed:', err);
    }
}

testGitHub();
