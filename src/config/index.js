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
        format: "YYYY-MM-DD HH:mm",
        timezone: "Europe/Bucharest",
        locale: "ro",
        basePath: process.env.TODO_BASE_PATH || "c:/hub" // Add this line
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