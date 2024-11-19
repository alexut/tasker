const path = require('path');
const fs = require('fs').promises;
const FileSystemAction = require('../../../src/domain/actions/FileSystemAction');
const config = require('../../../src/config');

describe('FileSystemAction', () => {
    let action;
    const testDir = 'test-filesystem'; // Make path relative to basePath

    beforeEach(async () => {
        action = new FileSystemAction();
        // Create test directory under basePath
        const fullTestDir = path.join(config.settings.basePath, testDir);
        await fs.mkdir(fullTestDir, { recursive: true });
    });

    afterEach(async () => {
        // Cleanup test directory
        try {
            const fullTestDir = path.join(config.settings.basePath, testDir);
            await fs.rm(fullTestDir, { recursive: true, force: true });
        } catch (error) {
            console.error('Cleanup error:', error);
        }
    });

    test('creates files and folders', async () => {
        const params = JSON.stringify({
            command: 'create',
            structure: [
                {
                    type: 'folder',
                    path: path.join(testDir, 'subfolder')
                },
                {
                    type: 'file',
                    path: path.join(testDir, 'test.txt'),
                    content: 'Test content'
                },
                {
                    type: 'file',
                    path: path.join(testDir, 'subfolder', 'nested.txt'),
                    content: 'Nested content'
                }
            ]
        });

        const result = await action.execute(null, params);
        expect(result.success).toBe(true);

        // Verify folder was created
        const fullSubfolderPath = path.join(config.settings.basePath, testDir, 'subfolder');
        const subfolderStats = await fs.stat(fullSubfolderPath);
        expect(subfolderStats.isDirectory()).toBe(true);

        // Verify files were created with correct content
        const fullTestFilePath = path.join(config.settings.basePath, testDir, 'test.txt');
        const testContent = await fs.readFile(fullTestFilePath, 'utf8');
        expect(testContent).toBe('Test content');

        const fullNestedFilePath = path.join(config.settings.basePath, testDir, 'subfolder', 'nested.txt');
        const nestedContent = await fs.readFile(fullNestedFilePath, 'utf8');
        expect(nestedContent).toBe('Nested content');
    });

    test('scans directory contents', async () => {
        // Create test structure
        const fullTestDir = path.join(config.settings.basePath, testDir);
        await fs.mkdir(path.join(fullTestDir, 'subfolder'), { recursive: true });
        await fs.writeFile(path.join(fullTestDir, 'test1.txt'), 'Test content 1');
        await fs.writeFile(path.join(fullTestDir, 'subfolder', 'test2.txt'), 'Test content 2');

        const params = JSON.stringify({
            command: 'scan',
            path: testDir,
            options: {
                recursive: true,
                includeContent: true
            }
        });

        const result = await action.execute(null, params);
        
        // Verify files are found
        expect(result.files.length).toBeGreaterThan(0);
        expect(result.files.some(f => f.name === 'test1.txt')).toBe(true);
        
        // Verify folders are found
        expect(result.folders.length).toBeGreaterThan(0);
        expect(result.folders.some(f => f.name === 'subfolder')).toBe(true);
        
        // Verify file contents are included
        expect(result.contents['test1.txt'].content).toBe('Test content 1');
    });

    test('prevents path traversal attacks', async () => {
        const params = JSON.stringify({
            command: 'create',
            structure: [
                {
                    type: 'file',
                    path: '../outside.txt',
                    content: 'Should not be created'
                }
            ]
        });

        await expect(action.execute(null, params)).rejects.toThrow('Access denied');
    });

    test('handles missing directories gracefully', async () => {
        const params = JSON.stringify({
            command: 'scan',
            path: path.join(testDir, 'non-existent-folder'),
            options: {
                recursive: true
            }
        });

        await expect(action.execute(null, params)).rejects.toThrow('Failed to scan directory');
    });
});
