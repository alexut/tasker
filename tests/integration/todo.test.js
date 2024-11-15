const request = require('supertest');
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const todoRoutes = require('../../src/api/routes/todo.routes');
const config = require('../../src/config');

describe('Todo API', () => {
    let app;
    const testFilePath = path.join(config.settings.basePath, 'test.todo');
    const testFileContent = `Project1:
    [ ] Task1 @due(2024-01-01) @assign(John)
        [ ] Subtask1
    [ ] Task2 >cmd(echo "test")`;

    beforeEach(async () => {
        app = express();
        app.use(express.json());
        app.use('/api/todos', todoRoutes);

        await fs.mkdir(config.settings.basePath, { recursive: true });
        await fs.writeFile(testFilePath, testFileContent);
    });

    afterEach(async () => {
        try {
            await fs.unlink(testFilePath);
        } catch (error) {
            // Ignore if file doesn't exist
        }
    });

    test('PATCH /api/todos/:filePath/tasks/:taskId adds a tag', async () => {
        const response = await request(app)
            .patch(`/api/todos/${encodeURIComponent(testFilePath)}/tasks/1.1`)
            .send({
                addTag: {
                    name: 'priority',
                    value: 'high'
                }
            });

        expect(response.status).toBe(200);
        expect(response.body.tags).toContainEqual({ name: 'priority', value: 'high' });
        expect(response.body.text).toContain('@priority(high)');

        // Verify file was updated
        const content = await fs.readFile(testFilePath, 'utf-8');
        expect(content).toContain('@priority(high)');
    });

    test('PATCH /api/todos/:filePath/tasks/:taskId removes a tag', async () => {
        const response = await request(app)
            .patch(`/api/todos/${encodeURIComponent(testFilePath)}/tasks/1.1`)
            .send({
                removeTag: 'assign'
            });

        expect(response.status).toBe(200);
        expect(response.body.tags).not.toContainEqual({ name: 'assign', value: 'John' });
        expect(response.body.text).not.toContain('@assign(John)');

        // Verify file was updated
        const content = await fs.readFile(testFilePath, 'utf-8');
        expect(content).not.toContain('@assign(John)');
    });

    test('PATCH /api/todos/:filePath/tasks/:taskId updates text without duplicating tags', async () => {
        const response = await request(app)
            .patch(`/api/todos/${encodeURIComponent(testFilePath)}/tasks/1.1`)
            .send({
                text: 'Updated Task1 @due(2024-01-01) @assign(John)'
            });

        expect(response.status).toBe(200);
        expect(response.body.text).toBe('Updated Task1 @due(2024-01-01) @assign(John)');

        // Verify no duplication
        const content = await fs.readFile(testFilePath, 'utf-8');
        const matches = content.match(/@assign\(John\)/g) || [];
        expect(matches.length).toBe(1);
    });
});
