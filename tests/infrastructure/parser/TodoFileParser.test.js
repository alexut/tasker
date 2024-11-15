const TodoFileParser = require('../../../src/infrastructure/parser/TodoFileParser');
const Task = require('../../../src/domain/entities/Task');
const Project = require('../../../src/domain/entities/Project');
const config = require('../../../src/config');

describe('TodoFileParser', () => {
    let parser;

    beforeEach(() => {
        parser = new TodoFileParser();
    });

    test('parses tasks with tags, actions, and oracles correctly', () => {
        const content = `Project1:
    [ ] Task1 @due(2024-01-01) @assign(John) >notify(email) #health(check)
        [>] Subtask1 @priority(high)
    [o] Task2 >cmd(echo "test")`;

        const projects = parser.parse(content);
        expect(projects).toHaveLength(1);

        const task1 = projects[0].tasks[0];
        expect(task1.text).toBe('Task1 @due(2024-01-01) @assign(John) >notify(email) #health(check)');
        expect(task1.status).toBe('uncompleted');
        expect(task1.tags).toEqual([
            { name: 'due', value: '2024-01-01' },
            { name: 'assign', value: 'John' }
        ]);
        expect(task1.actions).toEqual([
            { type: 'notify', params: 'email' }
        ]);
        expect(task1.oracles).toEqual([
            { type: 'health', params: 'check' }
        ]);

        const subtask1 = task1.tasks[0];
        expect(subtask1.text).toBe('Subtask1 @priority(high)');
        expect(subtask1.status).toBe('underway');
        expect(subtask1.tags).toEqual([
            { name: 'priority', value: 'high' }
        ]);

        const task2 = projects[0].tasks[1];
        expect(task2.text).toBe('Task2 >cmd(echo "test")');
        expect(task2.status).toBe('paused');
        expect(task2.actions).toEqual([
            { type: 'cmd', params: 'echo "test"' }
        ]);
    });

    test('serializes tasks with tags, actions, and oracles correctly', () => {
        const task1 = new Task('Task1 @due(2024-01-01) @assign(John) >notify(email) #health(check)', 'uncompleted');
        task1.tags = [
            { name: 'due', value: '2024-01-01' },
            { name: 'assign', value: 'John' }
        ];
        task1.actions = [
            { type: 'notify', params: 'email' }
        ];
        task1.oracles = [
            { type: 'health', params: 'check' }
        ];
        const project = new Project('Project1', [task1]);

        const expected = `Project1:
    [ ] Task1 @due(2024-01-01) @assign(John) >notify(email) #health(check)
`;

        const result = parser.serialize([project]);
        expect(result).toBe(expected);
    });

    test('does not duplicate tags when serializing after update', () => {
        const content = `Project1:
    [ ] Task1 @tag1(value1) @tag2(value2)`;

        const projects = parser.parse(content);
        const task = projects[0].tasks[0];

        // Simulate updating the task text
        task.text = 'Updated Task1 @tag1(value1) @tag2(value2)';

        const serializedContent = parser.serialize(projects);
        const tag1Matches = serializedContent.match(/@tag1\(value1\)/g) || [];
        const tag2Matches = serializedContent.match(/@tag2\(value2\)/g) || [];

        expect(tag1Matches.length).toBe(1);
        expect(tag2Matches.length).toBe(1);
    });

    test('parses tasks with notes at same indentation level', () => {
        const content = `Project1:
    [ ] Task1
    Note line 1
    Note line 2
    [ ] Task2
    Note for Task2`;

        const projects = parser.parse(content);
        const task1 = projects[0].tasks[0];
        expect(task1.note).toBe('Note line 1\nNote line 2');

        const task2 = projects[0].tasks[1];
        expect(task2.note).toBe('Note for Task2');
    });
});
