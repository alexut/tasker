const { exec } = require('child_process');
const Action = require('./Action');
const path = require('path');
const fs = require('fs');
const config = require('../../config');

class PhotoshopAction extends Action {
    constructor() {
        super();
        this.name = 'photoshop';
        this.description = 'Create and manipulate PSD files using Photopea';
        this.activeFile = null;
        this.activeConnection = null;
        this.browserAction = new (require('./BrowserAction'))();
    }

    validateParameters(parameters) {
        if (!parameters || typeof parameters !== 'string') {
            throw new Error('Photoshop parameters must be provided');
        }
        return true;
    }

    generatePhotopeaScript(command, params) {
        const scripts = {
            create: ({ width, height, name }) => {
                this.activeFile = name;
                return `
                    app.documents.add(${width}, ${height}, 72, "${name}", NewDocumentMode.RGB);
                    app.echoToOE("create_complete");
                `;
            },
            addText: ({ text, x, y, size, color }) => {
                return `
                    var layer = app.activeDocument.artLayers.add();
                    layer.kind = LayerKind.TEXT;
                    layer.textItem.contents = "${text}";
                    layer.textItem.position = [${x}, ${y}];
                    layer.textItem.size = ${size || 20};
                    layer.textItem.color = ${JSON.stringify(color || [0, 0, 0])};
                `;
            },
            // TODO: addImage correctly see reference: https://www.photopea.com/api/live check demo 3, click button mutliple times
            addImage: ({ imagePath, x, y, width, height }) => {
                // Validate image path
                if (!imagePath) {
                    throw new Error('Image path is required');
                }

                // Convert to served URL (imagePath is now relative to hub)
                const relativePath = path.normalize(imagePath).replace(/\\/g, '/');
                const imageUrl = `https://mediabit.go.ro/hub/${relativePath}`;

                return `
                    // Load the image as a smart object
                    app.load("${imageUrl}");
                    var imageLayer = app.activeDocument.activeLayer;
                    imageLayer.translate(${x}, ${y});
                    ${width && height ? `imageLayer.resize(${width}, ${height});` : ''}
                    app.echoToOE("image_added");
                `;
            },
            save: ({ format = "psd" }) => {
                return `app.activeDocument.saveToOE("${format}")`;
            }
        };

        return scripts[command](params);
    }

    async execute(task, parameters) {
        try {
            console.log('PhotoshopAction execute called with:', {
                task,
                parameters
            });
            // Parse parameters
            const params = JSON.parse(parameters);
            console.log('Parsed parameters:', params);

            const script = this.generatePhotopeaScript(params.command, params);
            console.log('Generated script:', script);

            // If this is a create command or no active connection, start new browser
            if (params.command === 'create' || !this.activeConnection) {
                const htmlPath = 'https://mediabit.go.ro/photopea.html';
                await this.browserAction.execute(task, `"${htmlPath}", 1920, 1080, 0, 0`);
                
                // Give time for WebSocket connection
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Get the latest connection
                const { connections } = require('../../server');
                const lastConnection = Array.from(connections.keys()).pop();
                if (lastConnection) {
                    this.activeConnection = lastConnection;
                    console.log('Connected to Photopea instance:', this.activeConnection);
                } else {
                    throw new Error('Failed to establish WebSocket connection with Photopea');
                }
            }

            // Send script via WebSocket
            if (this.activeConnection) {
                const { sendToPhotopea } = require('../../server');
                console.log('Sending to Photopea:', {
                    connectionId: this.activeConnection,
                    script,
                    params
                });
                const sent = sendToPhotopea(this.activeConnection, script, params);
                if (!sent) {
                    throw new Error('Failed to send command to Photopea');
                }
            } else {
                throw new Error('No active Photopea connection');
            }

            return { success: true };
        } catch (error) {
            console.error('Photoshop action error:', error);
            throw error;
        }
    }
}

module.exports = PhotoshopAction;
