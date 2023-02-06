const options = {
  autohighlight: true,
};

// save options to chrome storage
function save_options() {
  var storage = {};
  for (var option in options) {
    storage[option] = document.getElementById(option).checked;
  }
  chrome.storage.sync.set(storage, function () {});
}

// restore options from chrome storage
function restore_options() {
  chrome.storage.sync.get(options, function (items) {
    for (var option in items) {
      document.getElementById(option).checked = items[option];
    }

    for (var option in options) {
      document.getElementById(option).disabled = items.disabled;
      if (items.disabled) {
        document.getElementById("disabled").disabled = false;
      }
    }
  });
}

// show shortcuts in the options window
chrome.commands.getAll(function (commands) {
  var hotkeysDiv = document.getElementById("hotkeys");
  console.log(commands);
  for (let i = 0; i < commands.length; i++) {
    var tag = document.createElement("p");
    var text = document.createTextNode(
      commands[i].shortcut + " - " + commands[i].description
    );
    tag.appendChild(text);
    hotkeysDiv.appendChild(tag);
  }
});

// show version in the options window
var version = document.getElementById("version");
version.innerHTML = "v" + chrome.runtime.getManifest().version;

// restore options on load and when they change in the store
document.addEventListener("DOMContentLoaded", restore_options);
chrome.storage.onChanged.addListener(function (_changes, _namespace) {
  restore_options();
});

// listen to changes of options
for (var option in options) {
  document.getElementById(option).addEventListener("change", save_options);
}
