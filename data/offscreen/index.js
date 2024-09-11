const h = prompt('Enter custom time in hours for Caffeine to be enabled', 5);

const minutes = Number(h) * 60;
chrome.runtime.sendMessage({
  method: 'custom.timeout',
  minutes,
  active: isNaN(h) || !h ? false : (minutes >= 1)
}, () => close());
