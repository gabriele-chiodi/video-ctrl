let tabs = [];
let index = -1;

chrome.commands.onCommand.addListener(command => {
  if (command === "switch-video-tab") {
    switchTab();
  } else if (command === "play-pause-video") {
    videoAction("playpause");
  } else if (command === "forward-video") {
    videoAction("forward5");
  } else if (command === "backward-video") {
    videoAction("backward5");
  }
});

function updateTabs() {
  tabs = [];
  return new Promise(resolve => {
    chrome.tabs.query({
      url: "*://*.youtube.com/watch?*"
    }).then(res => {
      res.forEach(el => {
        chrome.tabs.sendMessage(el.id, { action: "ping" }, function (response) {
          if (typeof response === "undefined")
            chrome.tabs.reload(el.id);
        });
      });
      tabs = res.slice();
      tabs.length > 0 ? resolve(true) : resolve(false);
    });
  });
}

function switchTab() {
  updateTabs()
    .then(res => {
      if (res) {
        index = (index + 1) % tabs.length;
        chrome.windows.update(tabs[index].windowId, { focused: true });
        chrome.tabs.highlight({ tabs: tabs[index].index, windowId: tabs[index].windowId }, () => { });
      }
    });
}

function videoAction(action) {
  updateTabs()
    .then(res => {
      if (res && index >= 0 && index < tabs.length) {
        chrome.tabs.sendMessage(tabs[index].id, { action: action });
      }
    });
}