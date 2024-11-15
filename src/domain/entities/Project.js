// src/domain/entities/Project.js
class Project {
    constructor(name, tasks = []) {
        this.name = name;
        this.tasks = tasks || [];
    }
}

module.exports = Project;