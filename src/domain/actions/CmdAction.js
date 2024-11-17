const { exec } = require('child_process');
const Action = require('./Action');

class CmdAction extends Action {
    constructor() {
        super();
        this.name = 'cmd';
        this.description = 'Execute a command in the console';
    }

    validateParameters(parameters) {
        if (!parameters || typeof parameters !== 'string' || parameters.trim().length === 0) {
            throw new Error('Command parameters must be a non-empty string');
        }
        return true;
    }

    cleanOutput(output) {
        if (!output) return '';
        // Remove surrounding quotes and normalize line endings
        output = output.replace(/\r\n/g, '\n').trim();
        if (output.startsWith('"') && output.endsWith('"')) {
            output = output.slice(1, -1);
        }
        return output;
    }

    async execute(task, parameters) {
        this.validateParameters(parameters);
        
        return new Promise((resolve, reject) => {
            console.log(`[CmdAction] Executing: ${parameters}`);
            
            exec(parameters, (error, stdout, stderr) => {
                if (error) {
                    const errorMessage = this.cleanOutput(stderr) || error.message;
                    console.error(`[CmdAction] Failed: ${errorMessage}`);
                    reject({
                        message: `Command execution failed: ${errorMessage}`,
                        code: error.code || 1,
                        command: parameters,
                        stderr: this.cleanOutput(stderr)
                    });
                } else {
                    const cleanStdout = this.cleanOutput(stdout);
                    if (cleanStdout) console.log(`[CmdAction] Output: ${cleanStdout}`);
                    resolve({
                        stdout: cleanStdout,
                        stderr: this.cleanOutput(stderr)
                    });
                }
            });
        });
    }
}

module.exports = CmdAction;
