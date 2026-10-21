const serverless = require('serverless-http');
const app = require('../../server/app');

// Wrap the Express app as a serverless handler for AWS Lambda / Netlify Functions
module.exports.handler = serverless(app, {
  binary: ['image/*', 'application/pdf', 'application/octet-stream'],
});
