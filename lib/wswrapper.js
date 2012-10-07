// Proxy and Server class to support legacy web socket implementation as well as newest version
// https://github.com/wcauchois/websocket-fallback

var util     = require("util")
  , events   = require('events')

try {
  WebSocketServer   = require('websocket-server');
  WebSocketRequest  = require('websocket').request;
  Mixin             = require('websocket-server/lib/lang/mixin');
  miksagoConnection = require('websocket-server/lib/ws/connection');
} catch(e) {
  console.log("You probably need to install the following modules: websocket-server, websocket, commander");
  console.log("Locally with `npm install websocket-server websocket commander` or globally with `sudo npm install -g websocket-server websocket commander`");
  process.exit(1);
}

function ConnectionProxy(conn, server) {

  events.EventEmitter.call(this);

  this._conn = conn;
  this._server = server;
  this.storage = {};
  this.remoteAddress = this._conn.remoteAddress;
  this.specs = this._conn.specs;

  this._conn.on('message', (function(msg) {
    if (typeof msg.type !== 'undefined') {
      if (msg.type !== 'utf8') {
        return;
      }
      msg = msg.utf8Data;
    }
    this.emit('message', msg);
  }).bind(this));

  this._conn.on('close', (function() {
    this.emit('close');
    this._server.emit('close', this);
  }).bind(this));
}

util.inherits(ConnectionProxy, events.EventEmitter);

ConnectionProxy.prototype.send = function(msg) {
  if (typeof this._conn.sendUTF == 'function') {
    this._conn.sendUTF(msg);
  } else {
    this._conn.send(msg);
  }
};

function ConnectionServer(options) {
  events.EventEmitter.call(this);
  options = options || {};

  this.httpServer = options.httpServer;
  this.miksagoServer = WebSocketServer.createServer();
  this.miksagoServer.server = this.httpServer;

  this._err = options.err || function(e) { };
  this.config = Mixin({
    maxReceivedFrameSize: 0x10000,
    maxReceivedMessageSize: 0x100000,
    fragmentOutgoingMessages: true,
    fragmentationThreshold: 0x4000,
    keepalive: true,
    keepaliveInterval: 20000,
    assembleFragments: true,
    disableNagleAlgorithm: true,
    closeTimeout: 5000
  }, options.config);

  this.miksagoServer.on('connection', (function(conn) {
    conn.remoteAddress = conn._socket.remoteAddress;
    conn.specs = 'legacy';
    this._handleConnection(conn);
  }).bind(this));

  this.httpServer.on('upgrade', (function(req, socket, head) {

    if (typeof req.headers['sec-websocket-version'] !== 'undefined') {
      var wsRequest = new WebSocketRequest(socket, req, this.config);
      try {
        wsRequest.readHandshake();
        var wsConnection = wsRequest.accept(wsRequest.requestedProtocols[0], wsRequest.origin);
        wsConnection.specs = 'current';
        this._handleConnection(wsConnection);
      } catch(e) {
        this._err(new Error('websocket request unsupported by WebSocket-Node: ' + e.toString()));
        return;
      }
    } else {
      this.specs = 'legacy';
      if (req.method == 'GET' &&
         (req.headers.upgrade && req.headers.connection) &&
         req.headers.upgrade.toLowerCase() === 'websocket' &&
         req.headers.connection.toLowerCase() === 'upgrade') {
        new miksagoConnection(this.miksagoServer.manager, this.miksagoServer.options, req, socket, head);
      }
    }

  }).bind(this));
}

util.inherits(ConnectionServer, events.EventEmitter);

ConnectionServer.prototype._handleConnection = function(conn) {
  this.emit('connection', new ConnectionProxy(conn, this));
}

ConnectionServer.prototype.listen = function(port, hostname, callback) {
  this.httpServer.listen(port, hostname, callback);
}

exports.ConnectionServer = ConnectionServer;

/*

  This is for when we'll be able to forget iOS < 6

  wsServer = new websocket.server({
    httpServer: httpServer,
    autoAcceptConnections: false
  });

  wsServer.on('request', function(request) {

    var connection = request.accept('conjole-protocol', request.origin);

    clients[connection.remoteAddress] = connection;

    connection.on('message', function(message) {

      currentClient = connection;

      if (message.type === 'utf8') {
        output(message.utf8Data, connection.remoteAddress);
      }

    });

    connection.on('close', function(reasonCode, description) {
      if (currentClient.remoteAddress == connection.remoteAddress) {
        currentClient = null;
      }
      delete clients[connection.remoteAddress];
    });
  });
*/
