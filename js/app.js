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
function switchRefreshTabs () {
	// Debug timer between reload part 1
	var currentdate = new Date() 
	
	datetime = "Last Sync: " + currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds()
	
	// Do not switch if settings windows open
	if (pauseOnConfig==0){
	
		// Force full screen after page reload
		// Async function call to check if is in full screen
		// Then put in fullscreen only if needed
		checkFullscreen(chrome.windows.WINDOW_ID_CURRENT).then((isFullScreenSet) => {	
			if(fullScreen && !isFullScreenSet){
				//console.log('set ful screen')
				chrome.windows.update(chrome.windows.WINDOW_ID_CURRENT,{state: 'fullscreen'})
			}
		})

		chrome.tabs.query({active: true}, function(tabs) {
			var tabIndex = tabs[0].index
			chrome.tabs.query({}, function(tabs) {
				var tabsNumber = tabs.length
				var tabToOpen = tabIndex + 1
				var tabToRefresh = tabIndex
				var refreshCycleCalc = 0

				if (tabToOpen >= tabsNumber) {
					tabToOpen = 0
				}
				
				// Refresh des tabs tous les refreshTabTimer (en miliseconde)
				if(switchTab)refreshCycleCalc = refreshTabTimer/(cptRefreshCycle*switchTabTimer*tabsNumber)
				else refreshCycleCalc = refreshTabTimer/(cptRefreshCycle*switchTabTimer)
				
				
				if (!tabReload){
					// Empty Tab URLs and Titles if tabReload deactivated
					tabsUrl.length  = 0
					tabsTitle.length  = 0
				}
				else {
					//Check if any change with before url on the tab (prevent proxy error message))
					if ((tabs[tabToOpen].url != tabsUrl[tabToOpen] || tabs[tabToOpen].title != tabsTitle[tabToOpen]) && tabsUrl[tabToOpen] != null){
						chrome.tabs.update(tabs[tabToOpen].id, { url: tabsUrl[tabToOpen] })
					}else{
						tabsUrl[tabToOpen] = tabs[tabToOpen].url
						tabsTitle[tabToOpen] = tabs[tabToOpen].title
					}
				}
				
				if (switchTab){
					//console.log('tab to open  '+tabToOpen+' time '+datetime)
					chrome.tabs.update(tabs[tabToOpen].id, {active: true})
				}
				
				if(refreshCycleCalc <= 1 && refreshTab){
					//console.log('tab reload  '+tabToRefresh+' time '+datetime)
					chrome.tabs.reload(tabs[tabToRefresh].id)
				}

				if((tabToRefresh == 0 || !switchTab)&& refreshCycleCalc <= 1) {
					cptRefreshCycle=1
					// Debug timer between reload part 2
					lastdatetime = datetime
				}
				else if (tabToRefresh == 0 || !switchTab) {
					cptRefreshCycle++
				}
			})
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

