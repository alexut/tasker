const express = require('express');
const router = express.Router();
const Oracle = require('../../domain/oracles/Oracle');

// Create oracle instance
const oracle = new Oracle();

// Get list of available oracles
router.get('/', async (req, res) => {
    try {
        const oracles = await oracle.listOracles();
        res.json({ oracles });
    } catch (error) {
        console.error('Error listing oracles:', error);
        res.status(500).json({ error: error.message });
    }
});

// Query an oracle
router.post('/query', async (req, res) => {
    try {
        const { name, path = '', parameters = {} } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Oracle name is required' });
        }

        const result = await oracle.queryOracle(name, path, parameters);
        res.json({ result });
    } catch (error) {
        console.error('Error querying oracle:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
