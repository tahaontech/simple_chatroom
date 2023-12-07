const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require("./utils/users");

const BOT_NAME = "Chat Bot";

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// set static pages
app.use(express.static(path.join(__dirname, "public")));

// run when client connect
io.on("connection", (socket) => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        //   welcome current user
        socket.emit("message", formatMessage(BOT_NAME, `Welcome to the chat, ${username}`));

        //   Broadcast when a user connects
        socket.broadcast.to(user.room).emit(
            "message",
            formatMessage(BOT_NAME, `${user.username} has joined the chat.`)
        );

        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    })
  

  

  //   Listen for chat message
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });



  // Runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
        io.emit("message", formatMessage(BOT_NAME, `${user.username} has left the chat.`));

        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        })
    }
  });
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
