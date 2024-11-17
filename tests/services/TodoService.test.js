const TodoService = require('../../src/services/TodoService');
const fs = require('fs').promises;
const path = require('path');
const config = require('../../src/config');

describe('TodoService Tests', () => {
    let todoService;
    const testFilePath = path.join(config.settings.basePath, 'test.todo');

    beforeEach(async () => {
        todoService = new TodoService();
        await fs.mkdir(config.settings.basePath, { recursive: true });
        await fs.writeFile(testFilePath, `Project1:
    [ ] Task1 @due(2024-01-01) @assign(John)
        [ ] Subtask1
    [ ] Task2 >cmd(echo "test")`);
    });

    afterEach(async () => {
        await fs.unlink(testFilePath).catch(() => {}); // Simplified error handling
    });

    test('adds a tag to a task', async () => {
        const updatedTask = await todoService.updateTask(testFilePath, '1.1', {
            addTag: {
                name: 'priority',
                value: 'high'
            }
        });

        expect(updatedTask.tags).toContainEqual({ name: 'priority', value: 'high' });
        expect(updatedTask.text).toContain('@priority(high)');

        const content = await fs.readFile(testFilePath, 'utf-8');
        expect(content).toContain('@priority(high)');
    });

    test('removes a tag from a task', async () => {
        const updatedTask = await todoService.updateTask(testFilePath, '1.1', {
            removeTag: 'assign'
        });

        expect(updatedTask.tags).not.toContainEqual({ name: 'assign', value: 'John' });
        expect(updatedTask.text).not.toContain('@assign(John)');

        const content = await fs.readFile(testFilePath, 'utf-8');
        expect(content).not.toContain('@assign(John)');
    });

    test('updates task text without duplicating tags', async () => {
        const updatedTask = await todoService.updateTask(testFilePath, '1.1', {
            text: 'Updated Task1 @due(2024-01-01) @assign(John)'
        });

        expect(updatedTask.text).toBe('Updated Task1 @due(2024-01-01) @assign(John)');

        const content = await fs.readFile(testFilePath, 'utf-8');
        const matches = content.match(/@assign\(John\)/g) || [];
        expect(matches.length).toBe(1);
    });
});