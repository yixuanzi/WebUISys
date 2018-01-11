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
    else if (cmd === 'test') {
      alert("this is a test")
    }
  });
});
