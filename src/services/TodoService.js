// src/services/TodoService.js
const TodoFileRepository = require('../infrastructure/persistence/TodoFileRepository');
const config = require('../config'); // Adjust the path as needed

class TodoService {
    constructor() {
        this.repository = new TodoFileRepository();
    }

    async loadFile(filePath) {
        return await this.repository.load(filePath);
    }

    async saveFile(filePath, projects) {
        await this.repository.save(filePath, projects);
    }

    findTaskById(projects, taskId) {
        const segments = taskId.split('.');
        let current = null;
        let tasks = projects[segments[0] - 1]?.tasks;

        for (let i = 1; i < segments.length; i++) {
            current = tasks?.[segments[i] - 1] ?? null;
            if (!current) return null;
            tasks = current.tasks;
        }

        return current;
    }

    async listFiles() {
        return await this.repository.listTodoFiles();
    }
    
    async updateTask(filePath, taskId, updates) {
        console.log('TodoService.updateTask called:', {
            filePath,
            taskId,
            updates
        });
    
        try {
            const projects = await this.loadFile(filePath);
            console.log('Projects loaded:', projects);
    
            const task = this.findTaskById(projects, taskId);
            console.log('Task found:', task);
            
            if (!task) {
                console.error('Task not found:', taskId);
                throw new Error(`Task not found: ${taskId}`);
            }
        
            // Log before update
            console.log('Task before update:', {
                text: task.text,
                status: task.status,
                tags: task.tags
            });
    
            if (updates.text !== undefined) {
                task.text = updates.text;
            }
            if (updates.status !== undefined) {
                console.log('Updating status to:', updates.status);
                task.status = updates.status;
            }
            if (updates.note !== undefined) {
                task.note = updates.note;
            }
    
            // Log after update
            console.log('Task after update:', {
                text: task.text,
                status: task.status,
                tags: task.tags
            });
    
            console.log('Saving file...');
            await this.saveFile(filePath, projects);
            console.log('File saved successfully');
    
            return task;
        } catch (error) {
            console.error('Error in updateTask:', error);
            throw error;
        }
    }

    async executeTaskActions(filePath, taskId) {
        const projects = await this.loadFile(filePath);
        const task = this.findTaskById(projects, taskId);
        
        if (!task) {
            throw new Error(`Task not found: ${taskId}`);
        }

        for (const action of task.actions) {
            await this.executeAction(action);
        }

        task.status = 'completed';
        await this.saveFile(filePath, projects);
        
        return task;
    }

    async executeAction(action) {
        console.log(`Executing action: ${action.type} with params: ${action.params}`);
    }
}

// Make sure to export the class properly
module.exports = TodoService;