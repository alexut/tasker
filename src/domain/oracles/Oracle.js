const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const config = require('../../config');
const oracleConfig = require('../../config/oracles.config');

class Oracle {
    constructor() {
        this.config = config;
        this.basePath = this.config.settings.basePath;
        console.log('Oracle basePath:', this.basePath);
    }

    async listOracles() {
        const oracles = [];

        for (const [name, relativePath] of Object.entries(oracleConfig.oracles)) {
            const fullPath = path.join(this.basePath, relativePath);
            console.log('Checking oracle:', name, 'at path:', fullPath);
            
            if (!fs.existsSync(fullPath)) {
                console.warn(`Oracle file not found: ${fullPath}`);
                continue;
            }

            const content = fs.readFileSync(fullPath, 'utf8');
            const lines = content.split('\n');

            // Get oracle metadata
            const params = lines.find(line => 
                line.trim().startsWith(`${this.config.symbols.oracles} Parameters:`)
            )?.trim().substring(this.config.symbols.oracles.length + 12).trim();

            const returns = lines.find(line => 
                line.trim().startsWith(`${this.config.symbols.oracles} Returns:`)
            )?.trim().substring(this.config.symbols.oracles.length + 9).trim();

            // Determine oracle type
            let type;
            if (relativePath.endsWith('.oracle')) {
                type = 'script';
            } else if (relativePath.endsWith('.csv')) {
                type = 'csv';
            } else if (relativePath.endsWith('.json')) {
                type = 'json';
            }

            oracles.push({
                name,
                type,
                file: fullPath,
                parameters: params,
                returns
            });
        }

        console.log('Found oracles:', oracles);
        return oracles;
    }

    async queryOracle(name, queryPath = '', parameters = {}) {
        const relativePath = oracleConfig.oracles[name];
        
        if (!relativePath) {
            throw new Error(`Oracle '${name}' not found`);
        }

        const fullPath = path.join(this.basePath, relativePath);
        console.log('Querying oracle:', name, 'at path:', fullPath);
        
        if (!fs.existsSync(fullPath)) {
            throw new Error(`Oracle file not found: ${fullPath}`);
        }

        // Determine oracle type from file extension
        if (relativePath.endsWith('.oracle')) {
            return this.executeScript(fullPath, queryPath, parameters);
        } else if (relativePath.endsWith('.csv')) {
            return this.queryCsv(fullPath, queryPath, parameters);
        } else if (relativePath.endsWith('.json')) {
            return this.queryJson(fullPath, queryPath, parameters);
        }

        throw new Error(`Unknown oracle type for file: ${relativePath}`);
    }

    async executeScript(filePath, queryPath, parameters) {
        // Handle currency converter parameters
        if (filePath.includes('cursvalutar.oracle')) {
            const { amount = 1, from = 'EUR', to = 'RON', date } = parameters;
            const args = [amount, from, to, date].filter(Boolean);
            console.log('Executing currency script with args:', args);

            // Read the script content
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Create a temporary file without comments/shebang
            const tempFile = path.join(path.dirname(filePath), '_temp_' + path.basename(filePath));
            const lines = content.split('\n');
            const scriptContent = lines
                .filter(line => !line.trim().startsWith('#') && !line.trim().startsWith('#!/'))
                .join('\n');
            fs.writeFileSync(tempFile, scriptContent);

            try {
                const { stdout } = await execPromise(`node "${tempFile}" ${args.join(' ')}`);
                return stdout.trim();
            } finally {
                // Clean up temp file
                fs.unlinkSync(tempFile);
            }
        }

        // Handle other script oracles
        const match = queryPath.match(/(\w+)\(([^:]+)?:?([^)]+)?\)/);
        if (!match) {
            throw new Error('Invalid oracle path format. Expected: function(parameters:answer)');
        }

        const [_, functionName, functionParams, expectedAnswer] = match;
        const args = Object.values(parameters).join(' ');

