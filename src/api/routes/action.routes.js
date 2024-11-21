const express = require('express');
const router = express.Router();
const CmdAction = require('../../domain/actions/CmdAction');
const GetEmailAction = require('../../domain/actions/GetEmailAction');
const SendEmailAction = require('../../domain/actions/SendEmailAction');
const TrashEmailAction = require('../../domain/actions/TrashEmailAction');
const BrowserAction = require('../../domain/actions/BrowserAction');
const PhotoshopAction = require('../../domain/actions/PhotoshopAction');
const FileSystemAction = require('../../domain/actions/FileSystemAction');

// Create single instance of PhotoshopAction
const photoshopAction = new PhotoshopAction();
const fileSystemAction = new FileSystemAction();

const actions = {
    'cmd': new CmdAction(),
    'get_email': new GetEmailAction(),
    'send_email': new SendEmailAction(),
    'trash_email': new TrashEmailAction(),
    'browser': new BrowserAction(),
    'photoshop': photoshopAction,
    'filesystem': fileSystemAction
};

// Get list of available actions
router.get('/', (req, res) => {
    const actionList = Object.values(actions).map(action => ({
        name: action.name,
        description: action.description
    }));
    res.json({ actions: actionList });
});

// Execute an action
router.post('/execute', async (req, res) => {
    console.log('Received request body:', JSON.stringify(req.body, null, 2));
    
    const { action, parameters } = req.body;
    
    if (!action || !actions[action]) {
        console.error('Invalid action:', { action, body: req.body });
        return res.status(400).json({ 
            error: `Invalid action. Action must be one of: ${Object.keys(actions).join(', ')}`,
            receivedAction: action
        });
    }

    try {
        console.log(`Executing ${action} with parameters:`, parameters);
        const result = await actions[action].execute(null, parameters);
        
        // Special handling for cmd action which returns stdout/stderr
        if (action === 'cmd') {
            res.json({
                success: true,
                stdout: result.stdout,
                stderr: result.stderr
            });
        } else {
            res.json({
                type: action,
                success: true,
                result
            });
        }
    } catch (error) {
        console.error(`[${action}Action] Error:`, error);
        
        // Handle cmd action errors which include more details
        if (action === 'cmd' && error.code !== undefined) {
            res.status(400).json({
                success: false,
                error: error.message,
                stderr: error.stderr,
                code: error.code
            });
        } else {
            res.status(400).json({
                type: action,
                success: false,
                error: error.message || 'Unknown error occurred'
            });
        }
    }
});

module.exports = router;
