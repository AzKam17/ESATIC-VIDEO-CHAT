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