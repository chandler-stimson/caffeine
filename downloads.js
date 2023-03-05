/* global update */

{
  const observe = () => chrome.storage.local.get({
    downloads: false
  }, prefs => chrome.downloads.search({state: 'in_progress'}).then(ds => {
    chrome.storage.session.set({
      'secondary-enabled': ds.length !== 0 && prefs.downloads
    }, () => update('active.downloads'));
  }));
  const register = () => chrome.downloads && chrome.storage.local.get({
    downloads: false
  }, prefs => {
    if (chrome.downloads) {
      chrome.downloads.onChanged.removeListener(observe);
      if (prefs.downloads) {
        chrome.downloads.onChanged.addListener(observe);
      }
      observe();
    }
  });
  register();
  chrome.storage.onChanged.addListener(ps => ps.downloads && register());
}
