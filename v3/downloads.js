/* global update */

{
  const observe = async () => {
    const prefs = await chrome.storage.local.get({
      downloads: false
    });
    const ds = await chrome.downloads.search({state: 'in_progress'});
    await chrome.storage.session.set({
      'secondary-enabled': ds.length !== 0 && prefs.downloads
    });
    update('active.downloads');
  };

  const register = async () => {
    if (chrome.downloads) {
      const prefs = await chrome.storage.local.get({
        downloads: false
      });
      chrome.downloads.onChanged.removeListener(observe);
      if (prefs.downloads) {
        chrome.downloads.onChanged.addListener(observe);
      }
      observe();
    }
  };

  register();
  chrome.storage.onChanged.addListener(ps => ps.downloads && register());
}
