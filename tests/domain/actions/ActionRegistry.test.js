const ActionRegistry = require('../../../src/domain/actions/ActionRegistry');
const CmdAction = require('../../../src/domain/actions/CmdAction');

jest.mock('../../../src/domain/actions/CmdAction');

describe('ActionRegistry', () => {
    let registry;

    beforeEach(() => {
        jest.clearAllMocks();
        CmdAction.mockImplementation(() => ({
            name: 'cmd',
            description: 'Test command action',
            execute: jest.fn()
        }));
        registry = new ActionRegistry();
    });

    test('registers default actions on construction', () => {
        expect(CmdAction).toHaveBeenCalled();
        expect(registry.listActions()).toContainEqual({
            name: 'cmd',
            description: 'Test command action'
        });
    });

    describe('registerAction', () => {
        test('registers valid action', () => {
            const testAction = {
                name: 'test',
                description: 'Test action',
                execute: () => {}
            };
            registry.registerAction(testAction);
            expect(registry.listActions()).toContainEqual({
                name: 'test',
                description: 'Test action'
            });
        });

        test('throws error for invalid action without name', () => {
            const invalidAction = {
                execute: () => {}
            };
            expect(() => registry.registerAction(invalidAction))
                .toThrow('Invalid action: must have name and execute method');
        });

        test('throws error for invalid action without execute method', () => {
            const invalidAction = {
                name: 'test'
            };
            expect(() => registry.registerAction(invalidAction))
                .toThrow('Invalid action: must have name and execute method');
        });
    });

    describe('getAction', () => {
        test('returns registered action', () => {
            const action = registry.getAction('cmd');
            expect(action).toBeDefined();
            expect(action.name).toBe('cmd');
        });

        test('throws error for unknown action', () => {
            expect(() => registry.getAction('unknown'))
                .toThrow('Action not found: unknown');
        });
    });

    describe('executeAction', () => {
        test('executes registered action', async () => {
            const mockExecute = jest.fn().mockResolvedValue('result');
            const testAction = {
                name: 'test',
                description: 'Test action',
                execute: mockExecute
            };
            registry.registerAction(testAction);

            const task = { id: '1', text: 'Test task' };
            const params = 'test params';
            
            await registry.executeAction('test', task, params);
            expect(mockExecute).toHaveBeenCalledWith(task, params);
        });

        test('throws error for unknown action', async () => {
            await expect(registry.executeAction('unknown', {}, ''))
                .rejects
                .toThrow('Action not found: unknown');
        });
    });

    describe('listActions', () => {
        test('lists all registered actions', () => {
            const testAction = {
                name: 'test',
                description: 'Test action',
                execute: () => {}
            };
            registry.registerAction(testAction);

            const actions = registry.listActions();
            expect(actions).toHaveLength(2); // cmd (default) + test
            expect(actions).toContainEqual({
                name: 'cmd',
                description: 'Test command action'
            });
            expect(actions).toContainEqual({
                name: 'test',
                description: 'Test action'
            });
        });
    });
});
