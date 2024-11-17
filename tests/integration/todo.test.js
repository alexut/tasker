const request = require('supertest');
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const todoRoutes = require('../../src/api/routes/todo.routes');
const config = require('../../src/config');

describe('Todo API Integration Tests', () => {
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
        await fs.unlink(testFilePath).catch(() => {}); // Simplified error handling
    });

    test('PATCH /api/todos/:filePath/tasks/:taskId updates task text without duplicating tags', async () => {
        const response = await request(app)
            .patch(`/api/todos/${encodeURIComponent(testFilePath)}/tasks/1.1`)
            .send({ text: 'Updated Task1 @due(2024-01-01) @assign(John)' });

        expect(response.status).toBe(200);
        expect(response.body.text).toBe('Updated Task1 @due(2024-01-01) @assign(John)');

        const content = await fs.readFile(testFilePath, 'utf-8');
        const tagOccurrences = (content.match(/@assign\(John\)/g) || []).length;
        expect(tagOccurrences).toBe(1);
    });
});
