#!/usr/bin/env node

/**
 * Module dependencies.
 */

var app = require('../app');
var debug = require('debug')('myapp:server');
//var http = require('http');


//https code
var https = require('https');
var fs = require('fs');
var options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};
var server = https.createServer(options, app
/*  function (req, res) {
  res.writeHead(200);
  res.end("hello world\n");
}*/
).listen(80);
var io = require('socket.io')(server);
/*code for peerjs with existing express app*/
/*********************************************/
var peerhttps = require('https');
var peerexpress = require('express');
var peerapp = peerexpress();
var ExpressPeerServer = require('peer').ExpressPeerServer;
var peeroptions = {
  sslkey: fs.readFileSync('./key.pem'),
  sslcert: fs.readFileSync('./cert.pem')
};

var serverlisten = peerhttps.createServer(options, peerapp).listen(9000);

peerapp.get('/api', function(req, res, next) {
    console.log("get /")
    res.send('peer server running');
});

peerServer = ExpressPeerServer(serverlisten, peeroptions)

peerapp.use('/', peerServer);
var clients={};

/*peerServer.on('connection', function(id) {
    console.log(id+ " connected")
    client_list.push(id);
});

peerServer.on('disconnect', function(id) {
    console.log(id + " disconnected");
    var index=client_list.indexOf(id);
    client_list.splice(index,1);
});*/
peerServer.on('connection', function(id) {
    clients[id]={"peername":id};
});

io.sockets.on('connection', function (socket) {
  
  socket.on('check_peer_name',function(name){
    var exists=false;
    for (var key in clients)
    {
      console.log("key :"+clients[key]['peername'])
      if(clients[key]['peername']==name)
      {
        exists=true;
        break;
      }
    }
    socket.emit('name_result',exists);
  });

  socket.on('addnewpeer', function (newpeer) {
    for (var key in newpeer){
      clients[key]={"socketid":socket.id,"peername":newpeer[key]};
    }
  });
  /*socket.on('disconnect',function(id){
      delete clients[id];
      console.log(socket.id+" disconnected");
  });*/

});
  peerServer.on('disconnect', function(id) {
   delete clients[id];
});
//var peerserver = peerhttps.createServer(options, peerapp).listen(9000);//require('http').createServer(peerapp);
//peerapp.use('/', ExpressPeerServer(peerserver, options));
//var peerjsbin = require('peer/bin/peerjs')

/***************************************************/


/**
 * Get port from environment and store in Express.
 */

//var port = normalizePort(process.env.PORT || '3000');
var port = '80';
app.set('port', port);

/**
 * Create HTTP server.
 */

//var server = http.createServer(app);
/**
 * Listen on provided port, on all network interfaces.
 */

//server.listen(port);
  var os = require('os');

var interfaces = os.networkInterfaces();
var addresses = [];
interfaceloop: for (var k in interfaces) {
    for (var k2 in interfaces[k]) {
        var address = interfaces[k][k2];
        if (address.family === 'IPv4' && !address.internal) {
            addresses.push(address.address);
            break interfaceloop;
        }        
    }
}
var nodeIP = String(addresses);


server.listen(port,nodeIP, function()
{
  console.log("Server running on " +nodeIP +":" +port);
});
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();

  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
