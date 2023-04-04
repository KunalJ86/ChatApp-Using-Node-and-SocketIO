const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./util/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./util/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const botName = "Admin";
//set static folder
app.use(express.static(path.join(__dirname, "public")));

//run when client connects
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    socket.emit("message", formatMessage(botName, "Welcome to chatcord"));

    //broadcast when user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} joined the chat`)
      );
    //send users and room info
    io.to(user.room).emit("roomusers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
    socket.on("disconnect", () => {
      const user = userLeave(socket.id);

      if (user) {
        io.to(user.room).emit(
          "message",
          formatMessage(botName, `${user.username} has left the chat`)
        );
        //send users and room info
        io.to(user.room).emit("roomusers", {
          room: user.room,
          users: getRoomUsers(user.room),
        });
      }
    });
  });

  //listen for chat message
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
