// content script installer
chrome.runtime.onInstalled.addListener(async function installScript(_) {
  let tabs = await chrome.tabs.query({});
  let window = await chrome.windows.getCurrent();
  previous_window = window.id;
  let contentFiles = chrome.runtime.getManifest().content_scripts[0].js;
  let matches = chrome.runtime.getManifest().content_scripts[0].matches;

  for (let index = 0; index < tabs.length; index++) {
    let execute = false;
    matches.forEach(function (match) {
      let reg = match.replace(/[.+?^${}()|/[\]\\]/g, "\\$&").replace("*", ".*");
      if (new RegExp(reg).test(tabs[index].url) === true) {
        execute = true;
        return;
      }
    });

    if (execute) {
      try {
        chrome.scripting.executeScript({
          target: { tabId: tabs[index].id },
          files: contentFiles,
        });
      } catch (e) {}
    }
  }
});

// array of tabs that contain videos
let tabs = [];
// index of the current tab that contains a video
let index = -1;
// default options
let options = {
  autohighlight: true,
};

// update settings from storage
update_settings();

function update_settings() {
  chrome.storage.sync.get(Object.keys(options), function (result) {
    options = Object.assign(options, result);
    if (options.disabled === true) {
      options.autohighlight = false;
    }
  });
}

// listen to changes in storage
chrome.storage.onChanged.addListener(async function (changes, namespace) {
  for (const key in changes) {
    options[key] = changes[key].newValue;
  }
});

chrome.commands.onCommand.addListener(async (command) => {
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

function updateTabsAndIndex() {
  tabs = [];

  return new Promise(async (resolve) => {
    let matches = chrome.runtime.getManifest().content_scripts[0].matches;

    for (const match of matches) {
      const res = await chrome.tabs.query({ url: match });
      tabs.push(...res);
    }

    if (tabs.length > 0) {
      // get the active tab of the last focused window
      let [tab] = await chrome.tabs.query({
        active: true,
        lastFocusedWindow: true,
      });
      if (tab) {
        // update the index with the index of the active tab (in the last focused window) iff it's not -1
        const _index = tabs.findIndex(
          (t) => t.id === tab.id && t.windowId === tab.windowId
        );
        if (_index !== -1) {
          index = _index;
        }
      }
      resolve(true);
    } else {
      index = -1;
      resolve(false);
    }
  });
}

function switchTab() {
  updateTabsAndIndex().then((res) => {
    if (res) {
      index = (index + 1) % tabs.length;
      chrome.windows.update(tabs[index].windowId, { focused: true });
      chrome.tabs.highlight(
        { tabs: tabs[index].index, windowId: tabs[index].windowId },
        () => {}
      );
    }
  });
}

function videoAction(action) {
  updateTabsAndIndex().then(async (res) => {
    if (res && index !== -1) {
      if (options.autohighlight) {
        chrome.windows.update(tabs[index].windowId, { focused: true });
        chrome.tabs.highlight(
          { tabs: tabs[index].index, windowId: tabs[index].windowId },
          () => {}
        );
      }
      chrome.tabs.sendMessage(tabs[index].id, { action: action });
    }
  });
}
