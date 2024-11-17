const BrowserAction = require('../../src/domain/actions/BrowserAction');

describe('BrowserAction Integration Tests', () => {
    let browserAction;

    beforeEach(() => {
        browserAction = new BrowserAction();
    });

    test('should have correct name and description', () => {
        expect(browserAction.name).toBe('browser');
        expect(browserAction.description).toBe('Open browser window with specific size and position');
    });

    test('should validate parameters', () => {
        // Valid parameters
        expect(() => browserAction.validateParameters('"https://example.com", 800, 600, 0, 0')).not.toThrow();

        // Invalid parameters
        expect(() => browserAction.validateParameters()).toThrow('Browser parameters must be provided');
        expect(() => browserAction.validateParameters('')).toThrow('Browser parameters must be provided');
        expect(() => browserAction.validateParameters(null)).toThrow('Browser parameters must be provided');
    });

    test('should parse parameters correctly', async () => {
        const params = '"https://example.com", 800, 600, 100, 200';
        const result = await browserAction.execute(null, params);
        
        expect(result).toMatchObject({
            success: true,
            message: expect.stringContaining('https://example.com')
        });
    });

    test('should reject invalid parameter format', async () => {
        const invalidParams = [
            'https://example.com',  // Missing quotes
            '"https://example.com"', // Missing dimensions
            '"https://example.com", abc, 600, 0, 0', // Invalid width
            '"https://example.com", 800, 600', // Missing position
        ];

        for (const params of invalidParams) {
            await expect(browserAction.execute(null, params))
                .rejects
                .toThrow('Invalid parameter format');
        }
    });

    test('should handle special characters in URL', async () => {
        const params = '"https://example.com/path?param=value&other=123", 800, 600, 0, 0';
        const result = await browserAction.execute(null, params);
        
        expect(result).toMatchObject({
            success: true,
            message: expect.stringContaining('https://example.com/path?param=value&other=123')
        });
    });

    test('should handle window positioning at screen edges', async () => {
        const edgeCases = [
            '"https://example.com", 800, 600, 0, 0',      // Top-left
            '"https://example.com", 800, 600, 1920, 1080', // Bottom-right
            '"https://example.com", 1920, 1080, 0, 0',    // Full screen at origin
        ];

        for (const params of edgeCases) {
            const result = await browserAction.execute(null, params);
            expect(result.success).toBe(true);
        }
    });
});
