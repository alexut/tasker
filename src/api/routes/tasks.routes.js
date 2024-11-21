const express = require('express');
const TodoService = require('../../services/TodoService');

const router = express.Router();
const todoService = new TodoService();

// Load todo file
router.get('/load', async (req, res) => {
    try {
        const projects = await todoService.loadFile(req.query.filepath);
        res.json(projects);
    } catch (error) {
        console.error('Error in GET /tasks/load route:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update task
router.patch('/update', async (req, res) => {
    try {
        const task = await todoService.updateTask(
            req.query.filepath,
            req.query.taskId,
            req.body
        );
        res.json(task);
    } catch (error) {
        console.error('Error in PATCH /tasks/update route:', error);
        res.status(500).json({ error: error.message });
    }
});
// Create new project
router.post('/project', async (req, res) => {
    try {
        if (!req.query.filepath || !req.body.name) {
            return res.status(400).json({ error: 'Missing required parameters. Need filepath and project name.' });
        }

        const result = await todoService.createProject(
            req.query.filepath,
            req.body.name
        );

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create tasks and subtasks
router.post('/create', async (req, res) => {
    try {
        if (!req.query.filepath || !Array.isArray(req.body.tasks)) {
            return res.status(400).json({ 
                error: 'Missing required parameters. Need filepath and array of tasks.',
                example: {
                    tasks: [
                        { projectId: "1", text: "Task in first project" },
                        { projectId: "1", parentTaskId: "1.1", text: "Subtask under first task" },
                        { projectId: "2", text: "Task in second project" }
                    ]
                }
            });
        }

        const tasks = await todoService.createTasks(
            req.query.filepath,
            req.body.tasks
        );

        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete projects, tasks, or subtasks by ID
router.delete('/delete', async (req, res) => {
    try {
        if (!req.query.filepath || !Array.isArray(req.body.itemIds)) {
            return res.status(400).json({ 
                error: 'Missing required parameters. Need filepath and array of item IDs to delete.',
                example: {
                    itemIds: [
                        "1",      // Delete entire first project
                        "1.1",    // Delete first task of first project
                        "1.2.1"   // Delete first subtask of second task in first project
                    ]
                }
            });
        }

        const deletedItems = await todoService.deleteItems(
            req.query.filepath,
            req.body.itemIds
        );

        res.json(deletedItems);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
