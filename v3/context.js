/* global update */

const schedule = minutes => {
  chrome.alarms.clearAll(() => {
    chrome.alarms.create('timeout.' + minutes, {
      when: Date.now() + Number(minutes) * 60 * 1000
    });
    chrome.storage.local.set({
      enabled: true
    }, () => update('timer.set')); // update is required since the extension might be enabled when timer is set
  });
};

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
    downloads: false,
    aggressive: 'reportActivity' in chrome.power,
    badge: ''
  }, prefs => {
    chrome.contextMenus.create({
      id: 'downloads',
      title: 'Keep Awake while Downloading a File',
      contexts: ['action'],
      type: 'checkbox',
      checked: prefs.downloads
    });
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
      checked: prefs.level === 'display' && prefs.aggressive === false
    });
    chrome.contextMenus.create({
      id: 'level.aggressive',
      title: 'Aggressive Level (ChromeOS)',
      type: 'radio',
      contexts: ['action'],
      checked: prefs.level === 'display' && prefs.aggressive === true,
      enabled: 'reportActivity' in chrome.power
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
      id: 'saddsfsf',
      parentId: 'timeout',
      type: 'separator',
      contexts: ['action']
    });
    chrome.contextMenus.create({
      id: '-1',
      parentId: 'timeout',
      title: 'Custom Period',
      contexts: ['action']
    });
    chrome.contextMenus.create({
      id: 'badge',
      title: 'Badge Disabled Symbol',
      contexts: ['action']
    });
    chrome.contextMenus.create({
      id: 'badge.0',
      title: 'no symbol',
      type: 'radio',
      contexts: ['action'],
      checked: prefs.badge === '',
      parentId: 'badge'
    });
    chrome.contextMenus.create({
      id: 'badge.d',
      title: '"d" symbol',
      type: 'radio',
      contexts: ['action'],
      checked: prefs.badge === 'd',
      parentId: 'badge'
    });
    chrome.contextMenus.create({
      id: 'badge.×',
      title: '"×" symbol',
      type: 'radio',
      contexts: ['action'],
      checked: prefs.badge === '×',
      parentId: 'badge'
    });
    chrome.contextMenus.create({
      id: 'badge.•',
      title: '"•" symbol',
      type: 'radio',
      contexts: ['action'],
      checked: prefs.badge === '•',
      parentId: 'badge'
    });
    chrome.contextMenus.create({
      id: 'icons',
      title: 'Icon Color Codes',
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
    if (info.menuItemId === 'level.aggressive') {
      chrome.storage.local.set({
        level: 'display',
        aggressive: true
      });
    }
    else {
      chrome.storage.local.set({
        level: info.menuItemId.replace('level.', ''),
        aggressive: false
      });
    }
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
  else if (info.menuItemId.startsWith('badge.')) {
    chrome.storage.local.set({
      'badge': info.menuItemId === 'badge.0' ? '' : info.menuItemId.at(-1)
    });
  }
  else {
    if (info.menuItemId === '-1') {
      chrome.offscreen.createDocument({
        url: '/data/offscreen/index.html',
        reasons: ['IFRAME_SCRIPTING'],
        justification: 'Ask custom timer period from user'
      });
    }
    else {
      schedule(info.menuItemId);
    }
  }
});

chrome.runtime.onMessage.addListener((request, sender, response) => {
  if (request.method === 'custom.timeout') {
    if (request.active) {
      schedule(request.minutes);
    }
    else {
      chrome.alarms.clearAll(() => chrome.storage.local.set({
        enabled: false
      }));
    }
    response(true);
  }
});
