const Action = require('./Action');

class EmailAction extends Action {
    constructor() {
        super();
        this.name = 'email';
        this.description = 'Email action';
    }

    async execute(task, parameters) {
        throw new Error('Not implemented');
    }
}

module.exports = EmailAction;