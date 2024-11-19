const fs = require('fs').promises;
const path = require('path');
const Action = require('./Action');
const config = require('../../config');

class FileSystemAction extends Action {
    constructor() {
        super('filesystem');
        this.description = 'File system operations like creating and scanning files/folders';
        this.basePath = path.resolve(config.settings.basePath); // Normalize base path
    }

    async execute(connectionId, parameters) {
        const params = JSON.parse(parameters);
        const { command } = params;

        switch (command) {
            case 'create':
                return this.createStructure(params.structure);
            case 'scan':
                return this.scanDirectory(params.path, params.options);
            default:
                throw new Error(`Unknown filesystem command: ${command}`);
        }
    }

    async createStructure(structure) {
        for (const item of structure) {
            // Normalize paths
            const normalizedPath = path.normalize(item.path).replace(/^[/\\]+/, '');
            const fullPath = path.join(this.basePath, normalizedPath);
            const resolvedPath = path.resolve(fullPath);
            
            // Security check
            if (!resolvedPath.startsWith(this.basePath)) {
                throw new Error('Access denied: Path is outside base directory');
            }

            try {
                if (item.type === 'folder') {
                    await fs.mkdir(resolvedPath, { recursive: true });
                } else if (item.type === 'file') {
                    const dir = path.dirname(resolvedPath);
                    await fs.mkdir(dir, { recursive: true });
                    await fs.writeFile(resolvedPath, item.content || '');
                }
            } catch (error) {
                throw new Error(`Failed to create ${item.type}: ${error.message}`);
            }
        }

        return {
            success: true,
            message: 'Structure created successfully'
        };
    }

    async scanDirectory(dirPath, options = {}) {
        // Normalize paths
        const normalizedPath = path.normalize(dirPath).replace(/^[/\\]+/, '');
        const fullPath = path.join(this.basePath, normalizedPath);
        const resolvedPath = path.resolve(fullPath);
        
        // Security check
        if (!resolvedPath.startsWith(this.basePath)) {
            throw new Error('Access denied: Path is outside base directory');
        }

        try {
            // Check if directory exists
            const stats = await fs.stat(resolvedPath);
            if (!stats.isDirectory()) {
                throw new Error('Path is not a directory');
            }
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error('Failed to scan directory: Directory does not exist');
            }
            throw error;
        }

        const {
            recursive = false,
            includeContent = false,
            readOffset = 0,
            maxSize = 102400 // Default 100KB
        } = options;

        const result = {
            path: dirPath,
            files: [],
            folders: [],
            contents: {}
        };

        try {
            const entries = await fs.readdir(resolvedPath, { withFileTypes: true });

            for (const entry of entries) {
                const entryPath = path.join(dirPath, entry.name);
                const fullEntryPath = path.join(resolvedPath, entry.name);

                if (entry.isDirectory()) {
                    result.folders.push({
                        name: entry.name,
                        path: entryPath
                    });

                    if (recursive) {
                        const subResult = await this.scanDirectory(entryPath, options);
                        result.files.push(...subResult.files);
                        result.folders.push(...subResult.folders);
                        Object.assign(result.contents, subResult.contents);
                    }
                } else if (entry.isFile()) {
                    result.files.push({
                        name: entry.name,
                        path: entryPath
                    });

                    if (includeContent) {
                        const stats = await fs.stat(fullEntryPath);
                        if (stats.size <= maxSize) {
                            const content = await fs.readFile(fullEntryPath, 'utf8');
                            result.contents[entry.name] = {
                                content: content.slice(readOffset),
                                size: stats.size
                            };
                        }
                    }
                }
            }

            return result;
        } catch (error) {
            throw new Error(`Failed to scan directory: ${error.message}`);
        }
    }
}

module.exports = FileSystemAction;
