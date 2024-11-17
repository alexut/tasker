const request = require('supertest');
const express = require('express');
const oracleRoutes = require('../../src/api/routes/oracle.routes');

describe('Oracle API Integration Tests', () => {
    let app;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.use('/api/oracles', oracleRoutes);
    });

    test('GET /api/oracles returns list of available oracles', async () => {
        const response = await request(app)
            .get('/api/oracles');

        expect(response.status).toBe(200);
        expect(response.body.oracles).toBeInstanceOf(Array);
        expect(response.body.oracles.length).toBeGreaterThan(0);

        // Verify oracle types
        const types = response.body.oracles.map(o => o.type);
        expect(types).toContain('json');
        expect(types).toContain('csv');
        expect(types).toContain('script');
    });

    test('POST /api/oracles/query gets project data', async () => {
        const response = await request(app)
            .post('/api/oracles/query')
            .send({
                name: 'projects',
                path: 'projects(0)',  // Get first project
                parameters: {}
            });

        expect(response.status).toBe(200);
        expect(response.body.result).toBeDefined();
        expect(response.body.result.name).toBe('gulp');
    });

    test('POST /api/oracles/query gets invoice data', async () => {
        const response = await request(app)
            .post('/api/oracles/query')
            .send({
                name: 'invoices',
                path: 'column("amount").row(1)',  // Get amount from first row
                parameters: {}
            });

        expect(response.status).toBe(200);
        expect(response.body.result).toBeDefined();
    });

    test('POST /api/oracles/query converts currency', async () => {
        const response = await request(app)
            .post('/api/oracles/query')
            .send({
                name: 'curs',
                path: 'convert',  // Just function name, no expected answer
                parameters: {
                    amount: 100,
                    from: 'EUR',
                    to: 'RON'
                }
            });

        expect(response.status).toBe(200);
        expect(response.body.result).toBeDefined();
    });

    test('POST /api/oracles/query gets template', async () => {
        const response = await request(app)
            .post('/api/oracles/query')
            .send({
                name: 'templates',
                path: 'emails(0)',  // Get first template
                parameters: {}
            });

        expect(response.status).toBe(200);
        expect(response.body.result).toBeDefined();
    });

    test('POST /api/oracles/query handles invalid oracle name', async () => {
        const response = await request(app)
            .post('/api/oracles/query')
            .send({
                name: 'nonexistent',
                path: '',
                parameters: {}
            });

        expect(response.status).toBe(500);
        expect(response.body.error).toBe("Oracle 'nonexistent' not found");
    });

    test('POST /api/oracles/query handles invalid path', async () => {
        const response = await request(app)
            .post('/api/oracles/query')
            .send({
                name: 'templates',
                path: 'nonexistent(0)',  // Invalid path with correct format
                parameters: {}
            });

        expect(response.status).toBe(500);
        expect(response.body.error).toContain('Path not found');
    });

    test('POST /api/oracles/query returns all data with empty path', async () => {
        const response = await request(app)
            .post('/api/oracles/query')
            .send({
                name: 'templates',
                path: '',
                parameters: {}
            });

        expect(response.status).toBe(200);
        expect(response.body.result).toBeDefined();
        expect(response.body.result.emails).toBeInstanceOf(Array);
    });
});
