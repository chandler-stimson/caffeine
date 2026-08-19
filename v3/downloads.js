/* global update */

{
  const observe = async () => {
    if (observe.busy) {
      return;
    }
    observe.busy = true;
    const prefs = await chrome.storage.local.get({
      downloads: false
    });
    const ds = await chrome.downloads.search({state: 'in_progress'});
    await chrome.storage.session.set({
      'secondary-enabled': ds.length !== 0 && prefs.downloads
    });
    update('active.downloads');
    observe.busy = false;
  };

  const register = async () => {
    if (chrome.downloads) {
      const prefs = await chrome.storage.local.get({
        downloads: false
      });
      chrome.downloads.onCreated.removeListener(observe);
      chrome.downloads.onChanged.removeListener(observe);
      if (prefs.downloads) {
        chrome.downloads.onCreated.addListener(observe);
        chrome.downloads.onChanged.addListener(observe);
      }
      observe();
    }
  };

  register();
  chrome.storage.onChanged.addListener(ps => ps.downloads && register());
}
