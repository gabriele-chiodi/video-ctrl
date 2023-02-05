chrome.runtime.onMessage.addListener(function (message, _, _) {
  var video = document.querySelector("video");

  if (message.action === "playpause") {
    video.paused ? video.play() : video.pause();
  } else if (message.action === "forward5") {
    video.currentTime += 5;
  } else if (message.action === "backward5") {
    video.currentTime -= 5;
  }
});
