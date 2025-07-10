// Saves options to chrome.storage
const saveOptions = () => {
    const cstSwitchTabTimer = document.getElementById('switchTabTimer').value;
    const cstSwitchTab = document.getElementById('switchTab').checked;
    const cstRefreshTabTimer = document.getElementById('refreshTabTimer').value;
    const cstRefreshTab = document.getElementById('refreshTab').checked;
  	const cstfullScreen = document.getElementById('fullScreen').checked;
    const csttabReload = document.getElementById('tabReload').checked;

    chrome.storage.local.set(
      { switchTabTimer: cstSwitchTabTimer, switchTab: cstSwitchTab, refreshTabTimer: cstRefreshTabTimer, refreshTab: cstRefreshTab,fullScreen: cstfullScreen, tabReload: csttabReload },
      () => {
        // Update status to let user know options were saved.
        const status = document.getElementById('status');
        status.textContent = 'Options saved';
        setTimeout(() => {
          status.textContent = '';
        }, 750);
      }
    );
    // Reload extension after saving settings
    chrome.runtime.reload();
  };
  // Restores select box and checkbox state using the preferences
  // stored in chrome.storage.
  const restoreOptions = () => {
    chrome.storage.local.get(
      // Default values all deactivated
      { switchTabTimer: '20', switchTab: false ,refreshTabTimer: '10', refreshTab: false ,fullScreen: false, tabReload: false},
      (items) => {
        document.getElementById('switchTabTimer').value = items.switchTabTimer;
        document.getElementById('switchTab').checked = items.switchTab;
        document.getElementById('refreshTabTimer').value = items.refreshTabTimer;
        document.getElementById('refreshTab').checked = items.refreshTab;
        document.getElementById('fullScreen').checked = items.fullScreen;
        document.getElementById('tabReload').checked = items.tabReload;
      }
    );
    chrome.runtime.sendMessage('stopSwitching'); 
  };
  // Send message to app.js to pause when config windows/popup loaded
  const startPauseONconfig = () => {
    if (document.visibilityState === "visible") {
      chrome.runtime.sendMessage('stopSwitching');
    } else{
      chrome.runtime.sendMessage('startSwitching');
    }
  };

  document.addEventListener('DOMContentLoaded', restoreOptions);
  document.addEventListener('visibilitychange',startPauseONconfig);
  document.getElementById('save').addEventListener('click', saveOptions);