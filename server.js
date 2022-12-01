const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const path = require('path');
const formatMessage = require('./utils/messages');
const { userJoin, getUserById, userLeave, getRoomUsers} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = "Mr. President (BOT)"

io.on('connection', (socket) => {
  console.log("new client connected!");
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Welcome message to new client
    socket.emit('message', formatMessage(botName,'Welcome to ChitChat!'));
    // Broadcast when new client joins
    socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chitchat room ${user.room}`));

    // Send Users and Room info to the Client UI
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });

  });
  
  // run when user sends a message to chat
  socket.on('message', (msg) => {
    console.log('message: ' + msg);
    io.emit('message', msg);
  });

  // Listen for chatMessage
  socket.on('chatMessage', (msg) => {
    const user = getUserById(socket.id);
    //console.log(user.username);
    io.to(user.room).emit('message', formatMessage(user.username,msg));
  });

  //runs when client disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);
    if (user) {
      io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the Chitchat`));
      console.log('Client disconnected');
      
     // Send Users and Room info to the Client UI Also on Disconnect so it updates!
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
    }
    
  });

  
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
