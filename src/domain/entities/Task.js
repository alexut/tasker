// src/domain/entities/Task.js
const config = require('../../config');
const TaskBase = require('./TaskBase');

/**
 * Task entity with extended functionality
 * @extends TaskBase
 */
class Task extends TaskBase {
    /**
     * @param {string} text - Task description
     * @param {string} [status='uncompleted'] - Task status
     * @param {Task[]} [tasks=[]] - Subtasks
     * @param {string} [note=''] - Additional notes
     */
    constructor(text, status = 'uncompleted', tasks = [], note = '') {
        super(text, status, tasks, note);
    }

    /** @returns {boolean} Whether the task is completed */
    get completed() {
        return this.status === 'completed';
    }

    /** @returns {string} The status symbol from config */
    get symbol() {
        return config.symbols[this.status];
    }

    /** Toggle the task status between completed and uncompleted */
    toggleStatus() {
        if (this.status === 'completed') {
            this.status = 'uncompleted';
        } else {
            this.status = 'completed';
        }
    }

    /**
     * Add a tag to the task
     * @param {string} name - Tag name
     * @param {string} value - Tag value
     */
    addTag(name, value) {
        this.tags.push({ name, value });
    }

    /**
     * Remove a tag by name
     * @param {string} name - Tag name to remove
     */
    removeTag(name) {
        this.tags = this.tags.filter(tag => tag.name !== name);
    }

    /**
     * Set the task note
     * @param {string} note - New note content
     */
    setNote(note) {
        this.note = note;
    }
}

module.exports = Task;