// Setting up dependencies.
const feathers = require('@feathersjs/feathers');
const configuration = require('@feathersjs/configuration');
const express = require('@feathersjs/express');
const socketio = require('@feathersjs/socketio');

const morgan = require('morgan');
const ClaimService = require('./services/claim');
const BoardService = require('./services/board');
const EVTWrapper = require('./lib/evt');

let feathersApp = feathers().configure(configuration());
let app = express(feathersApp);

// Getting configuration from the config file and environment.
let privateKey = feathersApp.get('privateKey');
let port = feathersApp.get('port');
let host = feathersApp.get('host');
let domain = feathersApp.get('domain');
let width = feathersApp.get('canvasWidth');
let height = feathersApp.get('canvasHeight');
let evtNetwork = feathersApp.get('evtNetwork');

// Create the board service.
let boardService = new BoardService({
  EVTWrapper: new EVTWrapper({privateKey, evtNetwork}),
  domain, width, height
});

// Create the claim service.
let claimService = new ClaimService({
  EVTWrapper: new EVTWrapper({privateKey, evtNetwork}),
  domain
});

// Configure some other middlewares.
app.use(express.json())                          // Turn on JSON body parsing for REST services.
app.use(express.urlencoded({ extended: true })); // Turn on URL-encoded body parsing for REST services.
app.configure(express.rest());                   // Set up REST transport using Express.
app.configure(socketio());                       // Set up socketio.
app.use(morgan('dev'));                          // Set up request logging.
app.use('claim', claimService);                  // Hook up the claim service to the /claim endpoint.
app.use('board', boardService);                  // Hook up the board service to the /board endpoint.

// Enable CORS
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Subscribe users to the anonymous channel.
app.on('connection', connection => {
  // On a new real-time connection, add it to the
  // anonymous channel
  app.channel('anonymous').join(connection);
});

// Publish board status events to the anonymous channel.
app.service('board').publish('status', (data, context) => {
  return [
    app.channel('anonymous')
  ];
});

// Starts the server.
async function startServer() {

  // Create the domain on the everiToken blockchain if it doesn't exist yet.
  var {err, response} = await claimService.createDomainIfNotExists();
  if (err !== null) {
    throw err;
  }

  // Cache the board so that the UI can get a full representation right away.
  var {err, response} = await boardService.cacheBoard();
  if (err !== null) {
    throw err;
  }

  // Start listening!
  let server = app.listen(port, host);
  server.on('listening', () => {
    console.log('\nServer ready and listening.');
  });
}

// Output some start up message which confirms the configuration.
console.log('\nEveripixel REST API starting at http://'+host+':'+port);
console.log('--------------------------------------------------------');
console.log('Canvas Size: ', width, "x", height);
console.log('Token Domain:', domain);
console.log('EVT Network:', evtNetwork);
console.log('--------------------------------------------------------\n');

startServer();
