self.importScripts('context.js');
self.importScripts('downloads.js');

{
  const once = () => chrome.action.setBadgeBackgroundColor({
    color: '#666'
  });
  chrome.runtime.onInstalled.addListener(once);
  chrome.runtime.onStartup.addListener(once);
}

const update = reason => chrome.storage.local.get({
  'enabled': false,
  'level': 'display',
  'badge': ''
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
        '16': '/data/icons/' + b + '/16.png',
        '32': '/data/icons/' + b + '/32.png',
        '48': '/data/icons/' + b + '/48.png'
      }
    });
    chrome.action.setBadgeText({
      text: b === 'disabled' ? p1.badge : ''
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
  if (ps.level || ps.enabled || ps.badge) {
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

// aggressive mode for ChromeOS
if ('reportActivity' in chrome.power) {
  chrome.idle.onStateChanged.addListener(state => {
    if (state === 'active' ) { // make sure timers are working
      const now = Date.now();
      chrome.alarms.getAll(alarms => {
        for (const o of alarms) {
          if (o.scheduledTime < now) {
            console.info('missed timer', o);
            chrome.alarms.create(o.name, {
              when: now + Math.round(Math.random() * 1000)
            });
          }
        }
      });
    }
    else {
      chrome.storage.local.get({
        enabled: false,
        aggressive: true
      }, prefs => {
        if (prefs.enabled && prefs.aggressive) {
          chrome.power.reportActivity(() => {
            console.log('report activity');
          });
        }
      });
    }
  });
}

/* FAQs & Feedback */
{
  const {management, runtime: {onInstalled, setUninstallURL, getManifest}, storage, tabs} = chrome;
  if (navigator.webdriver !== true) {
    const {homepage_url: page, name, version} = getManifest();
    onInstalled.addListener(({reason, previousVersion}) => {
      management.getSelf(({installType}) => installType === 'normal' && storage.local.get({
        'faqs': true,
        'last-update': 0
      }, prefs => {
        if (reason === 'install' || (prefs.faqs && reason === 'update')) {
          const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
          if (doUpdate && previousVersion !== version) {
            tabs.query({active: true, lastFocusedWindow: true}, tbs => tabs.create({
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
