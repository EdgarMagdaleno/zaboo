var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

var server_entities = {};

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  console.log('connect: ', socket.id);

  socket.on('disconnect', function () {
    console.log('disconnect: ', socket.id);
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

server.listen(2000, function () {
  console.log(`Listening on ${server.address().port}`);
});
