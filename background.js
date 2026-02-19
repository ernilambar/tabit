const DEFAULT_MAX_TABS = 10;

// Ordered list of tab IDs, from oldest to newest.
let tabOrder = [];

// Populate tabOrder from all currently open tabs, sorted by tab ID
// (lower IDs were created earlier and serve as a reliable creation-order proxy
// within a single browser session).
async function initTabOrder() {
  const tabs = await chrome.tabs.query({});
  tabs.sort((a, b) => a.id - b.id);
  tabOrder = tabs.map((tab) => tab.id);
}

// Retrieve the user-configured limit (or the default) from sync storage.
async function getMaxTabs() {
  const result = await chrome.storage.sync.get({ maxTabs: DEFAULT_MAX_TABS });
  const value = parseInt(result.maxTabs, 10);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_MAX_TABS;
}

// Close the oldest tab(s) until the count is within the configured limit.
async function enforceTabLimit() {
  const maxTabs = await getMaxTabs();
  while (tabOrder.length > maxTabs) {
    const oldestTabId = tabOrder.shift();
    try {
      await chrome.tabs.remove(oldestTabId);
    } catch (_e) {
      // The tab may have already been closed by the user; ignore the error.
    }
  }
}

// Serialise enforcement calls so rapid tab-creation events do not race.
let enforcementQueue = Promise.resolve();

function queueEnforcement() {
  enforcementQueue = enforcementQueue.then(() => enforceTabLimit());
}

// When a new tab is opened, record it and apply the limit.
chrome.tabs.onCreated.addListener((tab) => {
  tabOrder.push(tab.id);
  queueEnforcement();
});

// When a tab is closed, remove it from our tracking list.
chrome.tabs.onRemoved.addListener((tabId) => {
  const index = tabOrder.indexOf(tabId);
  if (index !== -1) {
    tabOrder.splice(index, 1);
  }
});

// Initialise on service-worker startup so the list reflects any tabs that
// were already open before the extension was installed or the worker restarted.
// Await the initialisation so event listeners don't fire before the list is ready.
(async () => {
  await initTabOrder();
})()
