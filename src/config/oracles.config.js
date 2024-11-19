const path = require('path');
const config = require('./index');

// All paths are relative to basePath from main config
module.exports = {
    oracles: {
        // Data oracles
        'invoices': {
            path: 'finances/invoices.csv',
            description: 'Financial invoices data in CSV format containing invoice details'
        },
        'team' : {
            path: 'core/team.json',
            description: 'Team members and roles'
        },
        'projects': {
            path: 'core/projects.json',
            description: 'Project management data'
        },
        'leads': {
            path: 'clients/leads.csv',
            description: 'Sales leads information tracking potential clients and opportunities'
        },
        'offers': {
            path: 'clients/offers.json',
            description: 'Client offers and proposals including price and service details'
        },
        'clients': {
            path: 'clients/clients.csv',
            description: 'Client database containing contact information'
        },
        'templates': {
            path: 'templates/templates.json',
            description: 'Document templates for various business processes and communications'
        },
        'objectives': {
            path: 'core/objectives.json',
            description: 'Business objectives'
        },
        // Script oracles   
        "curs": {
            path: "core/scripts/cursvalutar.oracle",
            description: 'Currency exchange rate script for financial calculations'
        }
    }
};