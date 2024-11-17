const express = require('express');
const TodoService = require('../../services/TodoService');

const router = express.Router();
const todoService = new TodoService();

router.get('/', async (req, res) => {
    try {
        const files = await todoService.listFiles();
        res.json({ files });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/health', (req, res) => {
    console.log('Health check requested on API server');
    res.json({ status: 'ok', server: 'api' });
});

router.get('/actions', async (req, res) => {
    try {
        const actions = await todoService.listAvailableActions();
        res.json({ actions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:filePath', async (req, res) => {
    try {
        const projects = await todoService.loadFile(req.params.filePath);
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.patch('/:filePath/tasks/:taskId', async (req, res) => {
    console.log('PATCH Request received:', {
        filePath: req.params.filePath,
        taskId: req.params.taskId,
        body: req.body,
        headers: req.headers
    });

    try {
        // Add request body validation
        if (!req.body || (req.body.status === undefined && !req.body.text && !req.body.addTag && !req.body.removeTag)) {
            console.error('Invalid request body:', req.body);
            return res.status(400).json({ error: 'Invalid request body' });
        }

        console.log('Processing task update...');
        const task = await todoService.updateTask(
            req.params.filePath,
            req.params.taskId,
            req.body
        );

        console.log('Task updated successfully:', task);
        res.json(task);
    } catch (error) {
        console.error('Error in PATCH route:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/:filePath/tasks/:taskId/execute', async (req, res) => {
    try {
        const task = await todoService.executeTaskActions(
            req.params.filePath,
            req.params.taskId
        );
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;