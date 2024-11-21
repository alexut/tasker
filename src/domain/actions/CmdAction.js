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
        // Remove any surrounding quotes if present
        parameters = parameters.trim();
        if ((parameters.startsWith('"') && parameters.endsWith('"')) || 
            (parameters.startsWith("'") && parameters.endsWith("'"))) {
            parameters = parameters.slice(1, -1);
        }
        return parameters;
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
        parameters = this.validateParameters(parameters);
        
        return new Promise((resolve, reject) => {
            console.log(`[CmdAction] Executing command: ${parameters}`);
            
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
                    const cleanStderr = this.cleanOutput(stderr);
                    if (cleanStdout) console.log(`[CmdAction] Output: ${cleanStdout}`);
                    if (cleanStderr) console.log(`[CmdAction] Stderr: ${cleanStderr}`);
                    resolve({
                        stdout: cleanStdout,
                        stderr: cleanStderr
                    });
                }
            });
        });
    }
}

module.exports = CmdAction;
