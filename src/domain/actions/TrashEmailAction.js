const Imap = require('imap');
const Action = require('./Action');
const accounts = require('../../config/email_accounts.json').accounts;

class TrashEmailAction extends Action {
    constructor() {
        super();
        this.name = 'trash_email';
        this.description = 'Move emails to trash';
    }

    validateParameters(parameters) {
        if (!parameters || typeof parameters !== 'string') {
            throw new Error('Email parameters must be provided');
        }
        return true;
    }

    async execute(task, parameters) {
        this.validateParameters(parameters);
        
        // Parse parameters: "account", uid
        const paramMatch = parameters.match(/"([^"]+)"\s*,\s*(\d+|\d+:\d+)/);
        if (!paramMatch) {
            throw new Error('Invalid parameter format');
        }

        const accountName = paramMatch[1];
        const uid = paramMatch[2];  // Keep as string for sequence/range support

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
                imap.openBox('INBOX', false, (err, box) => {  
                    if (err) {
                        imap.end();
                        reject(err);
                        return;
                    }

                    // Determine trash folder based on email provider
                    let trashFolder = 'INBOX.Trash';  // Default for all providers
                    if (account.server.includes('gmail.com')) {
                        trashFolder = '[Gmail]/Trash';
                    }

                    // Use UID-based move for better reliability
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
                        console.log(`Moving message ${msg} (UID: ${uid}) to ${trashFolder}...`);

                        // First copy to trash
                        imap.copy(msg, trashFolder, (err) => {
                            if (err) {
                                console.error('Copy error:', err);
                                imap.end();
                                reject(err);
                                return;
                            }

                            // Then delete from current folder
                            imap.addFlags(msg, '\\Deleted', (err) => {
                                if (err) {
                                    console.error('Add flags error:', err);
                                    imap.end();
                                    reject(err);
                                    return;
                                }

                                imap.expunge((err) => {
                                    if (err) {
                                        console.error('Expunge error:', err);
                                        imap.end();
                                        reject(err);
                                        return;
                                    }

                                    imap.end();
                                    resolve({
                                        success: true,
                                        message: `Moved email ${msg} to trash`
                                    });
                                });
                            });
                        });
                    });
                });
            });

            imap.once('error', (err) => {
                console.error('IMAP error:', err);
                reject(err);
            });

            imap.connect();
        });
    }
}

module.exports = TrashEmailAction;
