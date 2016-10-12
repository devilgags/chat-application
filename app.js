
var chalk = require('chalk');
var express = require('express'),
  app = express(),
  server = require('http').createServer(app),
  io = require('socket.io').listen(server);

//empty users
users = {};

//listening on port 8000
var port = process.env.PORT || 8000;
server.listen(port,function (err) {
  if (err) {
    console.error(JSON.stringify(err));
  }
  else {
    console.log(chalk.yellow("Server listening on localhost:" + port));
  }
});



//serving static content in public
app.use(express.static(__dirname + '/public'));

//set ejs as view engine
app.set('view engine', 'ejs');

app.get('/', function (req, res) {
  res.render('index');
});

//event on socket connection
io.sockets.on('connection', function (socket) {

  console.log("A New Connection Established");

  socket.on('new user', function (data, callback) {
    if (data in users) {
      console.log("Username already exists");
      callback(false);
    } else {
      console.log("Username available");
      callback(true);
      socket.nickname = data;
      users[socket.nickname] = socket;
      updateNames();
    }
  });


  function updateNames() {
    io.sockets.emit('usernames', Object.keys(users));
  }


  socket.on('send message', function (data, callback) {
    var msg = data.trim();

    if (msg.substr(0, 1) === '@') {
      msg = msg.substr(1);
      var ind = msg.indexOf(' ');
      if (ind !== -1) {
        var name = msg.substring(0, ind);
        var msg = msg.substring(ind + 1);
        if (name in users) {
          users[name].emit('whisper', { msg: msg, nick: socket.nickname });
          socket.emit('private', { msg: msg, nick: name });
          console.log("Whispering !");
        } else {
          callback("Sorry, " + name + " is not online");
        }
      } else {
        callback("Looks like you forgot to write the message");
      }

    }

    else {
      console.log("Got Message :" + data)
      io.sockets.emit('new message', { msg: msg, nick: socket.nickname });
    }
  });


//event on socket disconnect
  socket.on('disconnect', function (data) {
    if (!socket.nickname) return;
    delete users[socket.nickname];
    updateNames();
  });


});
