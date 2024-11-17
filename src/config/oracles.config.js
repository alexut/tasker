const path = require('path');
const config = require('./index');

// All paths are relative to basePath from main config
module.exports = {
    oracles: {
        // Data oracles
        'invoices': 'finances/invoices.csv',
        'projects': 'core/projects.json',
        'leads': 'clients/leads.csv',
        'offers': 'clients/offers.json',
        'clients': 'clients/clients.csv',
        'templates': 'templates/templates.json',
        'objectives': 'core/objectives.json',
        // Script oracles   
        "curs": "core/scripts/cursvalutar.oracle",
    }
};