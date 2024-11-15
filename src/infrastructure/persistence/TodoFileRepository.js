const fs = require('fs').promises;
const path = require('path');
const TodoFileParser = require('../parser/TodoFileParser');
const config = require('../../config');
const debug = require('debug')('todo:repository'); // Optional: Add debugging

class TodoFileRepository {
    constructor() {
        this.parser = new TodoFileParser();
        this.basePath = config.settings.basePath;
    }
    
    async listTodoFiles() {
        const files = await this.scanDirectory(this.basePath);
        return files.map(file => path.relative(this.basePath, file));
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
            debug('Loading from:', fullPath);
            
            const content = await fs.readFile(fullPath, 'utf-8');
            debug('File content:', content);
            
            const projects = this.parser.parse(content);
            debug('Parsed projects:', projects);
            
            return projects;
        } catch (error) {
            debug('Error loading file:', error);
            throw new Error(`Failed to load todo file: ${error.message}`);
        }
    }

    async save(filePath, projects) {
        try {
            const fullPath = this.getFullPath(filePath);
            debug('Saving to:', fullPath);
            
            const content = this.parser.serialize(projects);
            debug('Serialized content:', content);
            
            await fs.writeFile(fullPath, content, 'utf-8');
            debug('File saved successfully');
        } catch (error) {
            debug('Error saving file:', error);
            throw new Error(`Failed to save todo file: ${error.message}`);
        }
    }
}

module.exports = TodoFileRepository;