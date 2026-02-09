var cptRefreshCycle = 1
//Switch between tab timer in seconds
var switchTabTimer = 5
// Activate/deactivate switchTab
var switchTab = false
// Reload timer in minutes
var refreshTabTimer = 10
// Activate/deactivate refresh
var refreshTab = ""
// Activate/deactivate Fullscreen
var fullScreen = false
// Activate/Deactivate Tab URLs memory
var tabReload = false
// Pause while config panel actif
var pauseOnConfig = 0

var tabsUrl = []
var tabsTitle = []
var datetime = ""
var lastdatetime = ""

// switchTabTimer and refreshTabTimer timers convertion in miliseconds
switchTabTimer = switchTabTimer*1000
refreshTabTimer = refreshTabTimer*1000*60

const windowStates = {};  // Object to store states for each window

// Force start of the service-worker 
// https://stackoverflow.com/questions/71724980/chrome-extension-always-show-service-worker-inactive-after-browser-restart-if
chrome.runtime.onStartup.addListener( () => {
    console.log(`onStartup()`);
});
// Listener to pause switching tabs while configuring settings in popup.html
chrome.runtime.onMessage.addListener(
	function (message, sender, sendResponse) {
		//console.log("message swtichitng "+message)
		if (message === 'stopSwitching') {
			setPauseOnConfig(1)
		}
		else{
			setPauseOnConfig(0)
		}
	}
);

function setPauseOnConfig(value){
	pauseOnConfig = value
}
function updateTimers () {

	// Setup timers value from extension configuration
	chrome.storage.local.get(
		{ switchTabTimer: '20', switchTab: false ,refreshTabTimer: '10', refreshTab: false,fullScreen: false, tabReload: false },
		(items) => {
			fullScreen = items.fullScreen
			tabReload = items.tabReload
			switchTabTimer = items.switchTabTimer
			switchTab = items.switchTab
			//console.log('switchTabTimer currently is ' + switchTabTimer + 'seconds, switch is ' + switchTab)
			refreshTabTimer = items.refreshTabTimer	
			refreshTab = items.refreshTab
			//console.log('refreshTabTimer currently is ' + refreshTabTimer+ 'minutes, refresh is ' + refreshTab)
			// switchTabTimer and refreshTabTimer timers convertion in miliseconds	  
			switchTabTimer = switchTabTimer*1000
			refreshTabTimer = refreshTabTimer*1000*60
		}
	)
	//console.log("Update timers : "+pauseOnConfig);
}
async function checkFullscreen(windowId) {
  	const window = await chrome.windows.get(windowId)
	if (window.state === "fullscreen") {
		return true;
	} else {
		return false;
	}
}
function switchRefreshTabs() {
	// Debug timer between reload part 1
	var currentdate = new Date();
	datetime = "Last Sync: " + currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds();

	if (pauseOnConfig === 0) {

		chrome.windows.getAll({populate: true}, function(windows) {
			windows.forEach(window => {
				let allTabs = window.tabs;
				let activeTabIndex = allTabs.findIndex(tab => tab.active);
				
				if (allTabs.length === 0 || activeTabIndex === -1) return;

				// Initialize the state for the window if not already done
				if (!windowStates[window.id]) {
					windowStates[window.id] = {
						tabsUrl: [],
						tabsTitle: [],
						cptRefreshCycle: 1
					};
				}
				// Force full screen after page reload
				// Async function call to check if is in full screen
				// Then put in fullscreen only if needed
				checkFullscreen(window.id).then((isFullScreenSet) => {	
					if(fullScreen && !isFullScreenSet){
						//console.log('set ful screen')
						chrome.windows.update(window.id,{state: 'fullscreen'})
					}
				})

				let tabsState = windowStates[window.id];
				let tabsNumber = allTabs.length;
				let tabToOpen = (activeTabIndex + 1) % tabsNumber;

				// Refresh cycle calculation
				let refreshCycleCalc = switchTab ? refreshTabTimer / (tabsState.cptRefreshCycle * switchTabTimer * tabsNumber)
                                                   : refreshTabTimer / (tabsState.cptRefreshCycle * switchTabTimer);

				if (!tabReload) {
					//console.log('Tab Reload deactivated : ' + tabReload);
					tabsState.tabsUrl.length = 0;
					tabsState.tabsTitle.length = 0;
				} else {
					// Check for active tab if tabswitch not activated.
					if (!switchTab){
						tabToOpen=activeTabIndex;
					}
					//console.log('Tab Reload activated : ' + tabReload);
					// initialize the tabsUrl and tabsTitle arrays if they are empty
					if (tabsState.tabsUrl[tabToOpen] == null) {
						//console.log('Tab Reload index null for  : ' + allTabs[tabToOpen].url);
						tabsState.tabsUrl[tabToOpen] = allTabs[tabToOpen].url;
						tabsState.tabsTitle[tabToOpen] = allTabs[tabToOpen].title;
					} else if (allTabs[tabToOpen].url !== tabsState.tabsUrl[tabToOpen] || allTabs[tabToOpen].title !== tabsState.tabsTitle[tabToOpen]) {
						chrome.tabs.update(allTabs[tabToOpen].id, { url: tabsState.tabsUrl[tabToOpen] });
					}
					
				}

				if (switchTab) {
					//console.log('Tab Switch : ' + allTabs[tabToOpen].url, + ' - time : ' + datetime);
					chrome.tabs.update(allTabs[tabToOpen].id, {active: true});
				}

				if (refreshCycleCalc <= 1 && refreshTab) {
					//console.log('Refresh tab : ' + allTabs[activeTabIndex].url + ' - time : ' + datetime);
					chrome.tabs.reload(allTabs[activeTabIndex].id);
				}

				if ((activeTabIndex === 0 || !switchTab) && refreshCycleCalc <= 1) {
					tabsState.cptRefreshCycle = 1;
					lastdatetime = datetime;
				} else if (activeTabIndex === 0 || !switchTab) {
					tabsState.cptRefreshCycle++;
				}
			});
		});
	}
}

function movingInterval() {

    clearInterval(run); // stop the setInterval()

    // dynamically change the run interval
	updateTimers();
	// switch the tabs
	switchRefreshTabs();
	run = setInterval(movingInterval, switchTabTimer); // start the setInterval()
}

updateTimers();
var run = setInterval(movingInterval, switchTabTimer); // start setInterval as "run"

