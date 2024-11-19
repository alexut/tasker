const fs = require('fs').promises;
const path = require('path');
const Oracle = require('../../../src/domain/oracles/Oracle');

describe('Oracle', () => {
    let oracle;
    const testDir = 'test-oracles';

    beforeEach(async () => {
        oracle = new Oracle();
        // Create test directory and files
        const fullTestDir = path.join(oracle.basePath, testDir);
        await fs.mkdir(fullTestDir, { recursive: true });

        // Create test JSON file
        await fs.writeFile(
            path.join(fullTestDir, 'test.json'),
            JSON.stringify({
                projects: [
                    { id: 1, name: 'Project 1', status: 'active' },
                    { id: 2, name: 'Project 2', status: 'completed' }
                ]
            })
        );

        // Create test CSV file
        await fs.writeFile(
            path.join(fullTestDir, 'test.csv'),
            'id,name,status\n1,Task 1,pending\n2,Task 2,completed'
        );
    });

    afterEach(async () => {
        // Cleanup test directory
        const fullTestDir = path.join(oracle.basePath, testDir);
        await fs.rm(fullTestDir, { recursive: true, force: true });
    });

    test('lists available oracles with descriptions', async () => {
        const oracles = await oracle.listOracles();
        expect(oracles.length).toBeGreaterThan(0);
        expect(oracles[0]).toHaveProperty('name');
        expect(oracles[0]).toHaveProperty('type');
        expect(oracles[0]).toHaveProperty('path');
        expect(oracles[0]).toHaveProperty('description');
    });

    test('queries JSON oracle with path', async () => {
        const result = await oracle.queryJson(
            path.join(oracle.basePath, testDir, 'test.json'),
            'projects(0)',
            {}
        );
        expect(result).toEqual(
            { id: 1, name: 'Project 1', status: 'active' }
        );
    });

    test('queries CSV oracle with column and row', async () => {
        const result = await oracle.queryCsv(
            path.join(oracle.basePath, testDir, 'test.csv'),
            'column("status").row(1)',
            {}
        );
        expect(result).toBe('pending');
    });

    test('queries CSV oracle with direct cell reference', async () => {
        const result = await oracle.queryCsv(
            path.join(oracle.basePath, testDir, 'test.csv'),
            'A1',
            {}
        );
        expect(result).toBe('id');
    });

    test('handles invalid oracle name', async () => {
        await expect(oracle.queryOracle('nonexistent'))
            .rejects
            .toThrow("Oracle 'nonexistent' not found");
    });

    test('handles missing oracle file', async () => {
        const testPath = path.join(oracle.basePath, 'nonexistent.json');
        await expect(oracle.queryJson(testPath))
            .rejects
            .toThrow();
    });
});
