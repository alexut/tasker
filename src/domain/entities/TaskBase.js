/**
 * @typedef {Object} TaskTag
 * @property {string} name - The tag name
 * @property {string} value - The tag value
 */

/**
 * Base task properties to avoid circular references
 * @typedef {Object} TaskBase
 * @property {string} text - The task description
 * @property {string} status - Task status ('completed' or 'uncompleted')
 * @property {TaskBase[]} tasks - Subtasks
 * @property {string} note - Additional notes
 * @property {TaskTag[]} tags - Task tags
 * @property {string[]} actions - Task action IDs
 * @property {string[]} oracles - Task oracle IDs
 */

class TaskBase {
    /**
     * @param {string} text - Task description
     * @param {string} [status='uncompleted'] - Task status
     * @param {TaskBase[]} [tasks=[]] - Subtasks
     * @param {string} [note=''] - Additional notes
     */
    constructor(text, status = 'uncompleted', tasks = [], note = '') {
        this.text = text;
        this.status = status;
        this.tasks = tasks;
        this.note = note;
        this.tags = [];
        this.actions = [];
        this.oracles = [];
    }
}

module.exports = TaskBase;
