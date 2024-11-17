const request = require('supertest');
const express = require('express');
const actionRoutes = require('../../src/api/routes/action.routes');
const emailAccounts = require('../../src/config/email_accounts.json').accounts;

describe('Actions API Integration Tests', () => {
    let app;
    
    // Increase timeout for email operations
    jest.setTimeout(40000);

    beforeEach(async () => {
        app = express();
        app.use(express.json());
        app.use('/api/actions', actionRoutes);
    });

    test('GET /api/actions returns list of available actions', async () => {
        const response = await request(app)
            .get('/api/actions');

        expect(response.status).toBe(200);
        expect(response.body.actions).toBeInstanceOf(Array);
        expect(response.body.actions).toContainEqual({
            name: 'cmd',
            description: expect.any(String)
        });
        expect(response.body.actions).toContainEqual({
            name: 'get_email',
            description: expect.any(String)
        });
        expect(response.body.actions).toContainEqual({
            name: 'send_email',
            description: expect.any(String)
        });
        expect(response.body.actions).toContainEqual({
            name: 'trash_email',
            description: expect.any(String)
        });
    });

    test('POST /api/actions/execute executes cmd action', async () => {
        const response = await request(app)
            .post('/api/actions/execute')
            .send({
                action: 'cmd',
                parameters: 'echo "test"'
            });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            type: 'cmd',
            success: true,
            result: {
                stdout: 'test',
                stderr: ''
            }
        });
    });

    test('POST /api/actions/execute executes browser action', async () => {
        const response = await request(app)
            .post('/api/actions/execute')
            .send({
                action: 'browser',
                parameters: '"https://example.com", 800, 600, 100, 200'
            });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            type: 'browser',
            success: true,
            result: {
                success: true,
                message: expect.stringContaining('https://example.com')
            }
        });
    });

    describe('Email Action Integration Tests', () => {
        const timestamp = Date.now();
        const mediabitAccount = emailAccounts.find(acc => acc.account_name === 'alex@mediabit.ro');
        const gmailAccount = emailAccounts.find(acc => acc.account_name === 'alexandruiga@gmail.com');
        
        if (!mediabitAccount || !gmailAccount) {
            throw new Error('Required test email accounts not found in configuration');
        }

        test('Send email with attachment', async () => {
            const attachmentPath = 'c:/hub/core/tasker/tests/data/test-attachment.txt';
            
            // Send email with attachment
            console.log('Sending email with attachment...');
            const response = await request(app)
                .post('/api/actions/execute')
                .send({
                    action: 'send_email',
                    parameters: `"${mediabitAccount.account_name}", "${gmailAccount.account_name}", "Test Attachment ${timestamp}", "This email has an attachment", "${attachmentPath}"`
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            // Wait for email to arrive
            console.log('Waiting for email to arrive...');
            await new Promise(resolve => setTimeout(resolve, 10000));

            // Find the email
            console.log('Finding email...');
            const findResponse = await request(app)
                .post('/api/actions/execute')
                .send({
                    action: 'get_email',
                    parameters: `[["SUBJECT", "Test Attachment ${timestamp}"]], 10, 1, "${gmailAccount.account_name}"`
                });

            expect(findResponse.status).toBe(200);
            expect(findResponse.body.result.emails.length).toBe(1);

            // Trash the email
            console.log('Trashing email...');
            const email = findResponse.body.result.emails[0];
            const trashResponse = await request(app)
                .post('/api/actions/execute')
                .send({
                    action: 'trash_email',
                    parameters: `"${gmailAccount.account_name}", ${email.uid}`
                });

            expect(trashResponse.status).toBe(200);
            expect(trashResponse.body.success).toBe(true);

            // Verify email is gone
            console.log('Verifying email is gone...');
            const verifyResponse = await request(app)
                .post('/api/actions/execute')
                .send({
                    action: 'get_email',
                    parameters: `[["SUBJECT", "Test Attachment ${timestamp}"]], 10, 1, "${gmailAccount.account_name}"`
                });

            expect(verifyResponse.status).toBe(200);
            expect(verifyResponse.body.result.emails.length).toBe(0);
        });
    });
});