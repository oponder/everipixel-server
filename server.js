const feathers = require('@feathersjs/feathers');
const express = require('@feathersjs/express');
const morgan = require('morgan');
const ClaimService = require('./services/claim');
const EVTWrapper = require('./lib/evt');

let publicKey = "EVT5mdMnhhJdRmsebtY36DC2Pawqy79D8ojrVwGtAf9zcjMfiN18f";
let privateKey = "5K4jQMfiV5PqJqiXmGc2p4QqGgmt3RN5Jew3Bqs38VwG47Vbwzb";

let app = express(feathers());

// Enable CORS
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Create the claim endpoint.
let claimService = new ClaimService({
  EVTWrapper: new EVTWrapper({publicKey, privateKey})
});

// Configure some other middlewares.
app.use(express.json())                          // Turn on JSON body parsing for REST services.
app.use(express.urlencoded({ extended: true })); // Turn on URL-encoded body parsing for REST services.
app.configure(express.rest());                   // Set up REST transport using Express.
app.use(morgan('dev'));                          // Set up request logging.
app.use('claim', claimService);                  // Use the claim endpoint.
// app.use(express.errorHandler());              // Set up an error handler that gives us nicer errors.

async function startServer() {
  let {err, response} = await claimService.createDomainIfNotExists();
  if (err !== null) {
    throw err;
  } else {
    let server = app.listen(3030);                   // Start the server on port 3030.
    server.on('listening', () => console.log('\nEveripixel REST API started at http://localhost:3030'));
  }
}

startServer();
