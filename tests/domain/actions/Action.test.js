const Action = require('../../../src/domain/actions/Action');

describe('Action', () => {
    let action;

    beforeEach(() => {
        action = new Action();
    });

    test('has default name and description', () => {
        expect(action.name).toBe('base');
        expect(action.description).toBe('Base action');
    });

    test('validateParameters returns true by default', () => {
        expect(action.validateParameters('any parameters')).toBe(true);
    });

    test('execute throws error if not implemented', async () => {
        await expect(action.execute({}, 'params'))
            .rejects
            .toThrow('Execute method must be implemented by child classes');
    });

    test('getDescription returns description', () => {
        expect(action.getDescription()).toBe('Base action');
    });
});
