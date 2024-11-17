const path = require('path');

const defaultConfig = {
    symbols: {
        completed: "[x]",
        underway: "[>]",
        paused: "[o]",
        uncompleted: "[ ]",
        tags: "@",
        actions: ">",
        oracles: "#"
    },
    settings: {
        format: 'YYYY-MM-DD',
        timezone: 'UTC',
        locale: 'en-US',
        basePath: process.env.TODO_BASE_PATH || "c:/hub"  // Use environment variable or default to c:/hub
    },
    debug: true
};

class Config {
    constructor(customConfig = {}) {
        this.config = {
            ...defaultConfig,
            ...customConfig
        };
    }

    get symbols() {
        return this.config.symbols;
    }

    get settings() {
        return this.config.settings;
    }

    get debug() {
        return this.config.debug;
    }
}

module.exports = new Config();