var express = require("express");
const { v4: uuidv4 } = require("uuid");
var app = express();
var http = require("http").createServer(app);
var io = require("socket.io")(http);

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.redirect(`/${uuidv4()}`);
  });
  
  app.get("/:room", (req, res) => {
    res.render("room", { roomId: req.params.room });
  });
  

io.on("connection", (socket) => {
  console.log(`User ${socket.id} connected`);

  socket.on("image", (userId, image) => {
    socket.broadcast.emit("image", userId, image);
  });

  socket.on("disconnect", () => {
    socket.broadcast.emit("disconnected", socket.id);
    console.log(`User ${socket.id} disconnected`);
  });
});

http.listen(process.env.PORT || 3000, () => {
  console.log('listening on *:3000');
});
