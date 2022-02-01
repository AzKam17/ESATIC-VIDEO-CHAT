const socket = io();

const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;

// 240p video stream
var width = 240;
var height = 0;

var imageStreams = {};

var handleVideoSuccess = function (stream) {
  myVideo.srcObject = stream;
  myVideo.play();
  videoGrid.appendChild(myVideo);
};

myVideo.addEventListener(
  "canplay",
  function (ev) {
    setInterval(function () {
      socket.emit("image", socket.id, takePicture());
    }, 16);

    ev.preventDefault();
  },
  false
);

myVideo.addEventListener(
  "canplay",
  function (ev) {
    setInterval(function () {
      socket.emit("image", socket.id, takePicture());
    }, 16);

    ev.preventDefault();
  },
  false
);

navigator.mediaDevices.enumerateDevices().then((devices) => {
  devices = devices.filter((d) => d.kind === "videoinput");

  navigator.mediaDevices
    .getUserMedia({
      audio: false,
      video: {
        deviceId: devices[0].deviceId,
      },
    })
    .then(handleVideoSuccess);
});

function takePicture() {
  const canvas = document.createElement("canvas");
  height = myVideo.videoHeight / (myVideo.videoWidth / width);
  canvas.setAttribute("width", width);
  canvas.setAttribute("height", height);
  var context = canvas.getContext("2d");
  if (width && height) {
    canvas.width = width;
    canvas.height = height;
    context.drawImage(myVideo, 0, 0, width, height);    
  } else {
    context.fillStyle = "#000";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  return canvas.toDataURL("image/png");
}

let user = prompt("Veuillez entrer votre nom");
let phoneNumber = prompt('Veuillez entrer votre numéro de téléphone : ');

socket.emit("join-room", ROOM_ID, socket.id, user, phoneNumber);

socket.on("image", (userId, image) => {
  if (!imageStreams.hasOwnProperty(userId)) {
    imageStreams[userId] = document.createElement("img");
    videoGrid.appendChild(imageStreams[userId]);
  }
  imageStreams[userId].setAttribute("src", image);
});


socket.on("disconnected", (userId) => {
  if (imageStreams.hasOwnProperty(userId)) {
    videoGrid.removeChild(imageStreams[userId]);
    delete imageStreams[userId];
    // delete audioStreams[userId];
  }
});


let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");

send.addEventListener("click", (e) => {
  if (text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

text.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

const inviteButton = document.querySelector("#inviteButton");
inviteButton.addEventListener("click", (e) => {
  prompt(
    "Copy this link and send it to people you want to meet with",
    window.location.href
  );
});

socket.on("createMessage", (message, userName) => {
  messages.innerHTML =
    messages.innerHTML +
    `<div class="message">
        <b><i class="far fa-user-circle"></i> <span> ${
          userName === user ? "Moi" : userName
        }</span> </b>
        <span>${message}</span>
    </div>`;
});