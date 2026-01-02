import { FileSystemConnector } from '../src/lib/connectors/filesystem';
import { FileNode } from '../src/lib/uccp/types';
import path from 'path';

async function testConnector() {
    const connector = new FileSystemConnector();
    const rootDir = path.resolve(process.cwd()); // Scan current vibedocs dir

    console.log(`Connecting to: ${rootDir}`);

    try {
        const metadata = await connector.connect({ path: rootDir });
        console.log('Project Metadata:', metadata);

        console.log('Scanning directory (limited to 1 depth for test)...');
        // We scan src to avoid node_modules spam in logs
        const srcDir = path.join(rootDir, 'src');
        const nodes = await connector.scan(srcDir);

        // Helper to print structure
        function printNodes(nodes: FileNode[], indent = 0) {
            for (const node of nodes) {
                console.log('  '.repeat(indent) + `[${node.type}] ${node.name} (${node.size || 0} bytes)`);
                if (node.children) {
                    printNodes(node.children, indent + 1);
                }
            }
        }

        printNodes(nodes);

    } catch (err) {
        console.error('Connector Test Failed:', err);
    }
}

testConnector();
