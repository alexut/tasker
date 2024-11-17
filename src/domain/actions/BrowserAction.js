const { exec } = require('child_process');
const Action = require('./Action');

class BrowserAction extends Action {
    constructor() {
        super();
        this.name = 'browser';
        this.description = 'Open browser window with specific size and position';
    }

    validateParameters(parameters) {
        console.log('Validating parameters:', parameters);
        if (!parameters || typeof parameters !== 'string') {
            console.error('Invalid parameters type:', typeof parameters);
            throw new Error('Browser parameters must be provided');
        }
        return true;
    }

    async execute(task, parameters) {
        console.log('BrowserAction.execute called with:', { task, parameters });
        
        try {
            this.validateParameters(parameters);
            
            console.log('Attempting to parse parameters');
            const paramMatch = parameters.match(/\"([^\"]+)\"\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
            if (!paramMatch) {
                console.error('Parameter parsing failed. Input:', parameters);
                throw new Error('Invalid parameter format. Expected: "url", width, height, x, y');
            }

            const [_, url, width, height, x, y] = paramMatch;
            console.log('Parsed parameters:', { url, width, height, x, y });

            // Direct command using start command
            const command = `start chrome --new-window "${url}" --window-position=${x},${y} --window-size=${width},${height}`;
            console.log('Generated command:', command);

            return new Promise((resolve, reject) => {
                console.log('Executing command...');
                exec(command, { timeout: 10000, shell: true }, (error, stdout, stderr) => {
                    if (error) {
                        console.error('Browser action error:', error);
                        console.error('Command stderr:', stderr);
                        reject(error);
                        return;
                    }
                    console.log('Command stdout:', stdout);
                    if (stderr) {
                        console.log('Command stderr:', stderr);
                    }

                    resolve({
                        success: true,
                        message: `Opened ${url} at position ${x},${y} with size ${width}x${height}`,
                        details: {
                            stdout,
                            stderr,
                            command
                        }
                    });
                });
            });
        } catch (error) {
            console.error('BrowserAction execution failed:', error);
            throw error;
        }
    }
}

module.exports = BrowserAction;
