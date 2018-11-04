const feathers = require('@feathersjs/feathers');
const configuration = require('@feathersjs/configuration');
const express = require('@feathersjs/express');
const socketio = require('@feathersjs/socketio');

const morgan = require('morgan');
const ClaimService = require('./services/claim');
const BoardService = require('./services/board');
const EVTWrapper = require('./lib/evt');

let domain = "pixeltoken";
let width = 50;
let height = 50;

let feathersApp = feathers().configure(configuration());
let app = express(feathersApp);
let privateKey = feathersApp.get('privateKey');
let port = feathersApp.get('port');
let host = feathersApp.get('host');


// Enable CORS
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Create the board service.
let boardService = new BoardService({
  EVTWrapper: new EVTWrapper({privateKey}),
  domain
});

// Create the claim service.
let claimService = new ClaimService({
  EVTWrapper: new EVTWrapper({privateKey}),
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
// app.use(express.errorHandler());              // Set up an error handler that gives us nicer errors.

app.on('connection', connection => {
  // On a new real-time connection, add it to the
  // anonymous channel
  app.channel('anonymous').join(connection);
});

// Publish the `created` event to admins and the user that sent it
app.service('board').publish('status', (data, context) => {
  return [
    app.channel('anonymous')
  ];
});

async function startServer() {
  var {err, response} = await claimService.createDomainIfNotExists();
  if (err !== null) {
    throw err;
  }

  var {err, response} = await boardService.cacheBoard();
  if (err !== null) {
    throw err;
  }

  let server = app.listen(port, host);                   // Start the server on port 3030.
  server.on('listening', () => {
    console.log('\nServer ready and listening.');
  });
}

console.log('\nEveripixel REST API starting at http://'+host+':'+port);
console.log('Domain:', domain);
startServer();
