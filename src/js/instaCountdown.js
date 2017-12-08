var instaCountdown = function () { };

//2 last parameters are options
instaCountdown.doCountdown = function (element, errorNumber, prefix, stopTime, vueStatus, color) {

  'use strict';

  return new Promise(function (resolve) {
    doCountdown(element, errorNumber, prefix, stopTime, resolve, vueStatus, color);
  });

  function doCountdown(element, errorNumber, prefix, stopTime, resolve, vueStatus, color) {

    var el = document.getElementById(element);
    if (el) {
      el.style.color = color || 'red';
    }

    var interval = setInterval(function () {
      var time = Math.round((stopTime - (new Date()).getTime()) / 1000);
      var message;
      if (time <= 0) {
        clearInterval(interval);
        message = `${prefix} / Countdown is completed`;
        if (vueStatus) { //spike
          vueStatus.status = message;
        } else {
          el.textContent = message;
        }
        resolve();
      } else {
        var minutes = Math.floor(time / 60);
        if (minutes < 10) {
          minutes = '0' + minutes;
        }
        var seconds = time % 60;
        if (seconds < 10) {
          seconds = '0' + seconds;
        }
        var text = minutes + ':' + seconds;
        message = `${prefix} paused because of HTTP${errorNumber} error. Continue in ${text}.`;
        if (vueStatus) { //spike
          vueStatus.status = message;
        } else {
          el.textContent = message;
        }
      }
    }, 1000);

  }
};
