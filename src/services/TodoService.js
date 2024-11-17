// src/services/TodoService.js
const TodoFileRepository = require('../infrastructure/persistence/TodoFileRepository');
const config = require('../config'); // Adjust the path as needed
const ActionRegistry = require('../domain/actions/ActionRegistry');

class TodoService {
    constructor() {
        this.repository = new TodoFileRepository();
        this.actionRegistry = new ActionRegistry();
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

            // Handle adding tags
            if (updates.addTag) {
                const { name, value } = updates.addTag;
                // Add tag to tags array if it doesn't exist
                if (!task.tags) {
                    task.tags = [];
                }
                task.tags.push({ name, value });
                
                // Add tag to text
                const tagText = `@${name}(${value})`;
                if (!task.text.includes(tagText)) {
                    task.text = task.text.trim() + ' ' + tagText;
                }
            }

            // Handle removing tags
            if (updates.removeTag) {
                const tagName = updates.removeTag;
                // Remove tag from tags array
                if (task.tags) {
                    task.tags = task.tags.filter(tag => tag.name !== tagName);
                }
                
                // Remove tag from text
                const tagRegex = new RegExp(`\\s*@${tagName}\\([^)]+\\)`, 'g');
                task.text = task.text.replace(tagRegex, '');
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
            throw {
                message: `Error updating task: ${error.message}`,
                code: error.code || 1
            };
        }
    }

    async executeTaskActions(filePath, taskId) {
        const projects = await this.loadFile(filePath);
        const task = this.findTaskById(projects, taskId);
        
        if (!task) {
            throw new Error(`Task not found: ${taskId}`);
        }

        const results = [];
        for (const action of task.actions) {
            try {
                console.log(`[TodoService] Executing action: ${action.type}`);
                const result = await this.actionRegistry.executeAction(action.type, task, action.params);
                results.push({
                    type: action.type,
                    success: true,
                    result
                });
            } catch (error) {
                console.error(`[TodoService] Action ${action.type} failed:`, error);
                results.push({
                    type: action.type,
                    success: false,
                    error: {
                        message: `Action execution failed: ${error.message}`,
                        code: error.code || 1
                    }
                });
            }
        }

        // Only mark as completed if all actions succeeded
        const allSucceeded = results.every(r => r.success);
        if (allSucceeded) {
            task.status = 'completed';
            await this.saveFile(filePath, projects);
        }
        
        return {
            task,
            actionResults: results,
            allActionsSucceeded: allSucceeded
        };
    }

    async listAvailableActions() {
        return this.actionRegistry.listActions();
    }
}

// Make sure to export the class properly
module.exports = TodoService;