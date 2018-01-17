// commands
$(document).ready(function(){
  document.addEventListener('click', ({target}) => {
    const cmd = target.dataset.cmd;
    if (cmd === 'txtonline') {
      chrome.tabs.create({
      url: "wus_txtonline.html",
      active: true
      });
    }
    else if (cmd === 'imagesdown') {
      chrome.tabs.create({
      url: "/modules/save-images/data/inject/index.html",
      active: true
      });
    }
  });
});
