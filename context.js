/* global update */
{
  const once = () => chrome.storage.local.get({
    level: 'display',
    timeouts: [{
      period: 5,
      title: '5 Minutes'
    }, {
      period: 15,
      title: '15 Minutes'
    }, {
      period: 30,
      title: '30 Minutes'
    }, {
      period: 60,
      title: '1 Hour'
    }, {
      period: 6 * 60,
      title: '6 Hours'
    }, {
      period: 12 * 60,
      title: '12 Hours'
    }, {
      period: 24 * 60,
      title: '24 Hours'
    }],
    downloads: false
  }, prefs => {
    chrome.contextMenus.create({
      id: 'level.system',
      title: 'System Level',
      type: 'radio',
      contexts: ['action'],
      checked: prefs.level === 'system'
    });
    chrome.contextMenus.create({
      id: 'level.display',
      title: 'Display Level',
      type: 'radio',
      contexts: ['action'],
      checked: prefs.level === 'display'
    });
    chrome.contextMenus.create({
      id: 'timeout',
      title: 'Enable For',
      contexts: ['action']
    });
    prefs.timeouts.forEach(({period, title}) => chrome.contextMenus.create({
      id: period + '',
      parentId: 'timeout',
      title,
      contexts: ['action']
    }));
    chrome.contextMenus.create({
      id: 'downloads',
      title: 'Keep Awake while Downloading a File',
      contexts: ['action'],
      type: 'checkbox',
      checked: prefs.downloads
    });
    chrome.contextMenus.create({
      id: 'icons',
      title: 'Icon Colors',
      contexts: ['action']
    });
  });

  chrome.runtime.onStartup.addListener(once);
  chrome.runtime.onInstalled.addListener(once);
}
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'icons') {
    chrome.tabs.create({
      url: chrome.runtime.getManifest().homepage_url + '#faq5',
      index: tab.index + 1
    });
  }
  else if (info.menuItemId.startsWith('level.')) {
    chrome.storage.local.set({
      level: info.menuItemId.replace('level.', '')
    });
  }
  else if (info.menuItemId === 'downloads') {
    if (info.checked) {
      chrome.permissions.request({
        permissions: ['downloads']
      }, granted => {
        chrome.storage.local.set({
          downloads: granted
        });
        if (granted === false) {
          chrome.contextMenus.update('downloads', {
            checked: false
          });
        }
      });
    }
    else {
      chrome.storage.local.set({
        downloads: false
      });
    }
  }
  else {
    chrome.alarms.clearAll(() => {
      chrome.alarms.create('timeout.' + info.menuItemId, {
        when: Date.now() + Number(info.menuItemId) * 60 * 1000
      });
      chrome.storage.local.set({
        enabled: true
      }, () => update('timer.set')); // update is required since the extension might be enabled when timer is set
    });
  }
});
