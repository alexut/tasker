const Imap = require('imap');
const Action = require('./Action');
const accounts = require('../../config/email_accounts.json').accounts;
const fs = require('fs').promises;
const path = require('path');

class ReadEmailAction extends Action {
    constructor() {
        super();
        this.name = 'read_email';
        this.description = 'Mark emails as read and store them locally';
        this.storageFile = path.join(__dirname, '../../../data/read_emails.json');
    }

    validateParameters(parameters) {
        if (!parameters || typeof parameters !== 'string') {
            throw new Error('Email parameters must be provided');
        }
        return true;
    }

    async loadStoredEmails() {
        try {
            const data = await fs.readFile(this.storageFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // If file doesn't exist or is invalid, return empty array
            return [];
        }
    }

    async storeEmail(email) {
        const storedEmails = await this.loadStoredEmails();
        storedEmails.push({
            ...email,
            processedAt: new Date().toISOString()
        });
        await fs.writeFile(this.storageFile, JSON.stringify(storedEmails, null, 2));
    }

    async execute(task, parameters) {
        this.validateParameters(parameters);
        
        // Parse parameters: "account", uid
        const paramMatch = parameters.match(/"([^"]+)"\s*,\s*(\d+|\d+:\d+)/);
        if (!paramMatch) {
            throw new Error('Invalid parameter format');
        }

        const accountName = paramMatch[1];
        const uid = paramMatch[2];

        const account = accounts.find(acc => acc.account_name === accountName);
        if (!account) {
            throw new Error(`No account found for: ${accountName}`);
        }

        return new Promise((resolve, reject) => {
            const imap = new Imap({
                user: account.account_name,
                password: account.password || account.appPassword,
                host: account.server,
                port: account.port,
                tls: account.security === 'SSL/TLS',
                tlsOptions: { rejectUnauthorized: false }
            });

            imap.once('ready', () => {
                imap.openBox('INBOX', false, async (err, box) => {  
                    if (err) {
                        imap.end();
                        reject(err);
                        return;
                    }

                    imap.search([['UID', uid.toString()]], (err, results) => {
                        if (err) {
                            imap.end();
                            reject(err);
                            return;
                        }

                        if (results.length === 0) {
                            imap.end();
                            reject(new Error(`No message found with UID ${uid}`));
                            return;
                        }

                        const msg = results[0].toString();
                        console.log(`Marking message ${msg} (UID: ${uid}) as read...`);

                        // Fetch the email content
                        const f = imap.fetch(msg, {
                            bodies: '',
                            struct: true
                        });

                        f.on('message', (msg, seqno) => {
                            msg.on('body', async (stream, info) => {
                                let buffer = '';
                                stream.on('data', (chunk) => {
                                    buffer += chunk.toString('utf8');
                                });

                                stream.once('end', async () => {
                                    // Store the email content
                                    await this.storeEmail({
                                        id: uid,
                                        account: accountName,
                                        content: buffer,
                                        readAt: new Date().toISOString()
                                    });

                                    // Mark as read by adding the \Seen flag
                                    imap.addFlags(msg, '\\Seen', (err) => {
                                        if (err) {
                                            console.error('Add flags error:', err);
                                            imap.end();
                                            reject(err);
                                            return;
                                        }

                                        imap.end();
                                        resolve({
                                            success: true,
                                            message: `Email ${uid} marked as read and stored`
                                        });
                                    });
                                });
                            });
                        });

                        f.once('error', (err) => {
                            console.error('Fetch error:', err);
                            imap.end();
                            reject(err);
                        });
                    });
                });
            });

            imap.once('error', (err) => {
                console.error('IMAP error:', err);
                reject(err);
            });

            imap.once('end', () => {
                console.log('IMAP connection ended');
            });

            imap.connect();
        });
    }
}

module.exports = ReadEmailAction;
