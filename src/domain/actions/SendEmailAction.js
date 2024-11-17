const nodemailer = require('nodemailer');
const Action = require('./Action');
const accounts = require('../../config/email_accounts.json').accounts;
const fs = require('fs');
const path = require('path');

class SendEmailAction extends Action {
    constructor() {
        super();
        this.name = 'send_email';
        this.description = 'Send an email from a specified account';
    }

    validateParameters(parameters) {
        if (!parameters || typeof parameters !== 'string') {
            throw new Error('Email parameters must be provided');
        }
        return true;
    }

    async execute(task, parameters) {
        this.validateParameters(parameters);
        
        // Parse parameters: from, to, subject, body, [attachmentPath]
        const paramMatch = parameters.match(/"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"(?:\s*,\s*"([^"]+)")?/);
        if (!paramMatch) {
            throw new Error('Invalid parameter format');
        }

        const fromAccount = paramMatch[1];
        const to = paramMatch[2];
        const subject = paramMatch[3];
        const text = paramMatch[4];
        const attachmentPath = paramMatch[5];

        const account = accounts.find(acc => acc.account_name === fromAccount);
        if (!account) {
            throw new Error(`Account not found: ${fromAccount}`);
        }

        const isGmail = account.smtp_server.includes('gmail');
        console.log(`Sending email from ${fromAccount} using ${account.smtp_server}`);

        // Default TLS options
        const defaultTlsOptions = {
            rejectUnauthorized: false
        };

        const transportConfig = {
            host: account.smtp_server,
            port: account.smtp_port,
            secure: account.smtp_security === 'SSL/TLS',
            auth: {
                user: account.account_name,
                pass: account.password || account.appPassword
            },
            tls: {
                ...defaultTlsOptions,
                ...(account.tlsOptions || {})
            }
        };

        // Gmail-specific configuration
        if (isGmail) {
            transportConfig.service = 'gmail';
            transportConfig.auth = {
                user: account.account_name,
                pass: account.appPassword // Use app password for Gmail
            };
        }

        console.log('Creating transport with config:', {
            ...transportConfig,
            auth: { ...transportConfig.auth, pass: '****' } // Hide password in logs
        });

        const transporter = nodemailer.createTransport(transportConfig);

        try {
            // Verify transport configuration
            await transporter.verify();
            console.log('SMTP connection verified successfully');

            const mailOptions = {
                from: account.account_name,
                to,
                subject,
                text
            };

            // Add attachment if provided
            if (attachmentPath) {
                if (!fs.existsSync(attachmentPath)) {
                    throw new Error(`Attachment file not found: ${attachmentPath}`);
                }

                mailOptions.attachments = [{
                    filename: path.basename(attachmentPath),
                    path: attachmentPath
                }];

                console.log('Adding attachment:', path.basename(attachmentPath));
            }

            console.log('Sending email with options:', {
                ...mailOptions,
                text: mailOptions.text.substring(0, 50) + '...', // Truncate body in logs
                attachments: mailOptions.attachments ? mailOptions.attachments.map(a => a.filename) : undefined
            });

            const info = await transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', info.messageId);

            return {
                success: true,
                message: `Email sent from ${fromAccount} to ${to}`,
                messageId: info.messageId
            };
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }
}

module.exports = SendEmailAction;