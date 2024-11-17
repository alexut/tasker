const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const todoRoutes = require('./api/routes/todo.routes');
const actionRoutes = require('./api/routes/action.routes');

const app = express();
const server = http.createServer(app);

// Create WebSocket server attached to /photopea endpoint
const wss = new WebSocket.Server({ 
    server,
    path: '/photopea'
});

// Store active WebSocket connections
const connections = new Map();

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
    const id = Date.now().toString();
    connections.set(id, ws);

    // Send connection ID back to client
    ws.send(JSON.stringify({ type: 'connection', id }));

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received message type:', data.type);

            if (data.type === 'save') {
                console.log('Processing save request:', {
                    format: data.format,
                    path: data.path,
                    dataLength: data.data ? data.data.length : 0
                });

                // Ensure output directory exists
                const dir = path.dirname(data.path);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }

                // Convert array back to buffer and save
                const buffer = Buffer.from(data.data);
                console.log('Buffer created with size:', buffer.length);
                
                fs.writeFileSync(data.path, buffer);
                console.log(`File saved successfully to: ${data.path}`);

                ws.send(JSON.stringify({ 
                    type: 'save_complete',
                    path: data.path
                }));
            }
        } catch (error) {
            console.error('Error handling message:', error);
            ws.send(JSON.stringify({ 
                type: 'error',
                message: error.message
            }));
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected:', id);
        connections.delete(id);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        connections.delete(id);
    });
});

// Function to send command to specific Photopea instance
function sendToPhotopea(connectionId, script) {
    const ws = connections.get(connectionId);
    if (ws && ws.readyState === WebSocket.OPEN) {
        try {
            ws.send(script);
            return true;
        } catch (error) {
            console.error('Error sending to Photopea:', error);
            return false;
        }
    }
    return false;
}

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/todos', todoRoutes);
app.use('/api/actions', actionRoutes);

// Handle API requests
app.post('/api/action/:action', (req, res) => {
    const { action } = req.params;
    const { connectionId, parameters } = req.body;

    try {
        if (!connectionId) {
            throw new Error('Connection ID is required');
        }

        if (action === 'photoshop') {
            const params = JSON.parse(parameters);
            const script = PhotoshopAction.generatePhotopeaScript(params.command, params);
            sendToPhotopea(connectionId, script);
            res.json({ success: true });
        } else {
            throw new Error(`Unknown action: ${action}`);
        }
    } catch (error) {
        console.error('API error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: err.message });
});

// Only start the server if not in test environment
if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`WebSocket server running at ws://localhost:${PORT}/photopea`);
    });
}

module.exports = { 
    app,
    sendToPhotopea,
    connections 
};