        // Read the script content
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Create a temporary file without comments/shebang
        const tempFile = path.join(path.dirname(filePath), '_temp_' + path.basename(filePath));
        const lines = content.split('\n');
        const scriptContent = lines
            .filter(line => !line.trim().startsWith('#') && !line.trim().startsWith('#!/'))
            .join('\n');
        fs.writeFileSync(tempFile, scriptContent);

        try {
            const { stdout } = await execPromise(`node "${tempFile}" ${functionName} ${args}`);
            
            // Verify answer if expected
            if (expectedAnswer && stdout.trim() !== expectedAnswer) {
                throw new Error(`Unexpected oracle answer. Expected: ${expectedAnswer}, Got: ${stdout.trim()}`);
            }

            return stdout.trim();
        } finally {
            // Clean up temp file
            fs.unlinkSync(tempFile);
        }
    }

    async queryJson(filePath, queryPath, parameters) {
        // path format: propriety-name(value).propriety-name(value).(parameters-answer)
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        let data = content;

        if (!queryPath) {
            return data;
        }

        // Parse path segments
        const segments = queryPath.split('.');
        for (const segment of segments) {
            const match = segment.match(/(\w+)\(([^)]+)\)/);
            if (!match) {
                throw new Error(`Invalid path segment: ${segment}`);
            }

            const [_, prop, value] = match;
            console.log('JSON path segment:', { prop, value, currentData: data });
            
            if (!data[prop]) {
                throw new Error(`Path not found: ${segment}`);
            }

            if (Array.isArray(data[prop])) {
                if (value === 'last') {
                    data = data[prop][data[prop].length - 1];
                } else if (!isNaN(value)) {
                    data = data[prop][parseInt(value)];
                } else {
                    // Remove quotes from value
                    const searchValue = value.replace(/^"(.*)"$/, '$1');
                    data = data[prop].find(item => item.type === searchValue);
                }
            } else {
                data = data[prop];
            }

            if (!data) {
                throw new Error(`Path not found: ${segment}`);
            }
        }

        return data;
    }

    async queryCsv(filePath, queryPath, parameters) {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith(this.config.symbols.oracles));
        
        // Parse header
        const headers = lines[0].split(',').map(h => h.trim());
        
        // Parse data
        const data = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            return headers.reduce((obj, header, i) => {
                obj[header] = values[i];
                return obj;
            }, {});
        });

        if (!queryPath) {
            return data;
        }

        // Handle different path formats:
        // A4 - direct cell reference
        // column(A).row(4) - column/row reference
        // column("title") - column by name
        // row(last) - last row
        if (/^[A-Z]\d+$/.test(queryPath)) {
            // A4 format
            const col = queryPath.match(/[A-Z]/)[0];
            const row = parseInt(queryPath.match(/\d+/)[0]) - 1;
            const colIndex = col.charCodeAt(0) - 'A'.charCodeAt(0);
            return lines[row].split(',')[colIndex].trim();
        }

        const colMatch = queryPath.match(/column\(([^)]+)\)/);
        const rowMatch = queryPath.match(/row\(([^)]+)\)/);

        if (colMatch && rowMatch) {
            const col = colMatch[1];
            const row = rowMatch[1];

            let colIndex;
            if (col.match(/^[A-Z]$/)) {
                colIndex = col.charCodeAt(0) - 'A'.charCodeAt(0);
            } else {
                colIndex = headers.indexOf(col.replace(/"/g, ''));
            }

            let rowIndex;
            if (row === 'last') {
                rowIndex = data.length - 1;
            } else {
                rowIndex = parseInt(row) - 1;
            }

            return data[rowIndex][headers[colIndex]];
        }

        // Filter based on parameters
        return data.filter(item => {
            for (const [key, value] of Object.entries(parameters)) {
                if (item[key] !== value) return false;
            }
            return true;
        });
    }
}

module.exports = Oracle;
