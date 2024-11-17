const express = require('express');
const router = express.Router();
const CmdAction = require('../../domain/actions/CmdAction');
const GetEmailAction = require('../../domain/actions/GetEmailAction');
const SendEmailAction = require('../../domain/actions/SendEmailAction');
const TrashEmailAction = require('../../domain/actions/TrashEmailAction');
const BrowserAction = require('../../domain/actions/BrowserAction');
const PhotoshopAction = require('../../domain/actions/PhotoshopAction');

const actions = {
    'cmd': new CmdAction(),
    'get_email': new GetEmailAction(),
    'send_email': new SendEmailAction(),
    'trash_email': new TrashEmailAction(),
    'browser': new BrowserAction(),
    'photoshop': new PhotoshopAction()
};

// Create single instance of PhotoshopAction
const photoshopAction = new PhotoshopAction();

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
    const { action: actionType, parameters } = req.body;

    if (!actionType || !actions[actionType]) {
        return res.status(400).json({ error: `Unknown action type: ${actionType}` });
    }

    try {
        if (actionType === 'photoshop') {
            const result = await photoshopAction.execute(null, parameters);
            res.json({
                type: actionType,
                success: true,
                result
            });
        } else {
            const action = actions[actionType];
            const result = await action.execute(null, parameters);
            res.json({
                type: actionType,
                success: true,
                result
            });
        }
    } catch (error) {
        res.status(400).json({
            type: actionType,
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
