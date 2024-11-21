const request = require('supertest');
const express = require('express');
const actionRoutes = require('../../src/api/routes/action.routes');
const emailAccounts = require('../../src/config/email_accounts.json').accounts;

describe('Email Actions Integration Tests', () => {
    let app;
    
    // Increase timeout for email operations
    jest.setTimeout(40000);

    beforeEach(async () => {
        app = express();
        app.use(express.json());
        app.use('/api/actions', actionRoutes);
    });

    const mediabitAccount = emailAccounts.find(acc => acc.account_name === 'alex@mediabit.ro');
    const gmailAccount = emailAccounts.find(acc => acc.account_name === 'alexandruiga@gmail.com');
    
    if (!mediabitAccount || !gmailAccount) {
        throw new Error('Required test email accounts not found in configuration');
    }

    describe('Send Email', () => {
        test('sends email with attachment', async () => {
            const timestamp = Date.now();
            const attachmentPath = 'c:/hub/core/tasker/tests/data/test-attachment.txt';
            
            const response = await request(app)
                .post('/api/actions/execute')
                .send({
                    action: 'send_email',
                    parameters: `"${mediabitAccount.account_name}", "${gmailAccount.account_name}", "Test Attachment ${timestamp}", "This email has an attachment", "${attachmentPath}"`
                });

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                type: 'send_email',
                success: true
            });
        });

        test('sends email without attachment', async () => {
            const timestamp = Date.now();
            
            const response = await request(app)
                .post('/api/actions/execute')
                .send({
                    action: 'send_email',
                    parameters: `"${mediabitAccount.account_name}", "${gmailAccount.account_name}", "Test Email ${timestamp}", "This is a test email"`
                });

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                type: 'send_email',
                success: true
            });
        });
    });

    describe('Get Email', () => {
        test('retrieves emails from inbox', async () => {
            const response = await request(app)
                .post('/api/actions/execute')
                .send({
                    action: 'get_email',
                    parameters: `"${mediabitAccount.account_name}", "INBOX", 5`
                });

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                type: 'get_email',
                success: true,
                result: expect.any(Array)
            });
            expect(response.body.result.length).toBeLessThanOrEqual(5);
        });

        test('validates folder name', async () => {
            const response = await request(app)
                .post('/api/actions/execute')
                .send({
                    action: 'get_email',
                    parameters: `"${mediabitAccount.account_name}", "INVALID_FOLDER", 5`
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Trash Email', () => {
        test('moves email to trash', async () => {
            // First get an email ID
            const getResponse = await request(app)
                .post('/api/actions/execute')
                .send({
                    action: 'get_email',
                    parameters: `"${mediabitAccount.account_name}", "INBOX", 1`
                });

            expect(getResponse.status).toBe(200);
            expect(getResponse.body.result.length).toBeGreaterThan(0);

            const emailId = getResponse.body.result[0].id;

            // Now trash it
            const trashResponse = await request(app)
                .post('/api/actions/execute')
                .send({
                    action: 'trash_email',
                    parameters: `"${mediabitAccount.account_name}", "${emailId}"`
                });

            expect(trashResponse.status).toBe(200);
            expect(trashResponse.body).toMatchObject({
                type: 'trash_email',
                success: true
            });
        });

        test('handles invalid email ID', async () => {
            const response = await request(app)
                .post('/api/actions/execute')
                .send({
                    action: 'trash_email',
                    parameters: `"${mediabitAccount.account_name}", "invalid_id"`
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });
});
