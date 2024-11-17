const CmdAction = require('../../../src/domain/actions/CmdAction');

jest.mock('child_process');
const { exec } = require('child_process');

describe('CmdAction', () => {
    let cmdAction;

    beforeEach(() => {
        cmdAction = new CmdAction();
        jest.clearAllMocks();
    });

    test('has correct name and description', () => {
        expect(cmdAction.name).toBe('cmd');
        expect(cmdAction.description).toBe('Execute a command in the console');
    });

    describe('validateParameters', () => {
        test('accepts valid command string', () => {
            expect(cmdAction.validateParameters('echo "test"')).toBe(true);
        });

        test('throws error for empty string', () => {
            expect(() => cmdAction.validateParameters('')).toThrow('Command parameters must be a non-empty string');
        });

        test('throws error for null parameters', () => {
            expect(() => cmdAction.validateParameters(null)).toThrow('Command parameters must be a non-empty string');
        });

        test('throws error for non-string parameters', () => {
            expect(() => cmdAction.validateParameters(123)).toThrow('Command parameters must be a non-empty string');
        });
    });

    describe('cleanOutput', () => {
        test('removes surrounding quotes', () => {
            expect(cmdAction.cleanOutput('"test"')).toBe('test');
        });

        test('handles empty output', () => {
            expect(cmdAction.cleanOutput('')).toBe('');
            expect(cmdAction.cleanOutput(null)).toBe('');
            expect(cmdAction.cleanOutput(undefined)).toBe('');
        });

        test('converts Windows line endings', () => {
            expect(cmdAction.cleanOutput('line1\r\nline2')).toBe('line1\nline2');
        });

        test('trims whitespace', () => {
            expect(cmdAction.cleanOutput('  test  ')).toBe('test');
        });

        test('handles multiple transformations', () => {
            expect(cmdAction.cleanOutput('  "line1\r\nline2"  ')).toBe('line1\nline2');
        });
    });

    describe('execute', () => {
        test('executes command successfully', async () => {
            const mockStdout = '"command output"';
            exec.mockImplementation((cmd, callback) => callback(null, mockStdout, ''));

            const result = await cmdAction.execute({}, 'echo "test"');
            
            expect(exec).toHaveBeenCalledWith('echo "test"', expect.any(Function));
            expect(result).toEqual({
                stdout: 'command output',
                stderr: ''
            });
        });

        test('handles command execution error', async () => {
            const mockError = new Error('Command failed');
            const mockStderr = '"error output"\r\n';
            exec.mockImplementation((cmd, callback) => callback(mockError, '', mockStderr));

            await expect(cmdAction.execute({}, 'invalid-command'))
                .rejects
                .toMatchObject({
                    message: 'Command execution failed: error output',
                    code: expect.any(Number),
                    command: 'invalid-command',
                    stderr: 'error output'
                });
            
            expect(exec).toHaveBeenCalledWith('invalid-command', expect.any(Function));
        });

        test('validates parameters before execution', async () => {
            await expect(cmdAction.execute({}, ''))
                .rejects
                .toThrow('Command parameters must be a non-empty string');
            
            expect(exec).not.toHaveBeenCalled();
        });
    });
});
