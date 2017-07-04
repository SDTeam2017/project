#!/usr/bin/env node

/**
 * Module dependencies.
 */
/*dont worry about this section for now*/
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


/////////////////////////////////////////////////////////////////////
/*THIS IS THE SECTION YOU SHOULD UNDERSTAND*/

var clients={};         //holds objvet made of client peer.id and client peername. the key is the socket.id
var peerid_to_socketid={};  //holds peer.id as key, and socket.id as value
  io.sockets.on('connection', function (socket) {
    
//send peerid and peername of all connected devices to a device that is just added to the network
    socket.on('getClientList',function(){
      for(var key in clients){
      socket.emit("add",clients[key]);
      }
    });

//when a new peer connects to network
    socket.on('addnewpeer', function (peerid) {
        clients[socket.id]={"peerid":peerid,"peername":peerid};
        peerid_to_socketid[peerid]=socket.id;
        io.emit("add",clients[socket.id]);
    });

//when a peer changes its alias name on the network
    socket.on('editname', function (name) {
        clients[socket.id]["peername"]=name;
        io.emit("update",clients[socket.id]);
    });

//when client disconnects from network
    socket.on('disconnect',function(){
      io.emit("remove",clients[socket.id]);   //tell all clients to remove the client from their alias tables
      delete clients[socket.id];    //remove the saved peerid and peername
    })

//checks if an entered alias name is already taken by another device. 
socket.on('check_peer_name',function(name){
      var exists=false;   
      for (var key in clients)
      {
        if(clients[key]['peername']==name&&clients[key]['peerid']!=name)  //if name is taken by another client
        {
          exists=true;
          break;  //stop searching the client list and break out of for loop
        }
      }
      var obj={"name":name, "exists":exists} 
      socket.emit('name_result',obj); //tell the peer that the name they entered is taken or not
    });

//when a local device requests a remote device stream, the server send the peerid of local device to the 
// remote device so that it can place a call and send its stream to the local device.
//Function receives the peerid of the remote device that the local device wants a stream from
    socket.on('force_call',function(peerid){  
      var socketid=peerid_to_socketid[peerid];  //look up socket id of the remove device based on its peerid

      //emit to the remote device only, and tell it to call the local device by passing it the local device
      //peerid
      io.sockets.connected[socketid].emit('make_call',clients[socket.id]['peerid']);
    });
  });

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
