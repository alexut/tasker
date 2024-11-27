const Imap = require('imap');
const Action = require('./Action');
const accounts = require('../../config/email_accounts.json').accounts;
const fs = require('fs').promises;
const path = require('path');

class ProcessEmailAction extends Action {
    constructor() {
        super();
        this.name = 'process_email';
        this.description = 'Process multiple emails - mark as read and/or move to trash';
        this.storageFile = path.join(__dirname, '../../../data/read_emails.json');
    }

    validateParameters(parameters) {
        if (!parameters || typeof parameters !== 'string') {
            throw new Error('Parameters must be provided');
        }

        try {
            const params = JSON.parse(parameters);
            if (!params.read && !params.trash) {
                throw new Error('At least one action (read or trash) must be specified');
            }
            if (params.read && !Array.isArray(params.read)) {
                throw new Error('read parameter must be an array');
            }
            if (params.trash && !Array.isArray(params.trash)) {
                throw new Error('trash parameter must be an array');
            }
            return true;
        } catch (error) {
            throw new Error(`Invalid JSON parameters: ${error.message}`);
        }
    }

    async loadStoredEmails() {
        try {
            const data = await fs.readFile(this.storageFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
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

    async processEmailBatch(imap, action, uids, accountName, trashFolder = null) {
        return new Promise((resolve, reject) => {
            const uidStr = uids.join(',');
            imap.search([['UID', uidStr]], async (err, results) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (results.length === 0) {
                    resolve({ skipped: uids, reason: 'not found' });
                    return;
                }

                if (action === 'read') {
                    // Fetch email content and mark as read
                    const f = imap.fetch(results, {
                        bodies: '',
                        struct: true
                    });

                    const processed = [];
                    f.on('message', (msg, seqno) => {
                        msg.on('body', async (stream, info) => {
                            let buffer = '';
                            stream.on('data', (chunk) => {
                                buffer += chunk.toString('utf8');
                            });

                            stream.once('end', async () => {
                                try {
                                    const currentUid = uids[seqno - 1];
                                    await this.storeEmail({
                                        id: currentUid,
                                        account: accountName,
                                        content: buffer,
                                        readAt: new Date().toISOString()
                                    });
                                    processed.push(currentUid);
                                } catch (error) {
                                    console.error('Storage error:', error);
                                }
                            });
                        });
                    });

                    f.once('end', () => {
                        // Mark all as read
                        imap.addFlags(results, '\\Seen', (err) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            resolve({ processed: processed });
                        });
                    });

                    f.once('error', reject);
                } else if (action === 'trash' && trashFolder) {
                    // First copy to trash
                    imap.copy(results, trashFolder, (err) => {
                        if (err) {
                            reject(err);
                            return;
                        }

                        // Then delete from current folder
                        imap.addFlags(results, '\\Deleted', (err) => {
                            if (err) {
                                reject(err);
                                return;
                            }

                            imap.expunge((err) => {
                                if (err) {
                                    reject(err);
                                    return;
                                }
                                resolve({ processed: uids });
                            });
                        });
                    });
                }
            });
        });
    }

    async execute(task, parameters) {
        this.validateParameters(parameters);
        const params = JSON.parse(parameters);
        
        // Group emails by account
        const emailsByAccount = {};
        
        // Process read emails
        if (params.read) {
            for (const emailId of params.read) {
                const [account, uid] = emailId.split(':');
                if (!emailsByAccount[account]) {
                    emailsByAccount[account] = { read: [], trash: [] };
                }
                emailsByAccount[account].read.push(uid);
            }
        }

        // Process trash emails
        if (params.trash) {
            for (const emailId of params.trash) {
                const [account, uid] = emailId.split(':');
                if (!emailsByAccount[account]) {
                    emailsByAccount[account] = { read: [], trash: [] };
                }
                emailsByAccount[account].trash.push(uid);
            }
        }

        const results = {
            read: { processed: [], failed: [] },
            trash: { processed: [], failed: [] }
        };

        // Process each account
        for (const [accountName, actions] of Object.entries(emailsByAccount)) {
            const account = accounts.find(acc => acc.account_name === accountName);
            if (!account) {
                console.error(`No account found for: ${accountName}`);
                continue;
            }

            await new Promise((resolve, reject) => {
                const imap = new Imap({
                    user: account.account_name,
                    password: account.password || account.appPassword,
                    host: account.server,
                    port: account.port,
                    tls: account.security === 'SSL/TLS',
                    tlsOptions: { rejectUnauthorized: false }
                });

                imap.once('ready', async () => {
                    try {
                        await new Promise((res, rej) => {
                            imap.openBox('INBOX', false, (err) => {
                                if (err) rej(err);
                                else res();
                            });
                        });

                        // Determine trash folder based on email provider
                        let trashFolder = 'INBOX.Trash';
                        if (account.server.includes('gmail.com')) {
                            trashFolder = '[Gmail]/Trash';
                        }

                        // Process read batch
                        if (actions.read.length > 0) {
                            try {
                                const readResult = await this.processEmailBatch(imap, 'read', actions.read, accountName);
                                results.read.processed.push(...readResult.processed.map(uid => `${accountName}:${uid}`));
                            } catch (error) {
                                console.error(`Read error for ${accountName}:`, error);
                                results.read.failed.push(...actions.read.map(uid => `${accountName}:${uid}`));
                            }
                        }

                        // Process trash batch
                        if (actions.trash.length > 0) {
                            try {
                                const trashResult = await this.processEmailBatch(imap, 'trash', actions.trash, accountName, trashFolder);
                                results.trash.processed.push(...trashResult.processed.map(uid => `${accountName}:${uid}`));
                            } catch (error) {
                                console.error(`Trash error for ${accountName}:`, error);
                                results.trash.failed.push(...actions.trash.map(uid => `${accountName}:${uid}`));
                            }
                        }

                        imap.end();
                        resolve();
                    } catch (error) {
                        console.error('Processing error:', error);
                        imap.end();
                        reject(error);
                    }
                });

                imap.once('error', (err) => {
                    console.error('IMAP error:', err);
                    reject(err);
                });

                imap.once('end', () => {
                    console.log('IMAP connection ended');
                    resolve();
                });

                imap.connect();
            });
        }

        return {
            success: true,
            result: results
        };
    }
}

module.exports = ProcessEmailAction;
