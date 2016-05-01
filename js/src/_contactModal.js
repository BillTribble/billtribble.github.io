/* global ga */

var $ = document.querySelector.bind(document);
var $$ = document.querySelectorAll.bind(document);
var zepto = require('zepto-browserify').Zepto;

// Show and hide contact module
module.exports = (function() {
  zepto(function() {
    var elShowContact = $$('.show-contact-modal');
    var elHideContact = $$('.close-top-module');
    var elContactModal = $('.overlay-module.contact');
    
    function openContactModal() {
      if (elContactModal.classList.contains('close')) {
        elContactModal.classList.remove('close');
      }
      elContactModal.classList.add('open');
      ga('send', 'event', 'Contact', 'opened contact modal', 'Contact Modal');
    };

    function closeContactModal() {
      elContactModal.classList.add('close');
      elContactModal.classList.remove('open');
    };

    for (var n = 0; n < elShowContact.length; n++) {
      elShowContact[n].addEventListener('click', openContactModal);
    }

    for (var i = 0; i < elHideContact.length; i++) {
      elHideContact[i].addEventListener('click', closeContactModal);
    }

  });

}());
