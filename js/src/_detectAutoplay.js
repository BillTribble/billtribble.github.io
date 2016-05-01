var $$ = document.querySelectorAll.bind(document);
var bowser = require('bowser');
var domReady = require('domready')

domReady(function(){

  if(bowser.ios || bowser.android){
    [].forEach.call($$('video'), function(el){
      el.setAttribute('controls', true);
    });
  }

})

