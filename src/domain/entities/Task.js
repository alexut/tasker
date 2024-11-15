// src/domain/entities/Task.js
const config = require('../../config');

class Task {
    constructor(text, status = 'uncompleted', tasks = [], note = '') {
        this.text = text;
        this.status = status;
        this.tasks = tasks || [];
        this.note = note || '';
        this.tags = [];
        this.actions = [];
        this.oracles = [];
    }

    get completed() {
        return this.status === 'completed';
    }

    get symbol() {
        return config.symbols[this.status];
    }

    toggleStatus() {
        if (this.status === 'completed') {
            this.status = 'uncompleted';
        } else {
            this.status = 'completed';
        }
    }

    addTag(name, value) {
        this.tags.push({ name, value });
    }

    removeTag(name) {
        this.tags = this.tags.filter(tag => tag.name !== name);
    }

    setNote(note) {
        this.note = note;
    }
}

module.exports = Task;