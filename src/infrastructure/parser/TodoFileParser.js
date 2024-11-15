const config = require('../../config');
const Project = require('../../domain/entities/Project');
const Task = require('../../domain/entities/Task');

class TodoFileParser {
    constructor() {
        this.config = config;
    }

    getStatusFromSymbol(symbol) {
        const symbols = this.config.symbols;
        for (const [status, statusSymbol] of Object.entries(symbols)) {
            if (statusSymbol === symbol) return status;
        }
        return 'uncompleted';
    }

    extractTags(text) {
        const tagSymbol = this.config.symbols.tags;
        const tagRegex = new RegExp(`\\${tagSymbol}(\\w+)\\((.*?)\\)`, 'g');
        const tags = [];
        let match;

        while ((match = tagRegex.exec(text)) !== null) {
            tags.push({
                name: match[1],
                value: match[2]
            });
        }

        return tags;
    }

    extractActions(text) {
        const actionSymbol = this.config.symbols.actions;
        const actionRegex = new RegExp(`\\${actionSymbol}(\\w+)\\((.*?)\\)`, 'g');
        const actions = [];
        let match;

        while ((match = actionRegex.exec(text)) !== null) {
            actions.push({
                type: match[1],
                params: match[2]
            });
        }

        return actions;
    }

    extractOracles(text) {
        const oracleSymbol = this.config.symbols.oracles;
        const oracleRegex = new RegExp(`\\${oracleSymbol}(\\w+)\\((.*?)\\)`, 'g');
        const oracles = [];
        let match;

        while ((match = oracleRegex.exec(text)) !== null) {
            oracles.push({
                type: match[1],
                params: match[2]
            });
        }

        return oracles;
    }


    parse(content) {
        const lines = content.split('\n');
        const projects = [];
        let currentProject = null;
        let taskStack = [];
        let currentTask = null;
        let previousLineType = null;
    
        lines.forEach((line, index) => {
            const indent = line.search(/\S/);
            const trimmed = line.trim();
    
            if (!trimmed) {
                // Empty line, skip
                previousLineType = 'empty';
                return;
            }
    
            if (trimmed.endsWith(':')) {
                // Project line
                currentProject = new Project(trimmed.slice(0, -1));
                projects.push(currentProject);
                taskStack = [];
                currentTask = null;
                previousLineType = 'project';
            } else {
                const symbols = Object.values(this.config.symbols);
                const symbolMatch = symbols.find(symbol => trimmed.startsWith(symbol));
    
                if (symbolMatch) {
                    // Task line
                    const status = this.getStatusFromSymbol(symbolMatch);
                    const taskText = trimmed.slice(symbolMatch.length).trim();
                    const task = new Task(taskText, status);
    
                    task.tags = this.extractTags(taskText);
                    task.actions = this.extractActions(taskText);
                    task.oracles = this.extractOracles(taskText);
    
                    // Adjust task stack based on indentation
                    while (taskStack.length > 0 && taskStack[taskStack.length - 1].indent >= indent) {
                        taskStack.pop();
                    }
    
                    if (taskStack.length === 0) {
                        currentProject.tasks.push(task);
                    } else {
                        taskStack[taskStack.length - 1].task.tasks.push(task);
                    }
    
                    taskStack.push({ task, indent });
                    currentTask = task;
                    previousLineType = 'task';
                } else if (currentTask && (previousLineType === 'task' || previousLineType === 'note')) {
                    // Note line
                    // Lines following a task or note, at the same or greater indentation, are considered notes
                    if (indent >= taskStack[taskStack.length - 1].indent) {
                        if (currentTask.note) {
                            currentTask.note += '\n' + trimmed;
                        } else {
                            currentTask.note = trimmed;
                        }
                        previousLineType = 'note';
                    } else {
                        // Not a note, reset currentTask
                        currentTask = null;
                        previousLineType = 'other';
                    }
                } else {
                    // Unrecognized line, reset currentTask
                    currentTask = null;
                    previousLineType = 'other';
                }
            }
        });
        return projects;
    }
    
    serialize(projects) {
        let output = '';

        projects.forEach(project => {
            output += `${project.name}:\n`;
            project.tasks.forEach(task => {
                output += this.serializeTask(task, 1);
            });
        });

        return output;
    }

    serializeTask(task, level) {
        const indent = '    '.repeat(level);
        let output = `${indent}${task.symbol} ${task.text}\n`;
    
        // Do not append tags, actions, or oracles here since they are already in task.text
    
        // Add notes immediately after the task
        if (task.note) {
            const noteLines = task.note.split('\n');
            noteLines.forEach(line => {
                output += `${indent}${line}\n`;
            });
        }
    
        // Add subtasks
        task.tasks.forEach(subtask => {
            output += this.serializeTask(subtask, level + 1);
        });
    
        return output;
    }
}

module.exports = TodoFileParser;