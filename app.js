var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

var server_entities = {};
var left = null;

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  if(connections == 2) {
    res.send("Server is full");
  }

  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  console.log('connect: ', socket.id);
  if(left == null) {
    left = true;
  }
  else if(left) {
    left = false;
  }

  socket.emit('side', left);

  socket.on('disconnect', function () {
    console.log('disconnect: ', socket.id);
    if(left)  {
      left = null;
    }
    else if(left == false) {
      left = true;
    }
    delete server_entities[socket.id];
  });

  socket.on('my_entities', function(my_entities) {
    server_entities[socket.id] = my_entities;
  });

  socket.on('collision', (collision) => {
    socket.broadcast.to(collision.id).emit('collision', collision.entity);
  });
});

setInterval(() => {
  io.sockets.emit('server_entities', server_entities);
}, 33);

server.listen(3000, function () {
  console.log(`Listening on ${server.address().port}`);
});
