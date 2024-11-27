// src/services/TodoService.js
const TodoFileRepository = require('../infrastructure/persistence/TodoFileRepository');
const config = require('../config');
const ActionRegistry = require('../domain/actions/ActionRegistry');
const Task = require('../domain/entities/Task'); // Fix the import path

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

    findProjectByName(projects, name) {
        const index = projects.findIndex(p => p.name === name);
        return index !== -1 ? { project: projects[index], index } : null;
    }

    async createProject(filePath, projectName) {
        const projects = await this.loadFile(filePath);
        const newProject = {
            name: projectName,
            tasks: []
        };
        projects.push(newProject);
        await this.saveFile(filePath, projects);
        return {
            project: newProject,
            projectId: projects.length.toString() // The new project's ID
        };
    }
    
    async createTasks(filePath, tasks) {
        const projects = await this.loadFile(filePath);
        const createdTasks = [];
    
        for (const taskData of tasks) {
            const { projectId, parentTaskId, text } = taskData;
            
            // Handle project identification by either numeric ID or name
            let projectIndex;
            if (/^\d+$/.test(projectId)) {
                // Numeric ID (1-based)
                projectIndex = parseInt(projectId) - 1;
            } else {
                // Project name
                const projectInfo = this.findProjectByName(projects, projectId);
                if (!projectInfo) {
                    throw new Error(`Project not found: ${projectId}`);
                }
                projectIndex = projectInfo.index;
            }
            
            if (projectIndex < 0 || projectIndex >= projects.length) {
                throw new Error(`Invalid project index: ${projectIndex + 1}`);
            }
    
            const newTask = new Task(text);
            newTask.status = 'uncompleted';
            newTask.tasks = [];
            newTask.tags = [];
    
            if (parentTaskId) {
                const parentTask = this.findTaskById(projects, parentTaskId);
                if (!parentTask) {
                    throw new Error(`Parent task not found: ${parentTaskId}`);
                }
                parentTask.tasks = parentTask.tasks || [];
                parentTask.tasks.push(newTask);
                // Calculate the new task's ID (parent.tasks.length)
                const taskId = `${parentTaskId}.${parentTask.tasks.length}`;
                createdTasks.push({ task: newTask, taskId });
            } else {
                const project = projects[projectIndex];
                project.tasks = project.tasks || [];
                project.tasks.push(newTask);
                // Calculate the new task's ID (project.taskIndex)
                const taskId = `${projectIndex + 1}.${project.tasks.length}`;
                createdTasks.push({ task: newTask, taskId });
            }
        }
    
        await this.saveFile(filePath, projects);
        return createdTasks;
    }

 
    async deleteItems(filePath, itemIds) {
        const projects = await this.loadFile(filePath);
        const deletedItems = [];
        
        // Sort itemIds in reverse order to handle index shifts
        const sortedItemIds = [...itemIds].sort((a, b) => {
            const aSegments = a.split('.').map(Number);
            const bSegments = b.split('.').map(Number);
            
            // Compare each segment
            for (let i = 0; i < Math.min(aSegments.length, bSegments.length); i++) {
                if (aSegments[i] !== bSegments[i]) {
                    return bSegments[i] - aSegments[i]; // Reverse order
                }
            }
            return bSegments.length - aSegments.length; // Longer IDs (subtasks) come first
        });
    
        for (const itemId of sortedItemIds) {
            const segments = itemId.split('.');
            
            // If only one segment, it's a project
            if (segments.length === 1) {
                const projectIndex = parseInt(segments[0]) - 1;
                if (projectIndex >= 0 && projectIndex < projects.length) {
                    const deletedProject = projects.splice(projectIndex, 1)[0];
                    deletedItems.push({
                        type: 'project',
                        id: itemId,
                        item: deletedProject
                    });
                }
            } else {
                // It's a task or subtask
                const projectIndex = parseInt(segments[0]) - 1;
                if (projectIndex >= 0 && projectIndex < projects.length) {
                    const project = projects[projectIndex];
                    
                    // If two segments, it's a top-level task
                    if (segments.length === 2) {
                        const taskIndex = parseInt(segments[1]) - 1;
                        if (taskIndex >= 0 && taskIndex < project.tasks.length) {
                            const deletedTask = project.tasks.splice(taskIndex, 1)[0];
                            deletedItems.push({
                                type: 'task',
                                id: itemId,
                                item: deletedTask
                            });
                        }
                    } else {
                        // It's a subtask, find parent task first
                        const parentTask = this.findTaskById(projects, segments.slice(0, -1).join('.'));
                        if (parentTask && parentTask.tasks) {
                            const subtaskIndex = parseInt(segments[segments.length - 1]) - 1;
                            if (subtaskIndex >= 0 && subtaskIndex < parentTask.tasks.length) {
                                const deletedSubtask = parentTask.tasks.splice(subtaskIndex, 1)[0];
                                deletedItems.push({
                                    type: 'subtask',
                                    id: itemId,
                                    item: deletedSubtask
                                });
                            }
                        }
                    }
                }
            }
        }
    
        if (deletedItems.length > 0) {
            await this.saveFile(filePath, projects);
        }
    
        return deletedItems;
    }
}

// Make sure to export the class properly
module.exports = TodoService;