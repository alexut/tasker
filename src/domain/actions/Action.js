class Action {
    constructor() {
        this.name = 'base';
        this.description = 'Base action';
    }

    async execute(task, parameters) {
        throw new Error('Execute method must be implemented by child classes');
    }

    validateParameters(parameters) {
        return true; // Base implementation accepts any parameters
    }

    getDescription() {
        return this.description;
    }
}

module.exports = Action;
