const args = new URLSearchParams(location.search);
let lock = null;
let level = args.get('level') || 'display';

const preventClose = e => {
  e.preventDefault();
  e.returnValue = '';
};

// Later: release it
window.onbeforeunload = null;

const acquire = async () => {
  try {
    if (!lock) {
      lock = await navigator.wakeLock.request('screen');
      lock.addEventListener('release', () => {
        window.onbeforeunload = null;
        lock = null;
      });
      window.onbeforeunload = preventClose;
    }
  }
  catch (e) {
    console.error(e);
  }
};

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    acquire();
  }
});

acquire();


const beforeunload = () => chrome.runtime.sendMessage({
  cmd: 'unexpected-closed'
}).catch(() => {});
chrome.runtime.onMessage.addListener((request, sender, response) => {
  if (request.cmd === 'exists') {
    level = request.level;
    response(true);
  }
  else if (request.cmd === 'close') {
    removeEventListener('beforeunload', beforeunload);
    window.onbeforeunload = null;
    window.close();
  }
});

addEventListener('beforeunload', beforeunload);
