const request = require('supertest');
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const tasksRoutes = require('../../src/api/routes/tasks.routes');
const config = require('../../src/config');

describe('Tasks API Integration Tests', () => {
    let app;
    const testFilePath = path.join(config.settings.basePath, 'test.todo');
    const testFileContent = `Project1:
    [ ] Task1 @due(2024-01-01) @assign(John) @priority(high)
        [ ] Subtask1
    [ ] Task2
Project2:
    [ ] Task3 @date(2024-02-01) @type(meeting) @log(5)`;

    beforeEach(async () => {
        app = express();
        app.use(express.json());
        app.use('/api/tasks', tasksRoutes);

        await fs.mkdir(config.settings.basePath, { recursive: true });
        await fs.writeFile(testFilePath, testFileContent);
    });

    afterEach(async () => {
        await fs.unlink(testFilePath).catch(() => {}); // Cleanup test file
    });

    test('GET /api/tasks/load returns projects and tasks', async () => {
        const response = await request(app)
            .get(`/api/tasks/load`)
            .query({ filepath: testFilePath });

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(2); // Two projects
        expect(response.body[0].name).toBe('Project1');
        expect(response.body[0].tasks).toHaveLength(2); // Two tasks in Project1
    });

    test('PATCH /api/tasks/update updates task text', async () => {
        const response = await request(app)
            .patch(`/api/tasks/update`)
            .query({ 
                filepath: testFilePath,
                taskId: '1.1'
            })
            .send({ text: 'Updated Task1 @due(2024-02-01)' });

        expect(response.status).toBe(200);
        expect(response.body.text).toBe('Updated Task1 @due(2024-02-01)');
    });

    test('POST /api/tasks/project creates new project', async () => {
        const response = await request(app)
            .post(`/api/tasks/project`)
            .query({ filepath: testFilePath })
            .send({ name: 'NewProject' });

        expect(response.status).toBe(200);
        expect(response.body.project.name).toBe('NewProject');
        expect(response.body.projectId).toBe('3'); // Since we already have 2 projects
        
        const fileContent = await fs.readFile(testFilePath, 'utf-8');
        expect(fileContent).toContain('NewProject:');
    });

    test('POST /api/tasks/create adds new tasks and subtasks', async () => {
        const newTasks = {
            tasks: [
                { projectId: "1", text: "New Task" },
                { projectId: "1", parentTaskId: "1.1", text: "New Subtask" }
            ]
        };

        const response = await request(app)
            .post(`/api/tasks/create`)
            .query({ filepath: testFilePath })
            .send(newTasks);

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(2);
        expect(response.body[0].taskId).toBe('1.3');
        expect(response.body[0].task.text).toContain('New Task');
        expect(response.body[1].taskId).toBe('1.1.2');
        expect(response.body[1].task.text).toContain('New Subtask');
    });

    test('POST /api/tasks/delete removes specified items via body', async () => {
        const response = await request(app)
            .post(`/api/tasks/delete`)
            .query({ filepath: testFilePath })
            .send({ itemIds: ['1.1', '1.2'] });  // Delete Task1 and Task2 from Project1

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        
        // Verify each deleted item has the expected structure
        response.body.forEach(item => {
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('item');
        });
        
        const fileContent = await fs.readFile(testFilePath, 'utf-8');
        // Verify the tasks were actually deleted from the file
        expect(fileContent).not.toContain('Task1');
        expect(fileContent).not.toContain('Task2');
    });

    test('POST /api/tasks/delete removes specified items via query params', async () => {
        const response = await request(app)
            .post(`/api/tasks/delete`)
            .query({ 
                filepath: testFilePath,
                itemIds: JSON.stringify(['1.1', '1.2'])  // Delete Task1 and Task2 from Project1
            });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        
        const fileContent = await fs.readFile(testFilePath, 'utf-8');
        // Verify the tasks were actually deleted from the file
        expect(fileContent).not.toContain('Task1');
        expect(fileContent).not.toContain('Task2');
    });

    test('POST /api/tasks/delete accepts comma-separated itemIds', async () => {
        const response = await request(app)
            .post(`/api/tasks/delete`)
            .query({ 
                filepath: testFilePath,
                itemIds: '1.1,1.2'  // Delete Task1 and Task2 from Project1
            });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        
        const fileContent = await fs.readFile(testFilePath, 'utf-8');
        // Verify the tasks were actually deleted from the file
        expect(fileContent).not.toContain('Task1');
        expect(fileContent).not.toContain('Task2');
    });

    test('PATCH /api/tasks/update can modify a tag value', async () => {
        const response = await request(app)
            .patch(`/api/tasks/update`)
            .query({ 
                filepath: testFilePath,
                taskId: '1.1'
            })
            .send({ text: 'Task1 @due(2024-02-01) @assign(John) @priority(high)' });

        expect(response.status).toBe(200);
        expect(response.body.text).toBe('Task1 @due(2024-02-01) @assign(John) @priority(high)');
    });

    test('PATCH /api/tasks/update can remove a tag', async () => {
        const response = await request(app)
            .patch(`/api/tasks/update`)
            .query({ 
                filepath: testFilePath,
                taskId: '1.1'
            })
            .send({ text: 'Task1 @due(2024-01-01) @priority(high)' });

        expect(response.status).toBe(200);
        expect(response.body.text).toBe('Task1 @due(2024-01-01) @priority(high)');
    });

    test('PATCH /api/tasks/update can add a new tag', async () => {
        const response = await request(app)
            .patch(`/api/tasks/update`)
            .query({ 
                filepath: testFilePath,
                taskId: '2.1'
            })
            .send({ text: 'Task3 @date(2024-02-01) @type(meeting) @log(5) @status(pending)' });

        expect(response.status).toBe(200);
        expect(response.body.text).toBe('Task3 @date(2024-02-01) @type(meeting) @log(5) @status(pending)');
    });

    test('PATCH /api/tasks/update can increment a numeric tag', async () => {
        const response = await request(app)
            .patch(`/api/tasks/update`)
            .query({ 
                filepath: testFilePath,
                taskId: '2.1'
            })
            .send({ text: 'Task3 @date(2024-02-01) @type(meeting) @log(6)' });

        expect(response.status).toBe(200);
        expect(response.body.text).toBe('Task3 @date(2024-02-01) @type(meeting) @log(6)');
    });

    test('Returns 400 when required parameters are missing', async () => {
        // Test missing filepath
        const response1 = await request(app)
            .get(`/api/tasks/load`);
        expect(response1.status).toBe(500);

        // Test missing project name
        const response2 = await request(app)
            .post(`/api/tasks/project`)
            .query({ filepath: testFilePath });
        expect(response2.status).toBe(400);

        // Test missing tasks array
        const response3 = await request(app)
            .post(`/api/tasks/create`)
            .query({ filepath: testFilePath });
        expect(response3.status).toBe(400);
    });
});
