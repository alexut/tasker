const fs = require('fs').promises;
const path = require('path');
const TodoFileParser = require('../parser/TodoFileParser');
const config = require('../../config');
const todoConfig = require('../../config/todo.config');
const debug = require('debug')('todo:repository');

class TodoFileRepository {
    constructor() {
        this.parser = new TodoFileParser();
        this.basePath = config.settings.basePath;
    }
    
    async listTodoFiles() {
        const allFiles = new Set();
        
        // Add predefined paths
        for (const predefinedPath of todoConfig.predefinedPaths) {
            allFiles.add(predefinedPath);
        }
        
        // Scan projects directory for todo files
        const projectsPath = path.join(this.basePath, 'projects');
        try {
            const projectFiles = await this.scanDirectory(projectsPath);
            for (const file of projectFiles) {
                // Normalize path separators to forward slashes
                const relativePath = path.relative(this.basePath, file).replace(/\\/g, '/');
                allFiles.add(relativePath);
            } 
        } catch (error) {
            debug('Error scanning projects directory:', error);
            // Continue even if projects directory doesn't exist
        }
        
        // Convert to array and sort
        const sortedFiles = Array.from(allFiles).sort();
        return sortedFiles;
    }

    async scanDirectory(dir) {
        const todoFiles = [];
        
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                if (entry.isDirectory()) {
                    const subDirFiles = await this.scanDirectory(fullPath);
                    todoFiles.push(...subDirFiles);
                } else if (entry.isFile() && entry.name.endsWith('.todo')) {
                    todoFiles.push(fullPath);
                }
            }
        } catch (error) {
            debug('Error scanning directory:', error);
            throw new Error(`Failed to scan directory: ${error.message}`);
        }

        return todoFiles;
    }

    getFullPath(filePath) {
        const fullPath = path.isAbsolute(filePath) 
            ? filePath 
            : path.join(this.basePath, filePath);
        debug('Full path:', fullPath);
        return fullPath;
    }

    async load(filePath) {
        try {
            const fullPath = this.getFullPath(filePath);
            const content = await fs.readFile(fullPath, 'utf8');
            return this.parser.parse(content);
        } catch (error) {
            debug('Error loading todo file:', error);
            throw new Error(`Failed to load todo file: ${error.message}`);
        }
    }

    async save(filePath, tasks) {
        try {
            const fullPath = this.getFullPath(filePath);
            const content = this.parser.serialize(tasks);
            await fs.writeFile(fullPath, content);
        } catch (error) {
            debug('Error saving todo file:', error);
            throw new Error(`Failed to save todo file: ${error.message}`);
        }
    }
}

module.exports = TodoFileRepository;