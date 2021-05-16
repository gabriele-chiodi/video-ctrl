chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.action === "ping") {
      sendResponse({ action: "pong" });
      return;
    }
    var video = document.querySelector("video");
    if (request.action === "playpause") {
      video.paused ? video.play() : video.pause();
    } else if (request.action === "forward5") {
      video.currentTime += 5;
    } else if (request.action === "backward5") {
      video.currentTime -= 5;
    }
  }
);