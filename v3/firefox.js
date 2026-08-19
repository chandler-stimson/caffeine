/* wraps chrome.power with a Proxy
   - When chrome.power is not supported, so requestKeepAwake / releaseKeepAwake
     open and close a small popup window that keeps the system awake using
     the Web Wake Lock API */

if (typeof chrome.power === 'undefined') {
  chrome.runtime.onMessage.addListener((request, sender) => {
    if (request.cmd === 'unexpected-closed') {
      // do we have open session
      console.log('investigating unexpected close');
      chrome.storage.session.get('id').then(prefs => {
        if ('id' in prefs) {
          setTimeout(() => chrome.runtime.sendMessage({
            cmd: 'exists'
          }).catch(e => {
            console.error('power window not found. disabling...');
            chrome.storage.local.set({
              enabled: false
            });
          }), 1000);
        }
      });
    }
  });

  let busy = false;
  chrome.power = {
    async requestKeepAwake(level) {
      if (busy) {
        return;
      }
      busy = true;
      try {
        await chrome.runtime.sendMessage({
          cmd: 'exists',
          level
        });
      }
      catch (e) {
        const win = await chrome.windows.create({
          url: chrome.runtime.getURL('data/wake/index.html?level=' + level),
          type: 'popup',
          width: 400,
          height: 60,
          focused: true
        });
        await chrome.storage.session.set({
          id: win.id
        });
      }
      busy = false;
    },
    async releaseKeepAwake() {
      await chrome.storage.session.remove('id');
      await chrome.runtime.sendMessage({
        cmd: 'close'
      }).catch(() => {});
    }
  };
}

if (typeof chrome.offscreen === 'undefined') {
  chrome.offscreen = {
    createDocument({url}) {
      console.log(url);
      const f = document.createElement('iframe');
      f.src = url;
      document.body.append(f);
      console.log(f);
    }
  };
}
