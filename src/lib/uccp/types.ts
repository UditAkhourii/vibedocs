export type ConnectorType = 'filesystem' | 'github' | 'gitlab' | 'manual_upload';

export interface ProjectMetadata {
  id: string;
  name: string;
  framework?: string;
  packageManager?: 'npm' | 'pnpm' | 'yarn' | 'bun';
  entryPoints: string[];
  envFiles: string[];
  readme?: string;
  createdAt: number;
}

export interface FileNode {
  path: string; // Relative path from project root
  name: string;
  type: 'file' | 'directory';
  content?: string; // Content is loaded lazily or eager depending on size
  size?: number;
  lastModified?: number;
  children?: FileNode[]; // For directory structures
}

export interface UCCPRequest {
  projectId: string;
  files: FileNode[];
  metadata: ProjectMetadata;
}

export interface Connector {
  type: ConnectorType;
  connect(config: Record<string, unknown>): Promise<ProjectMetadata>;
  scan(path?: string): Promise<FileNode[]>;
  getFileContent(path: string): Promise<string>;
}
