                        const Imap = require('imap');
const Action = require('./Action');
const accounts = require('../../config/email_accounts.json').accounts;

class GetEmailAction extends Action {
    constructor() {
        super();
        this.name = 'get_email';
        this.description = 'Get emails from accounts';
    }

    validateParameters(parameters) {
        if (!parameters || typeof parameters !== 'string') {
            throw new Error('Email parameters must be provided');
        }
        return true;
    }

    async execute(task, parameters) {
        this.validateParameters(parameters);
        
        // Parse parameters: [search criteria], batch size, page, account name
        const paramMatch = parameters.match(/\[(.*?)\],\s*(\d+),\s*(\d+)(?:,\s*"([^"]+)")?/);
        if (!paramMatch) {
            throw new Error('Invalid parameter format');
        }

        const searchCriteria = JSON.parse(`[${paramMatch[1]}]`);
        console.log('Search criteria:', searchCriteria);

        const account = paramMatch[4] ? 
            accounts.find(acc => acc.account_name === paramMatch[4]) : 
            accounts[0];

        if (!account) {
            throw new Error('No matching email account found');
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
                // For mediabit.ro, handle special folders
                let searchFolder = 'INBOX';
                if (account.server.includes('mediabit.ro') && searchCriteria.some(c => c[0] === 'IN')) {
                    searchFolder = searchCriteria.find(c => c[0] === 'IN')[1];
                }

                imap.openBox(searchFolder, true, (err, box) => {
                    if (err) {
                        console.error('Error opening folder:', err);
                        imap.end();
                        reject(err);
                        return;
                    }

                    // Filter out the IN criteria since we've handled it by opening the correct folder
                    const finalCriteria = searchCriteria.filter(c => c[0] !== 'IN');
                    console.log('Folder opened, searching with criteria:', finalCriteria);
                    imap.search(finalCriteria, (err, results) => {
                        if (err) {
                            console.error('Search error:', err);
                            imap.end();
                            reject(err);
                            return;
                        }

                        console.log('Search results:', results);

                        if (results.length === 0) {
                            imap.end();
                            resolve({ emails: [], accounts: [account.account_name] });
                            return;
                        }

                        // Get last 5 messages
                        const messages = results.slice(-5);
                        console.log('Fetching messages:', messages);

                        const f = imap.fetch(messages, {
                            bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
                            struct: true,
                            uid: true
                        });

                        const emails = [];

                        f.on('message', (msg, seqno) => {
                            const email = {
                                id: seqno,
                                account: account.account_name,
                                subject: '',
                                from: '',
                                to: '',
                                date: new Date()
                            };

                            msg.once('attributes', (attrs) => {
                                email.uid = attrs.uid;
                            });

                            msg.on('body', (stream, info) => {
                                let buffer = '';
                                stream.on('data', chunk => buffer += chunk.toString('utf8'));
                                stream.once('end', () => {
                                    const header = Imap.parseHeader(buffer);
                                    email.subject = header.subject?.[0] || '';
                                    email.from = header.from?.[0] || '';
                                    email.to = header.to?.[0] || '';
                                    email.date = new Date(header.date?.[0]);
                                    console.log('Parsed email:', email);
                                });
                            });

                            msg.once('end', () => {
                                emails.push(email);
                            });
                        });

                        f.once('error', err => {
                            console.error('Fetch error:', err);
                            imap.end();
                            reject(err);
                        });

                        f.once('end', () => {
                            console.log('Final emails array:', emails);
                            imap.end();
                            resolve({
                                emails,
                                accounts: [account.account_name]
                            });
                        });
                    });
                });
            });

            imap.once('error', err => {
                console.error('IMAP connection error:', err);
                reject(err);
            });

            imap.connect();
        });
    }
}

module.exports = GetEmailAction;