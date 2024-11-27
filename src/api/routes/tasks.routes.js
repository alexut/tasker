const express = require('express');
const TodoService = require('../../services/TodoService');
const fs = require('fs').promises;
const path = require('path');

/**
 * @typedef {import('../../domain/entities/TaskBase').TaskBase} TaskBase
 * @typedef {import('../../domain/entities/Task')} Task
 */

const router = express.Router();
const todoService = new TodoService();

/**
 * Load tasks from a file
 * @route GET /tasks/load
 * @param {string} filepath - Path to the todo file
 * @returns {Task[]} Array of tasks
 */
router.get('/load', async (req, res) => {
    try {
        if (!req.query.filepath) {
            return res.status(400).json({ error: 'Missing required parameter: filepath' });
        }

        const projects = await todoService.loadFile(req.query.filepath);
        res.json(projects || []);
    } catch (error) {
        console.error('Error in GET /tasks/load route:', error);
        
        // Check if file doesn't exist
        if (error.message.includes('ENOENT')) {
            return res.status(404).json({ 
                error: `Todo file not found: ${req.query.filepath}`,
                code: 'FILE_NOT_FOUND'
            });
        }
        
        // Check if it's a parsing error
        if (error.message.includes('Failed to parse')) {
            return res.status(400).json({ 
                error: error.message,
                code: 'PARSE_ERROR'
            });
        }
        
        res.status(500).json({ 
            error: 'Internal server error while loading todo file',
            details: error.message,
            code: 'INTERNAL_ERROR'
        });
    }
});

/**
 * Update a task
 * @route PATCH /tasks/update
 * @param {string} filepath - Path to the todo file
 * @param {string} taskId - ID of the task to update
 * @param {TaskBase} body - Task properties to update
 * @returns {Task} Updated task
 */
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

/**
 * Create a new project
 * @route POST /tasks/project
 * @param {string} filepath - Path to the todo file
 * @param {Object} body - Request body
 * @param {string} body.name - Project name
 * @returns {Task} Created project task
 */
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

/**
 * Create tasks and subtasks
 * @route POST /tasks/create
 * @param {string} filepath - Path to the todo file
 * @param {Object} body - Request body
 * @param {Task[]} body.tasks - Array of tasks to create
 * @returns {Task[]} Created tasks
 */
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

/**
 * Delete projects, tasks, or subtasks by ID
 * @route POST /tasks/delete
 * @param {string} filepath - Path to the todo file
 * @param {Object} body - Request body
 * @param {string|string[]} body.itemIds - ID(s) of the item(s) to delete
 * @returns {Object} Deleted items
 */
router.post('/delete', async (req, res) => {
    try {
        const filepath = req.query.filepath;
        let itemIds = req.body.itemIds;

        // If itemIds is in query params, parse it
        if (req.query.itemIds) {
            try {
                itemIds = JSON.parse(req.query.itemIds);
            } catch (e) {
                // If parsing fails, try splitting by comma
                itemIds = req.query.itemIds.split(',');
            }
        }

        if (!filepath || !itemIds) {
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

        // Ensure itemIds is an array
        const itemIdsArray = Array.isArray(itemIds) ? itemIds : [itemIds];

        const deletedItems = await todoService.deleteItems(
            filepath,
            itemIdsArray
        );

        res.json(deletedItems);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
