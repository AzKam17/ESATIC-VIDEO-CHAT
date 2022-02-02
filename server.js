var express = require("express");
const { v4: uuidv4 } = require("uuid");
const axios = require('axios');
const { Console } = require("console");
var app = express();
var http = require("http").createServer(app);
var io = require("socket.io")(http);

let orangeApiSmsToken = {
  token: null,
  time: new Date().getTime()
}

const refreshToken = async function(){
  let tokenToReturn = await axios.post(
    "https://api.orange.com/oauth/v3/token",
    "grant_type=client_credentials",
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${process.env.SMS_API}`
      }
    }
  );
  orangeApiSmsToken.token = tokenToReturn.data.access_token;
}

const sendMessage = function(userName, phoneNumber, roomUrl){
  const tempsExpiration = orangeApiSmsToken.time + 3600;
  const tempsActuel = new Date().getTime();

  if(tempsActuel > orangeApiSmsToken.time && tempsActuel < tempsExpiration){
    console.log('Token expiré - Génération d\'un nouveau token');

    refreshToken().then((res) => {
      orangeApiSmsToken.time = (new Date().getTime());
      sendMessage(phoneNumber, roomUrl);
    });
  }
  
  console.log(`Envoi du message de connexion de base à ${phoneNumber} pour la room ${roomUrl}.`);

  axios.post(
    `https://api.orange.com/smsmessaging/v1/outbound/tel:+225${process.env.devPhoneNumber}/requests`,
    {
      "outboundSMSMessageRequest": {
        "address": `tel:+225${phoneNumber}`,
        "senderAddress": `tel:+225${process.env.devPhoneNumber}`,
        "outboundSMSTextMessage": {
          "message": `Bienvenue ${userName} sur notre application de chat. Le lien vers votre room est : ${process.env.platformURL}/${roomUrl}`
        }
      }
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${orangeApiSmsToken.token}`
      }
    }
  )
  .then(function (response) {
      console.log(response.data);
  })
  .catch(function (error) {
    console.log(error.response.data);
  });
}

/*refreshToken().then((res) => {
  console.log('Génération du token de base.');
  orangeApiSmsToken.time = (new Date().getTime());
  console.log(orangeApiSmsToken);
});*/


app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.redirect(`/${uuidv4()}`);
  });
  
  app.get("/:room", (req, res) => {
    res.render("room", { roomId: req.params.room });
  });

let phoneNumbers = {};

io.on("connection", (socket) => {
  console.log(`User ${socket.id} connected`);

  socket.on("image", (userId, image) => {
    socket.broadcast.emit("image", userId, image);
  });

  socket.on("join-room", (roomId, userId, userName, phoneNumber) => {
    //sendMessage(userName, phoneNumber, roomId);

    socket.join(roomId);

    socket.to(roomId).broadcast.emit("user-connected", userId);
    
    socket.on("message", (message, phoneNumber) => {
      io.to(roomId).emit("createMessage", message, userName);

      console.table(phoneNumbers[roomId]);
    });
  });

  socket.on("disconnect", () => {
    socket.broadcast.emit("disconnected", socket.id);
    console.log(`User ${socket.id} disconnected`);
  });
});

http.listen(process.env.PORT || 3000, () => {
  console.log('listening on *:3000');
});
