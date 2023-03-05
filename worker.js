self.importScripts('context.js');
self.importScripts('downloads.js');

const update = reason => chrome.storage.local.get({
  'enabled': false,
  'level': 'display'
}, p1 => chrome.storage.session.get({
  'secondary-enabled': false
}, p2 => {
  console.info('updating: ', reason);

  chrome.alarms.getAll(as => {
    let b = p1.enabled ? (as.length ? 'timer' : '') : 'disabled';
    if (p2['secondary-enabled']) {
      b = p1.enabled ? 'downloads/active' : 'downloads/disabled';
    }
    chrome.action.setIcon({
      path: {
        '16': 'data/icons/' + b + '/16.png',
        '32': 'data/icons/' + b + '/32.png',
        '48': 'data/icons/' + b + '/48.png'
      }
    });

    chrome.power.releaseKeepAwake();
    if (p1.enabled || p2['secondary-enabled']) {
      let title = 'Caffeine is Enabled at "[level]" level';
      if (p1.enabled === false) {
        title = title.replace('Enabled', 'only Enabled while Downloading');
      }
      if (as.length) {
        title += ' for [timeout] minutes';
      }

      chrome.power.requestKeepAwake(p1.level);
      chrome.action.setTitle({
        title: title.replace('[level]', p1.level).replace('[timeout]', as[0]?.name.replace('timeout.', ''))
      });
    }
    else {
      chrome.action.setTitle({
        title: `Caffeine is Disabled`
      });
      chrome.alarms.clearAll();
    }
  });
}));

chrome.action.onClicked.addListener(() => chrome.storage.local.get({
  enabled: false
}, prefs => {
  chrome.storage.local.set({
    enabled: prefs.enabled === false
  });
}));

chrome.storage.onChanged.addListener(ps => {
  if (ps.level || ps.enabled) {
    update('prefs.changed');
  }
});
chrome.runtime.onStartup.addListener(() => update('on.startup'));
chrome.runtime.onInstalled.addListener(() => update('on.installed'));

chrome.alarms.onAlarm.addListener(() => {
  chrome.storage.local.set({
    enabled: false
  });
});

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
            tabs.query({active: true, currentWindow: true}, tbs => tabs.create({
              url: page + '?version=' + version + (previousVersion ? '&p=' + previousVersion : '') + '&type=' + reason,
              active: reason === 'install',
              ...(tbs && tbs.length && {index: tbs[0].index + 1})
            }));
            storage.local.set({'last-update': Date.now()});
          }
        }
      }));
    });
    setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
  }
}
