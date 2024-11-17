const CmdAction = require('./CmdAction');

class ActionRegistry {
    constructor() {
        this.actions = new Map();
        this.registerDefaultActions();
    }

    registerDefaultActions() {
        this.registerAction(new CmdAction());
        // Register other actions here as they are created
    }

    registerAction(action) {
        if (!action.name || !action.execute) {
            throw new Error('Invalid action: must have name and execute method');
        }
        this.actions.set(action.name, action);
    }

    getAction(name) {
        const action = this.actions.get(name);
        if (!action) {
            throw new Error(`Action not found: ${name}`);
        }
        return action;
    }

    async executeAction(actionName, task, parameters) {
        const action = this.getAction(actionName);
        return await action.execute(task, parameters);
    }

    listActions() {
        return Array.from(this.actions.values()).map(action => ({
            name: action.name,
            description: action.description
        }));
    }
}

module.exports = ActionRegistry;
