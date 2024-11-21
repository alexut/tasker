const request = require('supertest');
const express = require('express');
const actionRoutes = require('../../src/api/routes/action.routes');

describe('CMD Action Integration Tests', () => {
    let app;

    beforeEach(async () => {
        app = express();
        app.use(express.json());
        app.use('/api/actions', actionRoutes);
    });

    test('executes simple echo command', async () => {
        const response = await request(app)
            .post('/api/actions/execute')
            .send({
                action: 'cmd',
                parameters: 'echo "test"'
            });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            success: true,
            stdout: 'test',
            stderr: ''
        });
    });

    test('handles command errors gracefully', async () => {
        const response = await request(app)
            .post('/api/actions/execute')
            .send({
                action: 'cmd',
                parameters: 'nonexistentcommand'
            });

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
            success: false,
            error: expect.stringContaining('Command execution failed')
        });
    });

    test('validates command parameters', async () => {
        const response = await request(app)
            .post('/api/actions/execute')
            .send({
                action: 'cmd',
                parameters: ''
            });

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
            success: false,
            error: expect.stringContaining('Command parameters must be a non-empty string')
        });
    });
});
