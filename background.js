// Installer
chrome.runtime.onInstalled.addListener(async function installScript(details) {
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

let tabs = [];
let index = -1;

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

function updateTabs() {
  tabs = [];
  return new Promise(async (resolve) => {
    let matches = chrome.runtime.getManifest().content_scripts[0].matches;

    for (const match of matches) {
      const res = await chrome.tabs.query({ url: match });
      tabs.push(...res);
    }
    tabs.length > 0 ? resolve(true) : resolve(false);
  });
}

function switchTab() {
  updateTabs().then((res) => {
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

async function checkActiveTabInFocusedWindow() {
  return new Promise(async (resolve) => {
    const windows = await chrome.windows.getAll({ populate: true });
    const focusedWindow = windows.filter((w) => w.focused)[0];
    if (focusedWindow) {
      const activeTab = focusedWindow.tabs.filter((t) => t.active)[0];
      if (activeTab) {
        index = tabs.findIndex((t) => t.id === activeTab.id);
        resolve(index);
      }
    }
    resolve(-1);
  });
}

function videoAction(action) {
  updateTabs().then(async (res) => {
    if (res && index >= 0 && index < tabs.length) {
      const activeTabIndex = await checkActiveTabInFocusedWindow();
      if (activeTabIndex !== -1) {
        index = activeTabIndex;
        chrome.tabs.sendMessage(tabs[index].id, { action: action });
      } else {
        chrome.windows.update(tabs[index].windowId, { focused: true });
        chrome.tabs.highlight(
          { tabs: tabs[index].index, windowId: tabs[index].windowId },
          () => {}
        );
        chrome.tabs.sendMessage(tabs[index].id, { action: action });
      }
    }
  });
}
