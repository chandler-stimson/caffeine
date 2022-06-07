/* global update */

{
  const observe = () => chrome.storage.local.get({
    downloads: false
  }, prefs => chrome.downloads.search({state: 'in_progress'}).then(ds => {
    chrome.storage.local.set({
      'secondary-enabled': ds.length !== 0 && prefs.downloads
    }, () => update('active.downloads'));
  }));
  const once = () => chrome.downloads && chrome.storage.local.get({
    downloads: false
  }, prefs => {
    chrome.downloads.onChanged.removeListener(observe);
    if (prefs.downloads) {
      chrome.downloads.onChanged.addListener(observe);
    }
    observe();
  });
  chrome.runtime.onStartup.addListener(once);
  chrome.runtime.onInstalled.addListener(once);
  chrome.storage.onChanged.addListener(ps => ps.downloads && once());
}
