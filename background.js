'use strict';

chrome.browserAction.onClicked.addListener(() => chrome.storage.local.get({
  enabled: false,
  level: 'display'
}, prefs => {
  if (prefs.enabled) {
    prefs.enabled = false;
    chrome.power.releaseKeepAwake();
    chrome.browserAction.setTitle({
      title: `Caffeine is Disabled`
    });
  }
  else {
    prefs.enabled = true;
    chrome.power.requestKeepAwake(prefs.level);
    chrome.browserAction.setTitle({
      title: `Caffeine is Enabled at "${prefs.level}" level`
    });
  }
  chrome.storage.local.set({
    enabled: prefs.enabled
  });
}));

chrome.storage.onChanged.addListener(ps => {
  if (ps.level) {
    chrome.storage.local.get({
      enabled: false
    }, prefs => {
      if (prefs.enabled) {
        chrome.power.releaseKeepAwake();
        chrome.power.requestKeepAwake(ps.level.newValue);
        chrome.browserAction.setTitle({
          title: `Caffeine is Enabled at "${ps.level.newValue}" level`
        });
      }
    });
  }
  if (ps.enabled) {
    const b = ps.enabled.newValue ? '' : 'disabled/';
    chrome.browserAction.setIcon({
      path: {
        '16': 'data/icons/' + b + '16.png',
        '19': 'data/icons/' + b + '19.png',
        '32': 'data/icons/' + b + '32.png',
        '38': 'data/icons/' + b + '38.png',
        '48': 'data/icons/' + b + '48.png',
        '64': 'data/icons/' + b + '64.png'
      }
    });
  }
});

{
  const onStartup = () => chrome.storage.local.get({
    enabled: false,
    level: 'display'
  }, prefs => {
    const b = prefs.enabled ? '' : 'disabled/';
    chrome.browserAction.setIcon({
      path: {
        '16': 'data/icons/' + b + '16.png',
        '19': 'data/icons/' + b + '19.png',
        '32': 'data/icons/' + b + '32.png',
        '38': 'data/icons/' + b + '38.png',
        '48': 'data/icons/' + b + '48.png',
        '64': 'data/icons/' + b + '64.png'
      }
    });
    if (prefs.enabled) {
      chrome.power.requestKeepAwake(prefs.level);
      chrome.browserAction.setTitle({
        title: `Caffeine is Enabled at "${prefs.level}" level`
      });
    }
    else {
      chrome.browserAction.setTitle({
        title: `Caffeine is Disabled`
      });
    }
  });
  chrome.runtime.onStartup.addListener(onStartup);
  chrome.runtime.onInstalled.addListener(onStartup);
}

{
  const onStartup = () => chrome.storage.local.get({
    level: 'display'
  }, prefs => {
    chrome.contextMenus.create({
      id: 'level.system',
      title: 'Level: System',
      type: 'radio',
      contexts: ['browser_action'],
      checked: prefs.level === 'system'
    });
    chrome.contextMenus.create({
      id: 'level.display',
      title: 'Level: Display',
      type: 'radio',
      contexts: ['browser_action'],
      checked: prefs.level === 'display'
    });
  });

  chrome.runtime.onStartup.addListener(onStartup);
  chrome.runtime.onInstalled.addListener(onStartup);
}
chrome.contextMenus.onClicked.addListener(info => chrome.storage.local.set({
  level: info.menuItemId.replace('level.', '')
}));

/* FAQs & Feedback */
{
  const {management, runtime: {onInstalled, setUninstallURL, getManifest}, storage, tabs} = chrome;
  if (navigator.webdriver !== true) {
    const page = getManifest().homepage_url;
    const {name, version} = getManifest();
    onInstalled.addListener(({reason, previousVersion}) => {
      management.getSelf(({installType}) => installType === 'normal' && storage.local.get({
        'faqs': true,
        'last-update': 0
      }, prefs => {
        if (reason === 'install' || (prefs.faqs && reason === 'update')) {
          const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
          if (doUpdate && previousVersion !== version) {
            tabs.create({
              url: page + '?version=' + version + (previousVersion ? '&p=' + previousVersion : '') + '&type=' + reason,
              active: reason === 'install'
            });
            storage.local.set({'last-update': Date.now()});
          }
        }
      }));
    });
    setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
  }
}
