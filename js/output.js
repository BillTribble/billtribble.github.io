(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var zepto = require('zepto-browserify').Zepto;

module.exports = (function() {
  zepto(function() {
    if (zepto('.splash.project').length > 0) {
      var elSplashCard = zepto('.splash.project .card');
      var elAfterSplashCard = zepto('.after-card-splash');
      var spacerHeight = elSplashCard.height() / 2;

      elAfterSplashCard.height(spacerHeight);
    }
  });
}());

},{"zepto-browserify":13}],2:[function(require,module,exports){
var raf = require('raf');
var zepto = require('zepto-browserify').Zepto;
var $$ = document.querySelectorAll.bind(document);

var scrollPos = 0;
var windowHeight = window.innerHeight;

window.addEventListener('scroll', function() {
  scrollPos = window.pageYOffset;
});

// animate elements on scroll
module.exports = (function() {

  var animateElementOnScroll = function(element) {
    var elementPos;

    function tick() {
      raf(tick);
      if (scrollPos > elementPos) {
        element.classList.add('animate');
      }
    }

    zepto(function() {
      elementPos = element.getBoundingClientRect().top - windowHeight * 0.75;
      tick();
    });
  };

  var elementsToAnimateOnScroll = $$('.animate-on-scroll');

  for (var i = 0; i < elementsToAnimateOnScroll.length; ++i) {
    animateElementOnScroll(elementsToAnimateOnScroll[i]);
  }
}());

},{"raf":11,"zepto-browserify":13}],3:[function(require,module,exports){
var zepto = require('zepto-browserify').Zepto;
var $ = document.querySelector.bind(document);

module.exports = (function() {
  var elNameField = $('.mail-form [name=name]');
  var elEmailField = $('.mail-form [name=email]');
  var elMessageField = $('.mail-form [name=message]');
  var elContactFormSubmit = $('.mail-form .submit');

  var resetSendButton = function() {
    elContactFormSubmit.classList.remove('success');
    elContactFormSubmit.classList.remove('failure');
    elContactFormSubmit.innerHTML = 'Send';
  };

  var mailerSuccess = function() {
    elNameField.value = '';
    elEmailField.value = '';
    elMessageField.value = '';
    elContactFormSubmit.classList.add('success');
    elContactFormSubmit.innerHTML = 'Message sent!';
    setTimeout(resetSendButton, 3000);
  };

  var mailerFailure = function() {
    elContactFormSubmit.classList.add('failure');
    elContactFormSubmit.innerHTML = 'Please try again';
    setTimeout(resetSendButton, 3000);
  };

  var attemptsCounter = 0;
  var submitAction = function() {
    elContactFormSubmit.innerHTML = 'Sending...';

    var dataObject = {};
    dataObject.name = elNameField.value;
    dataObject.email = elEmailField.value;
    dataObject.message = elMessageField.value;

    zepto.ajax({
      type: 'POST',
      url: '/contact',
      data: JSON.stringify(dataObject),
      contentType: 'application/json',
      success: function() { // data
        mailerSuccess();
      },
      error: function() { // xhr, type
        attemptsCounter += 1;
        if(attemptsCounter < 10) {
          setTimeout(submitAction.bind(this), 1000);
          console.log('Email send error, trying again...');
        } else {
          attemptsCounter = 0;
          mailerFailure();
        } 
      }
    });
  };

  elContactFormSubmit.addEventListener('click', function(event) {
    event.preventDefault();
    submitAction();
  });

}());

},{"zepto-browserify":13}],4:[function(require,module,exports){
var $ = document.querySelector.bind(document);
var $$ = document.querySelectorAll.bind(document);
var zepto = require('zepto-browserify').Zepto;

// Show and hide contact module
module.exports = (function() {
  zepto(function() {
    var elShowContact = $$('.show-contact-modal');
    var elHideContact = $('button.close-top-module');
    var elContactModal = $('.top-module.contact');
    
    function openContactModal() {
      if (elContactModal.classList.contains('close')) {
        elContactModal.classList.remove('close');
      }
      elContactModal.classList.add('open');
    };

    for (var n = 0; n < elShowContact.length; n++) {
      elShowContact[n].addEventListener('click', openContactModal);
    }

    elHideContact.addEventListener('click', function() {
      elContactModal.classList.add('close');
      elContactModal.classList.remove('open');
    });
  });

}());

},{"zepto-browserify":13}],5:[function(require,module,exports){
var zepto = require('zepto-browserify').Zepto;

// Highlight nav items when mouse over
module.exports = (function() {  
  zepto(function() {
    var navItems = ['.work-nav-item', '.clients-nav-item', '.process-nav-item', '.blog-nav-item', '.contact-nav-item'];

    navItems.forEach(function(navItem) {
      zepto(navItem)
        .on('mouseenter', function() {
          this.classList.add('mouse-in');
        })
        .on('mouseleave', function() {
          this.classList.remove('mouse-in');
        });
    });
  });
}());

},{"zepto-browserify":13}],6:[function(require,module,exports){
var zepto = require('zepto-browserify').Zepto;

module.exports = (function() {
  var navHTML = '<div class="nav-mask" aria-hidden="true"><nav class="main"><a href="/"><div class="svg-logo-container"><?xml version="1.0" encoding="utf-8"?><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 527.7 507.7" enable-background="new 0 0 527.7 507.7" xml:space="preserve"><g> <path fill="#FFFFFF" d="M514.5,248.9c-0.3,134.3-108.7,242.9-243.2,242.7C137.2,491.4,28.7,382.9,28.8,248.6 C28.9,114.3,137.5,5.8,271.9,6C406.1,6.1,514.3,114.6,514.5,248.9z M395.3,296.1c-0.6,0.4-1.3,0.7-1.8,1.1c-0.7,0.6-1.3,1.4-2,2 c0.5-1.2,1-2.3,1.7-3.2c1.3-1.8,2.9-3.5,4.1-5.5c0.8-1.3,2-2.4,1.9-4.1c0-0.2,0.3-0.6,0.5-0.7c0.6-0.3,0.9-0.7,0.8-1.4 c0-0.2,0.2-0.5,0.3-0.8c0.3-0.6,0.6-1.2,0.8-1.8c0.1-0.5,0-1,0-1.6c1.9,0.4,2.6-0.1,2.6-1.6c0-0.7-0.2-1.1-1-0.7 c-0.6,0.3-1.2,0.4-1.8,0.6c-0.7-1.4-0.8-2.4,0.3-3.4c0.4-0.3,0.4-1.1,0.6-1.6c0.1-0.2,0.3-0.4,0.5-0.8c0.2,0.5,0.2,0.8,0.4,1.1 c0.1,0.2,0.4,0.4,0.6,0.4c0.2,0,0.5-0.2,0.5-0.4c0.2-0.9,0.5-1.8,0.3-2.7c-0.2-1.5-0.1-2,0.9-2.4c0.5-1.1,0.9-1.8,1.2-2.6 c0.5-1.7,1.3-3.2,2.4-4.6c0.2-0.2-0.2-0.8-0.3-1.3c-0.5,0.2-1.3,0.4-1.3,0.5c0,1.7-1.5,2.5-2.1,3.8c-1.6,3.1-3.5,6-5.2,9 c-0.3,0.5-0.6,1-1,1.3c-0.2,0.2-0.7,0.1-1,0c-0.1,0-0.2-0.6-0.1-0.7c0.6-1.1,1.3-2,1.9-3.1c0.8-1.6,2.7-2.7,2.4-4.9 c0-0.1,0.1-0.2,0.1-0.2c0-0.5,0.1-1.1-0.1-1.4c-0.5-0.7-0.4-1.3,0-2c0.6-1.1,1.3-2.2,1.5-3.4c0.3-1.2,0.2-2.4,1-3.4 c0.1-0.1,0-0.5-0.1-0.6c-0.1-0.1-0.4-0.1-0.6,0c-0.7,0.6-1.5,1.2-2.3,1.8c0.5,2.3,0.4,2.6-1.1,2.9c0.1-0.2,0.2-0.5,0.1-0.6 c-0.1-0.4-0.3-0.8-0.5-1.2c-0.3,0.3-0.6,0.5-0.8,0.9c-1,1.4-1.9,2.9-2.8,4.3c-0.1-0.1-0.3-0.1-0.4-0.2c0.1-0.5,0.2-1,0.4-1.5 c0.7-1.7,1.4-3.5,2.2-5.1c0.6-1.2,1.5-2.2,2-3.4c0.3-0.8,0.6-2.1,0.2-2.7c-0.6-0.9-0.5-1.4,0-2.1c0.4-0.6,0.9-1.1,1.5-1.8 c0.2-0.8,0.4-1.9,0.9-3c0.9-2,2.1-3.9,3.1-5.9c0.3-0.7,0.2-1.6,0.2-2.3c-0.1-0.6-0.5-0.8-0.9-0.3c-1.1,1.3-2.2,2.6-3.3,3.9 c-0.2,0.2-0.4,0.4-0.8,0.7c0-1,0-1.7,0-2.6c-0.6,0.7-1.1,1.3-1.6,1.8c-0.1-0.1-0.3-0.2-0.4-0.2c0.3-0.8,0.7-1.6,0.9-2.4 c0.1-0.3,0.3-0.8,0.2-1.1c-0.4-1.7,0.1-3.2,0.7-4.8c0.3-0.7,0.5-1.7,0.1-2.2c-0.7-1-0.7-1.7,0-2.6c0.3-0.4,0.5-0.9,0.5-1.3 c0-0.5-0.3-1-0.5-1.5c-0.5,0.2-1,0.3-1.4,0.6c-0.4,0.4-0.6,1-1.1,1.4c-1,0.8-1.8,2.2-3.5,1.7c-0.2-0.1-0.6,0.3-0.9,0.6 c-1.1,0.8-2.1,1.7-3.4,2.7c0.1,1.2-1.1,2.3-1.9,3.5c-0.9,1.4-2.1,2.7-3,4.1c-0.9,1.5-1.5,3.1-2.3,4.6c-1.5,2.5-3.1,4.9-4.7,7.3 c-1.7,2.7-3.4,5.3-5.1,8c-2,3.1-4,6.3-6,9.3c-1.5,2.2-3.1,4.3-4.6,6.5c-1.1,1.5-2.1,3.1-3.2,4.5c-0.7,0.9-1.6,1.6-2.4,2.4 c-0.2,0.2-0.5,0.4-0.4,0.6c0.1,1.7-1.2,2.5-2.1,3.6c-0.6,0.8-1.6,1.5-1.4,2.7c0.4,2.8-1.2,4.7-2.8,6.6c-1.1,1.3-2.6,1.1-3.3-0.1 c0.5-1.6,0.9-3,1.4-4.3c0.6-1.5,1.2-2.9,0.8-4.5c-0.1-0.5,0.2-1.1,0.3-1.6c0.1-0.6,0.4-1.2,0.5-1.8c0.4-2,0.8-3.9,1.3-5.9 c0.2-0.7,1-1.3,1.1-2.1c0.4-2,0.5-4,0.7-5.9c0-0.3,0.2-0.7,0.4-1c0.2-0.4,0.6-0.8,0.7-1.3c0.3-1.2,0.4-2.5,0.8-3.6 c0.7-2.2,1.7-4.3,2.3-6.4c0.6-2,1-4.1,1.5-6.2c1.4,0.3,1.9-0.4,2.3-1.3c-0.6-0.1-1.5-0.2-1.5-0.3c-0.1-0.8,0-1.6,0.1-2.4 c0.5,0.1,1.1,0.2,1.7,0.4c0.2-1,0.4-2.1,0.6-3.2c-0.5,0.1-0.7,0.3-0.9,0.5c-0.2,0.2-0.3,0.4-0.5,0.7c-0.7-1.1-0.6-2.5,0.1-3.6 c0.3-0.5,0.6-1.3,0.5-1.8c-0.2-1-0.2-1.7,0.5-2.5c0.2-0.2,0.2-0.5,0.3-0.8c0.3-1.7,0.5-3.5,0.8-5.2c0.1-0.8,0.6-1.3,1.5-0.9 c0.2,0.1,0.5,0.1,0.8,0.2c0.2-1.3,0.4-2.6,0.6-3.9c0.1-0.7,0-1.3,0.2-2c0.5-1.7,1.1-3.3,1.6-5c0.1-0.2,0-0.6-0.2-0.8 c-0.1-0.1-0.5-0.1-0.8,0c-0.2,0.1-0.4,0.2-0.6,0.4c-0.6-1,0-1.4,0.7-1.6c0.9-0.3,0.9-0.8,0.5-1.6c-0.2-0.3-0.3-0.7-0.5-1.1 c0.4-0.1,0.8-0.2,1.5-0.3c0.3-2.2,0.7-4.6,1.1-7.1c-0.5,0.2-0.8,0.3-1.4,0.6c0.2-0.8,0.4-1.3,0.5-1.9c0.4,0.3,0.7,0.5,1.3,1 c0.1-0.7,0.4-1.3,0.2-1.7c-0.4-0.9,0-1.6,0.2-2.4c0.4-1.2,1-2.7,0.6-3.7c-0.6-1.7-0.1-2.8,0.8-3.9c0.8-1,1-2,0.9-3.3 c0-1.6,0.2-3.2,0.4-4.8c0-0.5,0.1-1,0.1-1.5c0-0.3,0-0.7,0.2-1c0.1-0.1,0.6-0.2,0.7-0.1c0.2,0.2,0.3,0.6,0.3,0.9 c0,0.8-0.2,1.7-0.3,2.5c-0.2,1.4-0.2,2.8-0.5,4.1c-0.4,2.1-1.1,4.1-1.4,6.2c-0.2,1.7-0.1,3.4-0.1,5.2c-0.1,2.1,0,4.1-0.2,6.2 c-0.4,2.8-1,5.5-1.5,8.3c-0.1,0.7-0.4,1.5-0.3,2.2c0.1,2.3-0.3,4.4-1.1,6.6c-0.4,1.1-0.3,2.4-0.5,3.5c1.8,0.6,2.4,0.3,3.1-1.2 c0.4-0.9,0.8-1.8,1.3-2.6c1.7-2.7,2-5.7,2.3-8.7c0.2-2.2,0-4.5,0-6.8c1.7,0.1,1.8-1,2-2c0.4-2,0.9-3.9,1.4-5.9 c0.5-2.2,1.2-4.5,1.7-6.7c0.3-1.3,0.1-2.9,0.6-4.1c0.8-1.7,1.1-3.4,1.3-5.2c0.3-2-0.1-3.9,0.5-6c0.9-3.3,1.3-6.8,1.6-10.2 c0.3-3.6,0.7-7.3-0.2-10.9c-0.2-0.8-0.5-1.6-0.7-2.4c-0.3-1.1-0.4-2.4-1-3.3c-0.6-0.8-1.6-1.7-2.6-1.8c-1.4-0.2-2.8,0.5-4.2,0.6 c-0.7,0-1.8-0.1-2.2-0.6c-0.6-0.8-0.9-1.9-1.1-3c-0.2-1.1-1.2-2.4-2.2-2.4c-1,0-2.2,0.6-2.9-0.7c0-0.1-0.8,0.1-1.1,0.3 c-0.2,0.1-0.4,0.5-0.8,1.2c-0.3-0.7-0.5-1.1-0.5-1.5c0.1-2.1-0.1-2.3-2.1-2.2c-0.1-0.3-0.1-0.6-0.2-0.9c-0.6-1.9-2.4-2.8-4.2-2.1 c-0.3,0.1-0.8,0.2-1,0c-0.7-0.6-1.5-1-1.4-2.3c0.1-1.6-0.5-2-2-1.8c-1.9,0.3-2.1,0.1-1.9-1.9c0.1-1.5-0.6-2.9-1.9-3.3 c0.2,1,0.5,1.9,0.4,2.7c-0.1,0.8-0.6,1.6-1.1,2.7c-0.3-0.4-0.7-0.8-0.7-1.1c0-1,0.2-2.1,0.4-3.1c0.2-1.3-0.1-1.6-1.3-1.6 c-0.5,0-1.2-0.3-1.3-0.6c-0.5-1.5-2.1-1.6-3-2.5c-0.9-0.9-2,0.1-2.9,0c-2.1-0.2-4,0.3-5.8,1.4c-1.6,1-3.5,1.7-4.4,3.7 c-0.8-0.5-1.1-0.2-1.2,0.6c0,0.3-0.2,0.8-0.5,1c-1.8,1.4-3.8,2.7-5.4,4.2c-3.2,3.1-6.3,6.3-9.5,9.5c-1.4,1.4-2.7,3-4.1,4.5 c-0.9,0.9-1.9,1.8-2.7,2.7c-1.4,1.5-2.8,3.1-4.3,4.7c-0.5,0.6-1,0.7-1.6,0c-0.9-1.1-1.9-2.2-3-3.3c-1.3-1.3-2.7-1.3-4.4-0.8 c-1.2,0.3-2.5,0.4-3.7,0.3c-0.3,0-0.6-1.1-0.9-1.6c-0.1-0.2-0.4-0.2-0.5-0.4c-0.2-0.3-0.3-0.6-0.4-0.8c-0.2-0.4-0.4-1-0.7-1.2 c-0.9-0.4-2-0.6-2.9-1c-0.4-0.1-0.8-0.3-1-0.5c-0.4-0.5-0.7-1.3-1.2-1.4c-0.5-0.1-1.2,0.3-1.9,0.6c-0.7-0.8-1.6-1.7-2.3-2.7 c-1-1.5-2.6-1.7-4.1-1.8c-1-0.1-1.6-0.4-2-1.1c-0.9-1.6-2.2-2.3-3.9-2.8c-0.5-0.2-1.2-0.5-1.4-1c-1-1.9-2.9-2.7-4.3-4.2 c-0.9-0.9-1.8-1.7-2.8-2.5c-0.9-0.8-1.9-1.5-2.8-2.2c-0.2-0.1-0.5,0.1-0.8,0.1c0.1,0.2,0.1,0.5,0.2,0.7c0.1,0.2,0.2,0.3,0.4,0.4 c-0.2,0.1-0.3,0.2-0.4,0.2c-0.2,0-0.5,0-0.8,0c-2.7-0.3-5.2-0.1-7.4,1.7c-0.2,0.2-0.5,0.2-0.8,0.4c-1.8,0.9-3.3,2.2-4.3,4 c-0.6-0.7-1.1-0.4-1.5,0.4c-0.1,0.3-0.6,0.4-0.8,0.7c-0.7,0.6-1.8,1-2.1,1.7c-0.5,1-1.1,1.7-2,2.3c-1.6,1.2-2.9,3-5,3.6 c-0.8,0.2-1.7,0.8-2.1,1.5c-0.8,1.6-2.2,2.6-3.5,3.8c-1.4,1.3-2.8,2.5-4,3.9c-1,1-1.1,1.1-1.8-0.2c-0.7-1.3-1.4-2.6-2.2-3.8 c-0.5-0.9-1.3-1.1-2.2-0.5c-0.9,0.6-1.8,1.2-2.6,1.8c-1.7-0.4-3.2-2.3-4.9-0.2c-1-1.3-1-1.3-2.3-0.1c-1.8-3.2-4.7-4-8.1-3.7 c-0.7,0.1-1.4,0.2-2,0.1c-0.6-0.1-1.2-0.3-1.8-0.6c-2.1-1.1-4.1-2.5-6.5-1.1c-0.1,0.1-0.2,0-0.4,0c-0.1-0.1-0.2-0.3-0.2-0.4 c-0.2-1-0.9-1.6-1.9-1.5c-1,0.1-1.1,1-1.1,1.9c0,0,0,0.1,0,0.1c-0.3,0.3-0.5,0.6-0.8,0.8c-0.2-0.3-0.6-0.6-0.7-0.9 c-0.1-0.5,0-1,0-1.5c0.2-1.1,0-1.9-1.6-1.5c0.3-2-0.9-3.3-1.9-4.7c-0.6-0.8-1-0.8-1.7,0c-0.1,0.2-0.3,0.4-0.5,0.6 c-0.8-0.7-1.7-1-1.1-2.4c0.3-0.6,0-1.7-0.4-2.2c-0.4-0.5-1.4-0.5-2.2-0.5c-0.2,0-0.4,0.9-0.5,1.5c-0.2,1-0.3,2-0.5,3.1 c-0.1,0.4-0.3,0.8-0.4,1.2c-0.4,2.6-0.9,5.3-1.3,8c-0.5,3.2-0.8,6.4-1.3,9.6c-0.3,1.9,0.2,3.9-0.9,5.7c-0.1,0.2,0.1,0.7,0.1,1 c0,0.5,0.2,1,0,1.4c-0.4,1.6-0.8,3.2-0.9,5c-0.1,3.1-0.7,6.2-1.1,9.3c-0.2,1.2-0.2,2.5-0.3,3.7c0,0.3-0.1,0.6-0.1,0.9 c-0.7,2.5-1.4,4.9-1.3,7.5c0,0.3-0.1,0.6-0.1,0.9c-0.3,1.9-0.6,3.8-0.9,5.7c-0.5,3.6-1,7.1-1.6,10.7c-0.4,2.3-0.8,4.5-1.2,6.8 c-0.4,3-0.8,5.9-1.1,8.9c-0.2,1.9-0.5,3.7-0.8,5.6c-0.4,2.8-1,5.5-1.4,8.3c-0.5,3.6-1,7.2-1.5,10.9c-0.3,2.2-0.5,4.4-0.8,6.6 c-0.4,2.5-1.1,5-1.5,7.5c-0.5,2.7-0.7,5.5-1.1,8.3c-0.2,1.7-0.6,3.3-0.9,4.9c-0.4,1.9-0.8,3.9-1.1,5.8c-0.2,1.5-0.2,3-0.4,4.5 c-0.3,2.8-0.7,5.6-1.1,8.4c-0.1,1-0.5,1.9-0.7,2.9c-0.3,1.9-0.3,3.8-0.6,5.6c-0.4,2.8-1,5.6-1.5,8.4c-0.6,2.9-1.2,5.8-1.8,8.8 c-0.6,3.4-1.1,6.9-1.6,10.4c-0.2,1.4-0.4,2.9-0.6,4.3c-0.3,1.9-0.6,3.7-1.1,5.5c-1.1,3.6-1,7.4-2.1,11.1c-0.4,1.2-0.1,2.8,0.3,4.1 c0.7,2.2,1.7,4.3,4.3,5c1.1,0.3,2,1.3,3.3,0.8c0.1,0,0.3,0.2,0.4,0.3c0.5,0.1,0.9,0.2,1.4,0.3c0.3,0.1,0.7,0,1,0.1 c1.9,1.1,4,1,6,1.1c0.4,0,0.9,0.2,1.3,0.5c0.9,0.6,1.7,1.4,2.9,1.2c0.2,0,0.6,0.1,0.8,0.3c1,1,2.1,1.2,3.4,0.6 c0.3-0.1,0.7-0.4,0.9-0.3c2.2,0.9,4.8,0.8,6.4,2.8c0.2,0.2,0.7,0.2,1,0.1c0.3-0.1,0.6-0.4,0.9-0.5c1.1-0.3,1.3-0.8,0.7-1.8 c-0.7-1.2-0.5-1.7,0.6-2.4c0.2,1.1,0.9,1.3,1.8,1c0.3,0.4,0.4,0.9,0.7,1.1c1,0.6,0.9,1.3,0.6,2.2c-0.4,1.2,0.2,1.7,1.2,1.9 c0.8,0.2,1.6,0.3,2.4,0.4c0.5,0,1-0.3,1.5-0.4c-0.2-0.4-0.4-0.9-0.6-1.3c0.4-1,0.8-2.1,0.7-3.1c-0.2-1.4,0.1-3,1.1-3.8 c0.8-0.6,1.6-1.1,2.4-1.7c-0.1,1.3-0.2,2.6-0.2,4c0,0.6,0.1,1.4,0.4,1.6c0.5,0.4,1.4,0.6,2,0.4c0.5-0.2,0.9-1.1,1-1.7 c0.4-1.8,0.4-3.8,0.9-5.5c1.1-3.7,1.7-7.5,2.3-11.3c0.4-2.6,0.8-5.2,1.3-7.8c0.2-1.2,0.5-2.4,0.7-3.6c0.1-1-0.1-2.1,0.8-3 c0.2-0.1,0.1-0.5,0.1-0.8c0-0.5,0-1,0-1.5c0.4-2.4,0.9-4.7,1.3-7.1c0.2-1,0.2-2,0.4-3c0.4-1.6,0.9-3.2,1.3-4.8c0.5-2,0.9-4,1.1-6.1 c0.3-2.7,0.8-5.5,1.2-8.2c0.3-1.9,0.5-3.9,0.9-5.8c0.4-2.1,1-4.1,1.6-6.1c0.1-0.3,0.3-0.5,0.5-0.7c0.5-0.9,1.2-1.7,1.3-2.6 c0.3-4.1,2.9-7.4,3.6-11.3c0-0.1,0.1-0.2,0.2-0.3c0.5-1.1,0.9-2.2,1.3-3.2c0.3-0.7,0.6-1.5,1-2.2c0.3-0.6,0.8-1.2,0.9-1.8 c0.4-2,1-4,2.1-5.7c0.2-0.3,0.2-0.6,0.3-1c0.2-1.9,1-3.6,2.2-5c0.2-0.3,0.5-0.5,0.6-0.8c0.4-1,0.8-2,1.1-3c0.7-1.7,1.3-3.4,2.4-5 c1.1-1.6,1.5-3.6,2.4-5.4c0.7-1.6,1.5-3.2,2.4-4.8c1-1.9,2.2-3.8,3.3-5.8c0.5-0.8,0.9-1.7,1.4-2.5c0.6-1,1.2-2,1.8-3 c1.7-2.5,2.1-5.9,5.5-7c0.4-0.1,0.7-0.7,1-1.1c0.2-0.2,0.3-0.4,0.5-0.6c0.3,0.5,0.5,0.9,1,1.7c1.4-2.2,2.6-4.1,3.8-6 c0.8-1.4,1.6-2.8,2.5-4.1c0.5-0.7,1.2-1.3,2.1-2.3c0.2,1.2,0.7,2.3,0.4,2.8c-1.4,2.3,0.3,5.1-1.4,7.3c0,0,0,0.1,0,0.1 c-0.2,2-0.3,4.1-0.6,6.1c-0.1,0.8-0.5,1.6-0.6,2.4c-0.5,2.8-0.8,5.6-1.3,8.3c-0.5,2.5-1,5-1.5,7.5c-0.2,0.9-0.6,1.9-0.6,2.8 c-0.1,1.9-0.5,3.7-1.2,5.5c-0.2,0.4-0.1,1-0.2,1.5c-0.4,2.6-0.9,5.2-1.4,7.8c-0.3,1.4-0.7,2.7-1,4c-0.4,1.9-0.8,3.8-1.2,5.7 c-0.5,2.8-1.9,5.4-1.8,8.3c0,0.4-0.1,0.8-0.2,1.1c-0.4,1.2-1,2.4-1.2,3.7c-0.3,2.3-1.7,4.4-1.6,6.8c0,0.3-0.2,0.6-0.3,0.9 c-0.2,0.7-0.4,1.4-0.6,2c-0.5,1.3-0.7,2.6-1,3.9c-0.5,2.7-1.4,5.3-2.1,7.9c-0.3,1.2-0.5,2.5-0.8,3.7c-0.2,0.9-0.6,1.8-0.8,2.7 c-0.4,1.7-0.8,3.4-1.2,5.1c-0.6,2.3-1.2,4.7-1.7,7c-0.2,0.7,0.1,1.5,0,2.2c-0.6,2.4,0.9,4.1,1.7,6c0.1,0.2,0.3,0.3,0.5,0.4 c1.5,0.6,3.1,1.3,4.6,1.9c0.2,0.1,0.4-0.2,0.7-0.2c1.2,0,2.5-0.1,3.6,0.1c1,0.2,1.9,0.7,2.9,1.1c0.1,0.2,0.1,0.7,0.4,1 c0.1,0.1,0.8-0.1,1.1-0.3c1.1-0.9,2.6-0.6,3.2,0.7c0.8,1.7,0.8,1.7,2.3,0.7c0.1-0.1,0.2-0.1,0.5-0.1c0.9,1,1.8,2,2.7,3.1 c0.1-0.3,0.1-0.6,0.2-1c1.8-0.2,2.7-1.2,2.8-3c0-0.8,1.1-1.4,1.3-1c0.4,1.2,2.5,1.7,1.4,3.5c-0.1,0.2,0.4,0.9,0.6,1.3 c0.4-0.2,0.8-0.4,1.2-0.7c0.2-0.2,0.5-0.7,0.4-0.9c-1.1-1.9,0.5-2.3,1.6-3.2c0.9-0.8,1.5-2,2.3-3c0.2-0.2,0.4-0.4,0.8-0.7 c0,0.5,0.1,0.6,0.1,0.8c-0.2,1.1,0.6,1.5,1.4,1.8c1,0.4,1.1-0.4,1.4-1c0.3-0.5,0.5-1,0.9-1.4c0.6-0.6,0.7-1.2,0.6-2.1 c-0.1-0.6,0.2-1.3,0.5-1.8c0.5-0.9,0.9-1.7,0.5-2.8c-0.1-0.5,0-1,0.2-1.5c0.2-0.6,0.6-1.1,0.7-1.7c0.5-2.1,0.9-4.3,1.4-6.4 c0-0.2,0.1-0.3,0.2-0.5c0.4-1.1,0.9-2.3,1.2-3.4c0.6-2,1-4.1,1.6-6.1c0.7-2.3,1.6-4.6,2.3-6.9c0.6-1.9,1.1-3.8,1.7-5.7 c0.8-2.7,1.8-5.3,2.7-8c0.2-0.5,0.3-1,0.5-1.4c0.6-1.5,1.3-3,1.8-4.6c0.6-1.9,1-3.9,1.6-5.9c0.1-0.4,0.5-0.9,0.9-1 c1.1-0.4,1.3-1.2,1.5-2.1c0.5-1.5,1.1-3,1.5-4.5c0.3-1.2,0.4-2.4,0.6-3.6c0-0.1,0-0.2,0.1-0.4c0.3,0.1,0.6,0.1,0.8,0.2 c0.5-1.3,0.9-2.5,1.4-3.7c0.2-0.6,0.3-1.3,0.7-1.7c1.5-1.2,1.6-2.9,2-4.5c0.5-1.8,1.1-3.5,1.7-5.2c0-0.1,0.2-0.2,0.2-0.3 c0.2-0.6,0.5-1.1,0.7-1.7c0.2-0.4,0.3-0.8,0.5-1.3c0.4-1.1,0.9-2.3,1.3-3.4c0.2-0.6,0.4-1.2,0.7-1.7c0.9-1.5,1.8-3,2.7-4.5 c0.4-0.6,0.9-1.2,1.2-1.9c0.5-0.9,0.8-1.8,1.3-2.7c0.2-0.5,0.4-1,0.7-1.4c0.4-0.6,1-1.1,1.4-1.8c0.6-1.2,1.6-2,1.8-3.5 c0.2-1.1,1.2-2.2,1.8-3.2c0.1,0.1,0.2,0.1,0.3,0.2c0.1,0.4,0.1,0.8,0.2,1.3c0.6-0.2,1-0.3,1.5-0.5c0.1,0.1,0.2,0.2,0.3,0.3 c-1.5,2.4-2.9,4.9-3.7,7.7c1.6-0.2,0.7-2.4,2.4-2.8c-0.1,0.6-0.1,0.8-0.1,1.1c0,0.2,0.2,0.6,0.3,0.6c0.3,0,0.6-0.1,0.8-0.2 c0.8-1.2,1.5-2.4,2.2-3.7c0.7-1.2,1.2-2.5,1.9-3.7c1.1-1.9,2.5-3.6,3.6-5.6c0.8-1.5,2.1-2.6,2.8-4.3c0.8-2.1,2.5-3.9,3.9-5.9 c0.7-1,1.3-2,2-3.1c0.6,1,0.3,2-0.2,2.8c-1.8,3.4-3.6,6.9-5.5,10.2c-1,1.8-2.4,3.4-3.4,5.3c-1.4,2.7-2.7,5.5-3.9,8.3 c-0.4,0.9-0.8,2-0.8,3c0,0.7,0.2,1.1-0.7,1.2c-0.2,0-0.5,0.4-0.5,0.6c0,0.2,0.4,0.6,0.5,0.5c0.6-0.2,1.5-0.3,1.8-0.7 c0.6-0.8,0.6-2,1.2-2.6c1.1-1.1,1.4-2.6,2.1-3.8c1.5-2.4,2.9-4.9,4.5-7.3c0.4-0.7,1.1-1.3,1.7-2.1c0.7,2.1-0.5,3.8-0.8,5.5 c-0.2,1.4-0.9,2.6-1.2,4c-0.8,3.9-1.6,7.8-2.4,11.7c-0.6,2.5-1.3,5-1.9,7.6c-0.4,1.8-0.6,3.6-1.2,5.3c-0.5,1.4-1,2.7-1.3,4.2 c-0.6,3.4-1.6,6.7-2.4,10c-0.2,0.9-0.7,1.8-0.8,2.8c-0.1,1.2-0.3,2.2-1.2,3.1c-0.2,0.2-0.2,0.7-0.2,1c0.1,1.5,0,2.9-0.9,4.2 c-0.3,0.4-0.3,0.9-0.4,1.4c-0.1,0.5-0.1,1-0.2,1.5c-0.6,2.3-1.2,4.6-1.7,7c-0.5,2.2-1,4.3-1.5,6.5c-0.4,1.7-0.9,3.5-1.2,5.2 c-0.3,1.5-0.5,3.1-0.9,4.6c-0.7,3-1.5,5.9-2.2,8.9c-0.2,1,0,2.2-0.3,3.1c-1.3,3.6-1.4,7.3-1.9,11c-0.2,1.9-0.4,3.8-0.7,5.6 c-0.1,0.4-0.2,0.9-0.2,1.3c0,1.5,0,3.1,0.1,4.6c0.1,1.9,0.1,3.8,0.5,5.7c0.3,1.6,1,3.1,1.7,4.6c0.5,1,1.3,2.2,2.2,2.7 c1.1,0.6,2.5,0.8,3.8,1c1.3,0.2,2.6,0.1,3.8,0.3c0.5,0.1,1,0.4,1.5,0.6c0.2,0.1,0.4,0.5,0.6,0.6c1.7,0.9,3.5,1.2,5.4,1.5 c1.8,0.4,3.5,1,5.3,1.4c1.3,0.3,2.8,0.7,4,0.4c1.9-0.4,3.4-2.1,5.6-1.3c0.1,0,0.3,0,0.5-0.1c1.5-0.7,3.2-1.1,4.2-2.6 c0.2-0.3,0.7-0.4,1.1-0.5c1.6-0.1,3.2-0.1,4.8-0.9c1.7-0.8,3.3-1.3,4.2-3.1c0.2-0.4,0.9-0.5,1.4-0.6c0.2,0,0.7,0.4,0.7,0.7 c0.4,3.2,2.9,5.7,3.4,8.9c0,0,0.1,0.1,0.2,0.1c0.5-0.7,1-1.3,1.5-2c1.4-2.4,2.9-4.7,4.3-7.1c0.2-0.3,0.2-0.8,0.2-1.2 c-0.4,0.2-0.8,0.3-1.1,0.5c-0.7,0.7-1.3,1.5-1.9,2.2c-0.3-0.9-0.5-1.6-0.7-2.4c0.6-0.4,1.2-0.9,1.9-1.4c0-0.1,0-0.2,0-0.3 c-0.2-1.2-0.7-2.4,0.9-3.1c0.6-0.3,0.4-1-0.1-1.4c-0.2-0.2-0.4-0.6-0.4-0.8c0.2-1.1,0.8-2,1.8-2.3c0.2,0.5,0.4,1,0.6,1.5 c0.1,0.4,0.1,0.8,0.1,1.2c0,0.4,0,0.8-0.1,1.2c0.4-0.3,1.2-0.5,1.2-0.8c0.2-1,0.2-1.9,1.2-2.5c0.2-0.1,0.2-0.9,0-1.2 c-0.6-0.9-0.1-1.3,0.7-1.5c2.2-0.8,3.4-2.2,4-4.5c0.6-2.3,1.6-4.6,2.5-6.9c0.1,0.1,0.2,0.2,0.3,0.3c0.5,0,1,0,1.5,0 c-0.2-0.5-0.4-1-0.6-1.5c-0.1-0.1-0.3-0.1-0.4-0.2c0.6-0.5,1.1-1,1.7-1.4c0.7-0.5,1.6-0.9,2.3-1.6c1.8-1.7,3.6-3.4,5.4-5.2 c0.8-0.8,1.7-1.6,2.4-2.5c0.8-1,1.5-2,2.2-3c0.2-0.3,0.7-0.5,1-0.8c0.1,0.1,0.2,0.2,0.3,0.2c-0.2,0.4-0.2,0.9-0.5,1.3 c-1.5,1.7-3,3.4-4.5,5.2c-0.7,0.8-1.2,1.8-1.8,2.7c0.1,0.1,0.3,0.2,0.4,0.3c0.6-0.7,1.3-1.3,1.7-2.1c0.5-1,1.2-1.5,2.2-2 c0.6-0.3,1-0.9,1.4-1.4c0.5-0.5,0.7-1.3,1.2-1.7c1.1-1,1.9-2.1,2.4-3.5c0.3-0.7,1-1.3,1.5-2c0.6-0.8,1.3-0.9,2.2-0.4 c-0.9-1.1-0.9-1.6,0-2.6C394.4,298.6,395.4,297.6,395.3,296.1c0.4-0.4,1-0.6,1.3-1.1c0.8-1.2,1.5-2.4,2.2-3.7c0.1-0.3,0-0.7,0-1.1 c-0.3,0.2-0.7,0.3-0.8,0.5c-0.9,1.2-1.7,2.5-2.4,3.8C395.3,294.9,395.4,295.5,395.3,296.1z M304.7,234.8c0.1,0.1,0.3,0.2,0.4,0.2 c-0.9,1.9-1.9,3.9-2.7,5.7c-0.5-0.2-0.9-0.5-1.4-0.6c-0.1,0-0.5,0.5-0.5,0.6c0.2,0.4,0.6,0.8,1,1.2c-0.3,0.7-0.7,1.4-1.2,2.3 c-0.8-0.9-1.1-0.5-1.4,0.3c-0.4,1-0.9,1.9-1.2,2.9c-0.2,0.6-0.3,1.3-0.5,2c0.1,0,0.3-0.1,0.4-0.1c0.2,0.3,0.5,0.6,0.7,0.8 c0.2,0.2,0.4,0.4,0.6,0.3c0.2-0.1,0.4-0.3,0.4-0.6c0.1-0.4-0.1-1,0-1.1c1-0.7,0.3-1.2-0.2-1.7c0.8-0.6,1.6-1.1,2.1-1.8 c1.6-2.3,1.9-5.3,4-7.4c0,0,0-0.1,0-0.1c1.1-3.7,3-6.9,5.1-10.1c0.2-0.3,0.1-0.7,0.1-1.1c-0.4,0.1-1,0.1-1.2,0.4 c-0.4,0.5-0.7,1.2-1,1.8c-0.3,0.5-0.4,1.2-1.3,0.6c-0.2-0.1-0.7,0.3-1.1,0.5c0,0.1,0.1,0.2,0.1,0.3c0.3,0.1,0.7,0.1,1.1,0.2 c-0.1,0.4-0.2,0.7-0.4,1.1c-1.1-1.1-1.4-0.6-1.8,0.5c-0.6,1.4-1.4,2.8-2.1,4.1c-0.2,0.4-0.3,0.9-0.4,1.3c0.1,0,0.2,0.1,0.4,0.1 C303.4,236.8,304.1,235.8,304.7,234.8z M379.5,315.5c-0.4,0.2-0.7,0.3-1,0.5c-1.2,0.8-2.4,1.7-3.6,2.6c-0.5,0.4-0.9,1-1.3,1.5 c-0.1,0.1-0.1,0.5,0,0.7c0.1,0.1,0.5,0.2,0.7,0.2c0.3-0.1,0.6-0.3,0.9-0.5c1.3-1,2.6-2.1,4-3.1 C379.7,316.9,379.8,316.4,379.5,315.5z M399.7,288.1c0.1,0.1,0.3,0.2,0.4,0.3c0.5-0.4,1.1-0.6,1.4-1.1c0.7-1.1,1.4-2.3,2-3.4 c0.1-0.2-0.1-0.8-0.2-0.8c-0.3-0.1-0.8,0-1,0.2c-0.5,0.7-1,1.4-1.4,2.1C400.5,286.3,400.1,287.2,399.7,288.1z M396.1,225.1 c1.3,0.2,3.2-1.2,3.4-2.7c0.1-0.5-0.2-1.1-0.3-1.6c-0.5,0.3-1.2,0.5-1.4,1C397.1,222.8,396.6,223.9,396.1,225.1z M407.8,250.6 c-0.3-0.4-0.4-0.8-0.7-1c-0.2-0.1-0.7,0.2-0.8,0.5c-0.5,1.1-1,2.2-1.4,3.3c-0.1,0.2,0.1,0.6,0.3,0.8c0.1,0.1,0.6,0,0.7-0.2 C406.5,253,407.1,251.8,407.8,250.6z M360.5,249.9c-0.2,1.4-0.5,2.6-0.6,3.9c0,0.3,0.3,0.6,0.4,0.9c0.3-0.2,0.8-0.3,0.9-0.6 c0.2-0.7,0.3-1.5,0.5-2.2C361.7,251.2,361.8,250.3,360.5,249.9z M404.1,277.3c0.4-0.3,0.5-0.3,0.6-0.5c0.8-1,1.5-2,2.3-3 c0.1-0.1,0-0.5,0-0.7c-0.3,0-0.6,0-0.8,0.1c-0.8,0.9-1.6,1.9-2.3,2.9C403.7,276.4,403.9,276.8,404.1,277.3z M293.7,256.4 c0.2,0.5,0.3,0.9,0.4,1.1c0,0.1,0.5,0,0.5-0.1c0.5-1.1,1.1-2.2,1.5-3.3c0.1-0.2-0.2-0.5-0.4-0.7c-0.1-0.1-0.5,0.1-0.6,0.2 C294.7,254.5,294.2,255.5,293.7,256.4z M307.1,225c-0.1,0-0.2-0.1-0.3-0.1c-0.3,0.5-0.6,0.9-0.8,1.5c-0.1,0.3,0.1,0.7,0.1,1.1 c0.4-0.2,0.9-0.4,1-0.7C307.2,226.2,307.1,225.6,307.1,225z M363,240c1-1,1-2.4,0-3.4C363,237.8,363,238.8,363,240z M176.1,370.2 c-0.1,0-0.3-0.1-0.4-0.1c-0.3,0.5-0.6,1-0.8,1.6c-0.1,0.3,0.4,0.6,0.6,0.9c0.2-0.2,0.6-0.4,0.7-0.7 C176.3,371.4,176.2,370.8,176.1,370.2z M311.7,233.2c-0.1,0-0.2,0-0.2-0.1c-0.4,0.4-0.8,0.8-1.1,1.3c-0.1,0.2,0.1,0.5,0.2,0.8 c0.2-0.1,0.6-0.2,0.7-0.3C311.5,234.3,311.6,233.8,311.7,233.2z M404.4,262.9c-0.5-0.3-0.8-0.7-0.9-0.6c-0.3,0.1-0.6,0.4-0.8,0.6 c0.2,0.2,0.4,0.6,0.6,0.6C403.6,263.5,403.9,263.2,404.4,262.9z M357.6,263.8c0.1,0.1,0.2,0.2,0.4,0.3c0.3-0.3,0.7-0.6,0.8-0.9 c0.1-0.2-0.3-0.6-0.4-0.9c-0.1,0-0.2,0-0.4,0.1C357.9,262.9,357.7,263.3,357.6,263.8z"/> <path fill="#FFFFFF" d="M383.7,305.5c0.1-0.3,0.1-0.6,0.2-0.8c0.5-0.7,1.1-1.2,1.5-2c0.4-0.7,0.4-1.5,0.8-2.1 c0.3-0.7,0.7-1.4,1.3-1.8c1.2-0.9,1.7-2,2-3.4c0.1-0.4,0.3-0.8,0.5-1.5c0.2,0.8,0.4,1.2,0.5,1.8c0.4-0.2,0.8-0.4,1.1-0.5 c0.1,0.1,0.1,0.1,0.2,0.2c-2.5,3.5-5.1,7-7.6,10.4C384.1,305.7,383.9,305.6,383.7,305.5z"/> <path fill="#FFFFFF" d="M398.6,279.9c0.6,0.2,1.1,0.3,1.9,0.5c-0.6,1.1-1.3,2.2-1.8,3.2c-0.5,1.1-0.9,2.2-1.4,3.4 c-0.7-0.2-1.3-0.4-2-0.6C396.4,284.3,397.4,282.1,398.6,279.9z"/> <path fill="#FFFFFF" d="M284.6,263c0,0.6,0.1,1.1,0,1.7c0,0.5-0.2,0.9-0.3,1.3c-0.2,1.6-0.4,3.1-0.7,4.7c-0.1,0.3-0.5,0.6-0.8,0.7 c-0.2,0-0.6-0.4-0.7-0.7c-0.1-0.4-0.2-1.1,0.1-1.3c0.9-0.8,0.2-2.1,1.3-3c0.5-0.4,0.3-1.7,0.4-2.6c0-0.3,0.1-0.5,0.2-0.8 C284.3,263,284.4,263,284.6,263z"/> <path fill="#FFFFFF" d="M275.9,289.5c-0.6-1.4-0.1-2.6,0.2-3.8c0.3-1.2,0.8-2.5,1.3-3.6c0.1-0.3,0.5-0.5,0.8-0.8 c0.2,0.3,0.4,0.6,0.4,0.9c0,0.7-0.1,1.5-0.4,2.1C277.6,286,276.8,287.7,275.9,289.5z"/> <path fill="#FFFFFF" d="M374.6,181c0.6-1.3-1-2.3-0.1-3.6c0.1-0.2,0-0.7-0.1-1c-0.6-1.6-0.1-2.6,1.5-3.4c0,0.1,0.1,0.2,0.1,0.2 c-0.8,0.8-0.9,1.5-0.4,2.6c0.3,0.7,0,1.7-0.1,2.6c-0.1,0.9-0.4,1.7-0.6,2.5C374.9,181,374.7,181,374.6,181z"/> <path fill="#FFFFFF" d="M320.3,207.8c1-3.3,3.6-5.6,5.5-8.5C326,200.2,322.3,206.1,320.3,207.8z"/> <path fill="#FFFFFF" d="M310.5,223.3c1.4-2.4,2.7-4.9,4.1-7.3c0.1-0.2,0.5-0.1,1.2-0.3c-1.7,2.8-3.2,5.4-4.7,7.9 C310.9,223.5,310.7,223.4,310.5,223.3z"/> <path fill="#FFFFFF" d="M394.6,281.1c0.3-2.3,1.5-4.1,2.9-6.1c0.7,1.3,0.6,2.1-0.2,2.9c-0.8,0.8-1.8,1.5-1.9,2.8 c0,0.2-0.3,0.4-0.5,0.5C394.8,281.2,394.7,281.2,394.6,281.1z"/> <path fill="#FFFFFF" d="M274,296c-0.7-1.9,0.1-3.4,0.4-4.8c0-0.2,0.5-0.4,0.8-0.4c0.1,0,0.4,0.4,0.4,0.7c0,0.3,0,0.7-0.1,1 C275,293.6,274.5,294.6,274,296z"/> <path fill="#FFFFFF" d="M280.2,275c-0.1,1.4-0.1,2.8-0.3,4.3c-0.1,1-0.8,1-1.6,0.6c0.5-1.7,1.1-3.3,1.6-4.9 C280,274.9,280.1,275,280.2,275z"/> <path fill="#FFFFFF" d="M315.7,215c0.9-1.4-0.8-3,0.6-4.3c0.4,0.8,1,1.5,1,2.2c0,0.8-0.6,1.5-0.9,2.3 C316.2,215.1,316,215,315.7,215z"/> <path fill="#FFFFFF" d="M353.3,255.3c-0.1,0.8-0.1,1.6-0.2,2.4c0,0.2-0.4,0.6-0.6,0.6c-0.2,0-0.6-0.3-0.7-0.6 c-0.4-1.2,0.5-1.8,1.2-2.6C353,255.2,353.1,255.3,353.3,255.3z"/> <path fill="#FFFFFF" d="M212.2,256.5c-0.6-1.3,0.3-2.3,0.7-3.4C213.4,254.6,213.2,255.6,212.2,256.5z"/> <path fill="#FFFFFF" d="M350.9,274.6c0.1-0.9,0.2-1.7,0.3-2.6C352.6,273.1,352.5,273.9,350.9,274.6z"/> <path fill="#FFFFFF" d="M289.4,249.4c-0.4,1.2-0.9,2.5-1.3,3.7c-0.1,0-0.2-0.1-0.3-0.1c0.3-1.3,0.7-2.6,1-3.8 C289,249.3,289.2,249.3,289.4,249.4z"/> <path fill="#FFFFFF" d="M315.1,213.4c-0.7,0.9-1.3,1.8-2,2.7c-0.1-0.1-0.2-0.2-0.3-0.2c0.6-0.9,1.2-1.9,1.8-2.8 C314.8,213.2,315,213.3,315.1,213.4z"/> <path fill="#FFFFFF" d="M319.8,209.5c-0.6,0.8-1.3,1.5-1.9,2.3c-0.1-0.1-0.3-0.2-0.4-0.3c0.6-0.8,1.2-1.5,1.9-2.3 C319.6,209.3,319.7,209.4,319.8,209.5z"/> <path fill="#FFFFFF" d="M210.7,263.4c-0.3,0.7-0.5,1.3-0.8,2c-0.2-0.1-0.4-0.1-0.6-0.2c0.3-0.7,0.5-1.3,0.8-2 C210.4,263.3,210.5,263.3,210.7,263.4z"/> <path fill="#FFFFFF" d="M328.5,196.6c-0.5,0.7-0.8,1.2-1.2,1.9C326.8,197,327,196.7,328.5,196.6z"/> <path fill="#FFFFFF" d="M391.2,292.3c0.6-0.4,1.1-0.8,1.9-1.3C392.2,293,392.2,293,391.2,292.3z"/> <path fill="#FFFFFF" d="M287.4,255.7c-0.1,0.5-0.2,1-0.3,1.5c0,0-0.5-0.1-0.5-0.1c0.1-0.5,0.1-1,0.2-1.6 C287,255.6,287.2,255.6,287.4,255.7z"/> <path fill="#FFFFFF" d="M366.4,220.1c0.1-0.7,0.1-1.3,0.3-1.8c0.1-0.2,0.4-0.3,0.6-0.5c0.1,0.3,0.3,0.6,0.2,0.8 C367.2,219.1,366.9,219.5,366.4,220.1z"/> <path fill="#FFFFFF" d="M382.9,307.2c-0.4,0.8-0.8,1.6-1.3,2.4c-0.1-0.1-0.3-0.1-0.4-0.2c0.4-0.8,0.9-1.6,1.3-2.3 C382.7,307,382.8,307.1,382.9,307.2z"/> <path fill="#FFFFFF" d="M282.4,148.6c0.3,0.4,0.5,0.6,0.7,0.8c-0.2,0.2-0.5,0.6-0.7,0.5c-0.2,0-0.5-0.4-0.6-0.6 C281.9,149.1,282.2,148.9,282.4,148.6z"/> <path fill="#FFFFFF" d="M398.2,269.5c0.5-0.6,0.9-1.3,1.4-1.9c0.1,0.1,0.2,0.1,0.3,0.2c-0.4,0.7-0.8,1.4-1.1,2 C398.5,269.7,398.3,269.6,398.2,269.5z"/></g></svg></div></a> <ul class="nav-items"><a href="/#work"> <li class="work-nav-item">Our Work</li></a><a href="/#clients"> <li class="clients-nav-item">Our Clients</li></a><a href="/#process"> <li class="process-nav-item">What we do</li></a><a href="/blog"> <li class="blog-nav-item">Our Writing</li></a> <li class="show-contact-modal contact-nav-item">Get in Touch</li></ul><button class="mobile-nav-burger"><?xml version="1.0" encoding="utf-8"?><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="-281 404.9 32 32" style="enable-background:new -281 404.9 32 32;" xml:space="preserve"><style type="text/css">.st0{fill:#FFFFFF;}</style><path class="st0" d="M-273.8,416.5h17.6c0.8,0,1.5-0.7,1.5-1.5s-0.7-1.5-1.5-1.5h-17.6c-0.8,0-1.5,0.7-1.5,1.5S-274.6,416.5-273.8,416.5z M-256.2,419.4h-17.6c-0.8,0-1.5,0.7-1.5,1.5c0,0.8,0.7,1.5,1.5,1.5h17.6c0.8,0,1.5-0.7,1.5-1.5C-254.7,420.1-255.4,419.4-256.2,419.4z M-256.2,425.3h-17.6c-0.8,0-1.5,0.7-1.5,1.5s0.7,1.5,1.5,1.5h17.6c0.8,0,1.5-0.7,1.5-1.5S-255.4,425.3-256.2,425.3z M-249,420.9c0,8.8-7.2,16-16,16s-16-7.2-16-16s7.2-16,16-16S-249,412.1-249,420.9z"/></svg> </button></nav></div>';

  zepto(function() {
    zepto('.splash, section').prepend(navHTML);
  });

}());

},{"zepto-browserify":13}],7:[function(require,module,exports){
var raf = require('raf');
var zepto = require('zepto-browserify').Zepto;
var $$ = document.querySelectorAll.bind(document);

var scrollPos = 0;
var windowHeight = window.innerHeight;

var triggeredElements = [];

window.addEventListener('scroll', function() {
  scrollPos = window.pageYOffset;
});

// play video on scroll
(function() {
  var playVideoOnScroll = function(element) {
    var elementPos;

    function tick() {
      raf(tick);

      if (scrollPos > elementPos && zepto.inArray(element, triggeredElements) < 0) {
        triggeredElements.push(element);
        element.play();
      }
    }
    
    zepto(function() {
      elementPos = element.getBoundingClientRect().top - windowHeight * 0.75;
      tick();
    });
  };
  
  var videoToPlayOnScroll = $$('video.play-on-scroll');

  for (var i = 0; i < videoToPlayOnScroll.length; ++i) {
    playVideoOnScroll(videoToPlayOnScroll[i]);
  }

}());

},{"raf":11,"zepto-browserify":13}],8:[function(require,module,exports){
var zepto = require('zepto-browserify').Zepto;

// Show and hide mobile nav
module.exports = (function() {
  zepto(function() {
    var elToggleNav = zepto('.mobile-nav-burger');
    console.log(elToggleNav);
    var elNavItems = zepto('ul.nav-items');
    
    function toggleMobileNav() {
      elNavItems.toggleClass('shown');
    };

    elToggleNav.on('click', toggleMobileNav);
  });

}());

},{"zepto-browserify":13}],9:[function(require,module,exports){
window.zepto = require('zepto-browserify').Zepto;

require('./_navInjection.js');
require('./_navHighlighting.js');
require('./_toggleMobileNav.js');
require('./_contactModal.js');
require('./_contactForm.js');
require('./_animateOnScroll.js');
require('./_playOnScroll.js');
require('./_afterCardSplash.js');
},{"./_afterCardSplash.js":1,"./_animateOnScroll.js":2,"./_contactForm.js":3,"./_contactModal.js":4,"./_navHighlighting.js":5,"./_navInjection.js":6,"./_playOnScroll.js":7,"./_toggleMobileNav.js":8,"zepto-browserify":13}],10:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            currentQueue[queueIndex].run();
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],11:[function(require,module,exports){
var now = require('performance-now')
  , global = typeof window === 'undefined' ? {} : window
  , vendors = ['moz', 'webkit']
  , suffix = 'AnimationFrame'
  , raf = global['request' + suffix]
  , caf = global['cancel' + suffix] || global['cancelRequest' + suffix]

for(var i = 0; i < vendors.length && !raf; i++) {
  raf = global[vendors[i] + 'Request' + suffix]
  caf = global[vendors[i] + 'Cancel' + suffix]
      || global[vendors[i] + 'CancelRequest' + suffix]
}

// Some versions of FF have rAF but not cAF
if(!raf || !caf) {
  var last = 0
    , id = 0
    , queue = []
    , frameDuration = 1000 / 60

  raf = function(callback) {
    if(queue.length === 0) {
      var _now = now()
        , next = Math.max(0, frameDuration - (_now - last))
      last = next + _now
      setTimeout(function() {
        var cp = queue.slice(0)
        // Clear queue here to prevent
        // callbacks from appending listeners
        // to the current frame's queue
        queue.length = 0
        for(var i = 0; i < cp.length; i++) {
          if(!cp[i].cancelled) {
            try{
              cp[i].callback(last)
            } catch(e) {
              setTimeout(function() { throw e }, 0)
            }
          }
        }
      }, Math.round(next))
    }
    queue.push({
      handle: ++id,
      callback: callback,
      cancelled: false
    })
    return id
  }

  caf = function(handle) {
    for(var i = 0; i < queue.length; i++) {
      if(queue[i].handle === handle) {
        queue[i].cancelled = true
      }
    }
  }
}

module.exports = function(fn) {
  // Wrap in a new function to prevent
  // `cancel` potentially being assigned
  // to the native rAF function
  return raf.call(global, fn)
}
module.exports.cancel = function() {
  caf.apply(global, arguments)
}

},{"performance-now":12}],12:[function(require,module,exports){
(function (process){
// Generated by CoffeeScript 1.7.1
(function() {
  var getNanoSeconds, hrtime, loadTime;

  if ((typeof performance !== "undefined" && performance !== null) && performance.now) {
    module.exports = function() {
      return performance.now();
    };
  } else if ((typeof process !== "undefined" && process !== null) && process.hrtime) {
    module.exports = function() {
      return (getNanoSeconds() - loadTime) / 1e6;
    };
    hrtime = process.hrtime;
    getNanoSeconds = function() {
      var hr;
      hr = hrtime();
      return hr[0] * 1e9 + hr[1];
    };
    loadTime = getNanoSeconds();
  } else if (Date.now) {
    module.exports = function() {
      return Date.now() - loadTime;
    };
    loadTime = Date.now();
  } else {
    module.exports = function() {
      return new Date().getTime() - loadTime;
    };
    loadTime = new Date().getTime();
  }

}).call(this);

}).call(this,require('_process'))

},{"_process":10}],13:[function(require,module,exports){
/* Zepto v1.0 - polyfill zepto detect event ajax form fx - zeptojs.com/license */

;(function(undefined){
  if (String.prototype.trim === undefined) // fix for iOS 3.2
    String.prototype.trim = function(){ return this.replace(/^\s+|\s+$/g, '') }

  // For iOS 3.x
  // from https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/reduce
  if (Array.prototype.reduce === undefined)
    Array.prototype.reduce = function(fun){
      if(this === void 0 || this === null) throw new TypeError()
      var t = Object(this), len = t.length >>> 0, k = 0, accumulator
      if(typeof fun != 'function') throw new TypeError()
      if(len == 0 && arguments.length == 1) throw new TypeError()

      if(arguments.length >= 2)
       accumulator = arguments[1]
      else
        do{
          if(k in t){
            accumulator = t[k++]
            break
          }
          if(++k >= len) throw new TypeError()
        } while (true)

      while (k < len){
        if(k in t) accumulator = fun.call(undefined, accumulator, t[k], k, t)
        k++
      }
      return accumulator
    }

})()





var Zepto = (function() {
  var undefined, key, $, classList, emptyArray = [], slice = emptyArray.slice, filter = emptyArray.filter,
    document = window.document,
    elementDisplay = {}, classCache = {},
    getComputedStyle = document.defaultView.getComputedStyle,
    cssNumber = { 'column-count': 1, 'columns': 1, 'font-weight': 1, 'line-height': 1,'opacity': 1, 'z-index': 1, 'zoom': 1 },
    fragmentRE = /^\s*<(\w+|!)[^>]*>/,
    tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
    rootNodeRE = /^(?:body|html)$/i,

    // special attributes that should be get/set via method calls
    methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],

    adjacencyOperators = [ 'after', 'prepend', 'before', 'append' ],
    table = document.createElement('table'),
    tableRow = document.createElement('tr'),
    containers = {
      'tr': document.createElement('tbody'),
      'tbody': table, 'thead': table, 'tfoot': table,
      'td': tableRow, 'th': tableRow,
      '*': document.createElement('div')
    },
    readyRE = /complete|loaded|interactive/,
    classSelectorRE = /^\.([\w-]+)$/,
    idSelectorRE = /^#([\w-]*)$/,
    tagSelectorRE = /^[\w-]+$/,
    class2type = {},
    toString = class2type.toString,
    zepto = {},
    camelize, uniq,
    tempParent = document.createElement('div')

  zepto.matches = function(element, selector) {
    if (!element || element.nodeType !== 1) return false
    var matchesSelector = element.webkitMatchesSelector || element.mozMatchesSelector ||
                          element.oMatchesSelector || element.matchesSelector
    if (matchesSelector) return matchesSelector.call(element, selector)
    // fall back to performing a selector:
    var match, parent = element.parentNode, temp = !parent
    if (temp) (parent = tempParent).appendChild(element)
    match = ~zepto.qsa(parent, selector).indexOf(element)
    temp && tempParent.removeChild(element)
    return match
  }

  function type(obj) {
    return obj == null ? String(obj) :
      class2type[toString.call(obj)] || "object"
  }

  function isFunction(value) { return type(value) == "function" }
  function isWindow(obj)     { return obj != null && obj == obj.window }
  function isDocument(obj)   { return obj != null && obj.nodeType == obj.DOCUMENT_NODE }
  function isObject(obj)     { return type(obj) == "object" }
  function isPlainObject(obj) {
    return isObject(obj) && !isWindow(obj) && obj.__proto__ == Object.prototype
  }
  function isArray(value) { return value instanceof Array }
  function likeArray(obj) { return typeof obj.length == 'number' }

  function compact(array) { return filter.call(array, function(item){ return item != null }) }
  function flatten(array) { return array.length > 0 ? $.fn.concat.apply([], array) : array }
  camelize = function(str){ return str.replace(/-+(.)?/g, function(match, chr){ return chr ? chr.toUpperCase() : '' }) }
  function dasherize(str) {
    return str.replace(/::/g, '/')
           .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
           .replace(/([a-z\d])([A-Z])/g, '$1_$2')
           .replace(/_/g, '-')
           .toLowerCase()
  }
  uniq = function(array){ return filter.call(array, function(item, idx){ return array.indexOf(item) == idx }) }

  function classRE(name) {
    return name in classCache ?
      classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'))
  }

  function maybeAddPx(name, value) {
    return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value
  }

  function defaultDisplay(nodeName) {
    var element, display
    if (!elementDisplay[nodeName]) {
      element = document.createElement(nodeName)
      document.body.appendChild(element)
      display = getComputedStyle(element, '').getPropertyValue("display")
      element.parentNode.removeChild(element)
      display == "none" && (display = "block")
      elementDisplay[nodeName] = display
    }
    return elementDisplay[nodeName]
  }

  function children(element) {
    return 'children' in element ?
      slice.call(element.children) :
      $.map(element.childNodes, function(node){ if (node.nodeType == 1) return node })
  }

  // `$.zepto.fragment` takes a html string and an optional tag name
  // to generate DOM nodes nodes from the given html string.
  // The generated DOM nodes are returned as an array.
  // This function can be overriden in plugins for example to make
  // it compatible with browsers that don't support the DOM fully.
  zepto.fragment = function(html, name, properties) {
    if (html.replace) html = html.replace(tagExpanderRE, "<$1></$2>")
    if (name === undefined) name = fragmentRE.test(html) && RegExp.$1
    if (!(name in containers)) name = '*'

    var nodes, dom, container = containers[name]
    container.innerHTML = '' + html
    dom = $.each(slice.call(container.childNodes), function(){
      container.removeChild(this)
    })
    if (isPlainObject(properties)) {
      nodes = $(dom)
      $.each(properties, function(key, value) {
        if (methodAttributes.indexOf(key) > -1) nodes[key](value)
        else nodes.attr(key, value)
      })
    }
    return dom
  }

  // `$.zepto.Z` swaps out the prototype of the given `dom` array
  // of nodes with `$.fn` and thus supplying all the Zepto functions
  // to the array. Note that `__proto__` is not supported on Internet
  // Explorer. This method can be overriden in plugins.
  zepto.Z = function(dom, selector) {
    dom = dom || []
    dom.__proto__ = $.fn
    dom.selector = selector || ''
    return dom
  }

  // `$.zepto.isZ` should return `true` if the given object is a Zepto
  // collection. This method can be overriden in plugins.
  zepto.isZ = function(object) {
    return object instanceof zepto.Z
  }

  // `$.zepto.init` is Zepto's counterpart to jQuery's `$.fn.init` and
  // takes a CSS selector and an optional context (and handles various
  // special cases).
  // This method can be overriden in plugins.
  zepto.init = function(selector, context) {
    // If nothing given, return an empty Zepto collection
    if (!selector) return zepto.Z()
    // If a function is given, call it when the DOM is ready
    else if (isFunction(selector)) return $(document).ready(selector)
    // If a Zepto collection is given, juts return it
    else if (zepto.isZ(selector)) return selector
    else {
      var dom
      // normalize array if an array of nodes is given
      if (isArray(selector)) dom = compact(selector)
      // Wrap DOM nodes. If a plain object is given, duplicate it.
      else if (isObject(selector))
        dom = [isPlainObject(selector) ? $.extend({}, selector) : selector], selector = null
      // If it's a html fragment, create nodes from it
      else if (fragmentRE.test(selector))
        dom = zepto.fragment(selector.trim(), RegExp.$1, context), selector = null
      // If there's a context, create a collection on that context first, and select
      // nodes from there
      else if (context !== undefined) return $(context).find(selector)
      // And last but no least, if it's a CSS selector, use it to select nodes.
      else dom = zepto.qsa(document, selector)
      // create a new Zepto collection from the nodes found
      return zepto.Z(dom, selector)
    }
  }

  // `$` will be the base `Zepto` object. When calling this
  // function just call `$.zepto.init, which makes the implementation
  // details of selecting nodes and creating Zepto collections
  // patchable in plugins.
  $ = function(selector, context){
    return zepto.init(selector, context)
  }

  function extend(target, source, deep) {
    for (key in source)
      if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
        if (isPlainObject(source[key]) && !isPlainObject(target[key]))
          target[key] = {}
        if (isArray(source[key]) && !isArray(target[key]))
          target[key] = []
        extend(target[key], source[key], deep)
      }
      else if (source[key] !== undefined) target[key] = source[key]
  }

  // Copy all but undefined properties from one or more
  // objects to the `target` object.
  $.extend = function(target){
    var deep, args = slice.call(arguments, 1)
    if (typeof target == 'boolean') {
      deep = target
      target = args.shift()
    }
    args.forEach(function(arg){ extend(target, arg, deep) })
    return target
  }

  // `$.zepto.qsa` is Zepto's CSS selector implementation which
  // uses `document.querySelectorAll` and optimizes for some special cases, like `#id`.
  // This method can be overriden in plugins.
  zepto.qsa = function(element, selector){
    var found
    return (isDocument(element) && idSelectorRE.test(selector)) ?
      ( (found = element.getElementById(RegExp.$1)) ? [found] : [] ) :
      (element.nodeType !== 1 && element.nodeType !== 9) ? [] :
      slice.call(
        classSelectorRE.test(selector) ? element.getElementsByClassName(RegExp.$1) :
        tagSelectorRE.test(selector) ? element.getElementsByTagName(selector) :
        element.querySelectorAll(selector)
      )
  }

  function filtered(nodes, selector) {
    return selector === undefined ? $(nodes) : $(nodes).filter(selector)
  }

  $.contains = function(parent, node) {
    return parent !== node && parent.contains(node)
  }

  function funcArg(context, arg, idx, payload) {
    return isFunction(arg) ? arg.call(context, idx, payload) : arg
  }

  function setAttribute(node, name, value) {
    value == null ? node.removeAttribute(name) : node.setAttribute(name, value)
  }

  // access className property while respecting SVGAnimatedString
  function className(node, value){
    var klass = node.className,
        svg   = klass && klass.baseVal !== undefined

    if (value === undefined) return svg ? klass.baseVal : klass
    svg ? (klass.baseVal = value) : (node.className = value)
  }

  // "true"  => true
  // "false" => false
  // "null"  => null
  // "42"    => 42
  // "42.5"  => 42.5
  // JSON    => parse if valid
  // String  => self
  function deserializeValue(value) {
    var num
    try {
      return value ?
        value == "true" ||
        ( value == "false" ? false :
          value == "null" ? null :
          !isNaN(num = Number(value)) ? num :
          /^[\[\{]/.test(value) ? $.parseJSON(value) :
          value )
        : value
    } catch(e) {
      return value
    }
  }

  $.type = type
  $.isFunction = isFunction
  $.isWindow = isWindow
  $.isArray = isArray
  $.isPlainObject = isPlainObject

  $.isEmptyObject = function(obj) {
    var name
    for (name in obj) return false
    return true
  }

  $.inArray = function(elem, array, i){
    return emptyArray.indexOf.call(array, elem, i)
  }

  $.camelCase = camelize
  $.trim = function(str) { return str.trim() }

  // plugin compatibility
  $.uuid = 0
  $.support = { }
  $.expr = { }

  $.map = function(elements, callback){
    var value, values = [], i, key
    if (likeArray(elements))
      for (i = 0; i < elements.length; i++) {
        value = callback(elements[i], i)
        if (value != null) values.push(value)
      }
    else
      for (key in elements) {
        value = callback(elements[key], key)
        if (value != null) values.push(value)
      }
    return flatten(values)
  }

  $.each = function(elements, callback){
    var i, key
    if (likeArray(elements)) {
      for (i = 0; i < elements.length; i++)
        if (callback.call(elements[i], i, elements[i]) === false) return elements
    } else {
      for (key in elements)
        if (callback.call(elements[key], key, elements[key]) === false) return elements
    }

    return elements
  }

  $.grep = function(elements, callback){
    return filter.call(elements, callback)
  }

  if (window.JSON) $.parseJSON = JSON.parse

  // Populate the class2type map
  $.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
    class2type[ "[object " + name + "]" ] = name.toLowerCase()
  })

  // Define methods that will be available on all
  // Zepto collections
  $.fn = {
    // Because a collection acts like an array
    // copy over these useful array functions.
    forEach: emptyArray.forEach,
    reduce: emptyArray.reduce,
    push: emptyArray.push,
    sort: emptyArray.sort,
    indexOf: emptyArray.indexOf,
    concat: emptyArray.concat,

    // `map` and `slice` in the jQuery API work differently
    // from their array counterparts
    map: function(fn){
      return $($.map(this, function(el, i){ return fn.call(el, i, el) }))
    },
    slice: function(){
      return $(slice.apply(this, arguments))
    },

    ready: function(callback){
      if (readyRE.test(document.readyState)) callback($)
      else document.addEventListener('DOMContentLoaded', function(){ callback($) }, false)
      return this
    },
    get: function(idx){
      return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length]
    },
    toArray: function(){ return this.get() },
    size: function(){
      return this.length
    },
    remove: function(){
      return this.each(function(){
        if (this.parentNode != null)
          this.parentNode.removeChild(this)
      })
    },
    each: function(callback){
      emptyArray.every.call(this, function(el, idx){
        return callback.call(el, idx, el) !== false
      })
      return this
    },
    filter: function(selector){
      if (isFunction(selector)) return this.not(this.not(selector))
      return $(filter.call(this, function(element){
        return zepto.matches(element, selector)
      }))
    },
    add: function(selector,context){
      return $(uniq(this.concat($(selector,context))))
    },
    is: function(selector){
      return this.length > 0 && zepto.matches(this[0], selector)
    },
    not: function(selector){
      var nodes=[]
      if (isFunction(selector) && selector.call !== undefined)
        this.each(function(idx){
          if (!selector.call(this,idx)) nodes.push(this)
        })
      else {
        var excludes = typeof selector == 'string' ? this.filter(selector) :
          (likeArray(selector) && isFunction(selector.item)) ? slice.call(selector) : $(selector)
        this.forEach(function(el){
          if (excludes.indexOf(el) < 0) nodes.push(el)
        })
      }
      return $(nodes)
    },
    has: function(selector){
      return this.filter(function(){
        return isObject(selector) ?
          $.contains(this, selector) :
          $(this).find(selector).size()
      })
    },
    eq: function(idx){
      return idx === -1 ? this.slice(idx) : this.slice(idx, + idx + 1)
    },
    first: function(){
      var el = this[0]
      return el && !isObject(el) ? el : $(el)
    },
    last: function(){
      var el = this[this.length - 1]
      return el && !isObject(el) ? el : $(el)
    },
    find: function(selector){
      var result, $this = this
      if (typeof selector == 'object')
        result = $(selector).filter(function(){
          var node = this
          return emptyArray.some.call($this, function(parent){
            return $.contains(parent, node)
          })
        })
      else if (this.length == 1) result = $(zepto.qsa(this[0], selector))
      else result = this.map(function(){ return zepto.qsa(this, selector) })
      return result
    },
    closest: function(selector, context){
      var node = this[0], collection = false
      if (typeof selector == 'object') collection = $(selector)
      while (node && !(collection ? collection.indexOf(node) >= 0 : zepto.matches(node, selector)))
        node = node !== context && !isDocument(node) && node.parentNode
      return $(node)
    },
    parents: function(selector){
      var ancestors = [], nodes = this
      while (nodes.length > 0)
        nodes = $.map(nodes, function(node){
          if ((node = node.parentNode) && !isDocument(node) && ancestors.indexOf(node) < 0) {
            ancestors.push(node)
            return node
          }
        })
      return filtered(ancestors, selector)
    },
    parent: function(selector){
      return filtered(uniq(this.pluck('parentNode')), selector)
    },
    children: function(selector){
      return filtered(this.map(function(){ return children(this) }), selector)
    },
    contents: function() {
      return this.map(function() { return slice.call(this.childNodes) })
    },
    siblings: function(selector){
      return filtered(this.map(function(i, el){
        return filter.call(children(el.parentNode), function(child){ return child!==el })
      }), selector)
    },
    empty: function(){
      return this.each(function(){ this.innerHTML = '' })
    },
    // `pluck` is borrowed from Prototype.js
    pluck: function(property){
      return $.map(this, function(el){ return el[property] })
    },
    show: function(){
      return this.each(function(){
        this.style.display == "none" && (this.style.display = null)
        if (getComputedStyle(this, '').getPropertyValue("display") == "none")
          this.style.display = defaultDisplay(this.nodeName)
      })
    },
    replaceWith: function(newContent){
      return this.before(newContent).remove()
    },
    wrap: function(structure){
      var func = isFunction(structure)
      if (this[0] && !func)
        var dom   = $(structure).get(0),
            clone = dom.parentNode || this.length > 1

      return this.each(function(index){
        $(this).wrapAll(
          func ? structure.call(this, index) :
            clone ? dom.cloneNode(true) : dom
        )
      })
    },
    wrapAll: function(structure){
      if (this[0]) {
        $(this[0]).before(structure = $(structure))
        var children
        // drill down to the inmost element
        while ((children = structure.children()).length) structure = children.first()
        $(structure).append(this)
      }
      return this
    },
    wrapInner: function(structure){
      var func = isFunction(structure)
      return this.each(function(index){
        var self = $(this), contents = self.contents(),
            dom  = func ? structure.call(this, index) : structure
        contents.length ? contents.wrapAll(dom) : self.append(dom)
      })
    },
    unwrap: function(){
      this.parent().each(function(){
        $(this).replaceWith($(this).children())
      })
      return this
    },
    clone: function(){
      return this.map(function(){ return this.cloneNode(true) })
    },
    hide: function(){
      return this.css("display", "none")
    },
    toggle: function(setting){
      return this.each(function(){
        var el = $(this)
        ;(setting === undefined ? el.css("display") == "none" : setting) ? el.show() : el.hide()
      })
    },
    prev: function(selector){ return $(this.pluck('previousElementSibling')).filter(selector || '*') },
    next: function(selector){ return $(this.pluck('nextElementSibling')).filter(selector || '*') },
    html: function(html){
      return html === undefined ?
        (this.length > 0 ? this[0].innerHTML : null) :
        this.each(function(idx){
          var originHtml = this.innerHTML
          $(this).empty().append( funcArg(this, html, idx, originHtml) )
        })
    },
    text: function(text){
      return text === undefined ?
        (this.length > 0 ? this[0].textContent : null) :
        this.each(function(){ this.textContent = text })
    },
    attr: function(name, value){
      var result
      return (typeof name == 'string' && value === undefined) ?
        (this.length == 0 || this[0].nodeType !== 1 ? undefined :
          (name == 'value' && this[0].nodeName == 'INPUT') ? this.val() :
          (!(result = this[0].getAttribute(name)) && name in this[0]) ? this[0][name] : result
        ) :
        this.each(function(idx){
          if (this.nodeType !== 1) return
          if (isObject(name)) for (key in name) setAttribute(this, key, name[key])
          else setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name)))
        })
    },
    removeAttr: function(name){
      return this.each(function(){ this.nodeType === 1 && setAttribute(this, name) })
    },
    prop: function(name, value){
      return (value === undefined) ?
        (this[0] && this[0][name]) :
        this.each(function(idx){
          this[name] = funcArg(this, value, idx, this[name])
        })
    },
    data: function(name, value){
      var data = this.attr('data-' + dasherize(name), value)
      return data !== null ? deserializeValue(data) : undefined
    },
    val: function(value){
      return (value === undefined) ?
        (this[0] && (this[0].multiple ?
           $(this[0]).find('option').filter(function(o){ return this.selected }).pluck('value') :
           this[0].value)
        ) :
        this.each(function(idx){
          this.value = funcArg(this, value, idx, this.value)
        })
    },
    offset: function(coordinates){
      if (coordinates) return this.each(function(index){
        var $this = $(this),
            coords = funcArg(this, coordinates, index, $this.offset()),
            parentOffset = $this.offsetParent().offset(),
            props = {
              top:  coords.top  - parentOffset.top,
              left: coords.left - parentOffset.left
            }

        if ($this.css('position') == 'static') props['position'] = 'relative'
        $this.css(props)
      })
      if (this.length==0) return null
      var obj = this[0].getBoundingClientRect()
      return {
        left: obj.left + window.pageXOffset,
        top: obj.top + window.pageYOffset,
        width: Math.round(obj.width),
        height: Math.round(obj.height)
      }
    },
    css: function(property, value){
      if (arguments.length < 2 && typeof property == 'string')
        return this[0] && (this[0].style[camelize(property)] || getComputedStyle(this[0], '').getPropertyValue(property))

      var css = ''
      if (type(property) == 'string') {
        if (!value && value !== 0)
          this.each(function(){ this.style.removeProperty(dasherize(property)) })
        else
          css = dasherize(property) + ":" + maybeAddPx(property, value)
      } else {
        for (key in property)
          if (!property[key] && property[key] !== 0)
            this.each(function(){ this.style.removeProperty(dasherize(key)) })
          else
            css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';'
      }

      return this.each(function(){ this.style.cssText += ';' + css })
    },
    index: function(element){
      return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0])
    },
    hasClass: function(name){
      return emptyArray.some.call(this, function(el){
        return this.test(className(el))
      }, classRE(name))
    },
    addClass: function(name){
      return this.each(function(idx){
        classList = []
        var cls = className(this), newName = funcArg(this, name, idx, cls)
        newName.split(/\s+/g).forEach(function(klass){
          if (!$(this).hasClass(klass)) classList.push(klass)
        }, this)
        classList.length && className(this, cls + (cls ? " " : "") + classList.join(" "))
      })
    },
    removeClass: function(name){
      return this.each(function(idx){
        if (name === undefined) return className(this, '')
        classList = className(this)
        funcArg(this, name, idx, classList).split(/\s+/g).forEach(function(klass){
          classList = classList.replace(classRE(klass), " ")
        })
        className(this, classList.trim())
      })
    },
    toggleClass: function(name, when){
      return this.each(function(idx){
        var $this = $(this), names = funcArg(this, name, idx, className(this))
        names.split(/\s+/g).forEach(function(klass){
          (when === undefined ? !$this.hasClass(klass) : when) ?
            $this.addClass(klass) : $this.removeClass(klass)
        })
      })
    },
    scrollTop: function(){
      if (!this.length) return
      return ('scrollTop' in this[0]) ? this[0].scrollTop : this[0].scrollY
    },
    position: function() {
      if (!this.length) return

      var elem = this[0],
        // Get *real* offsetParent
        offsetParent = this.offsetParent(),
        // Get correct offsets
        offset       = this.offset(),
        parentOffset = rootNodeRE.test(offsetParent[0].nodeName) ? { top: 0, left: 0 } : offsetParent.offset()

      // Subtract element margins
      // note: when an element has margin: auto the offsetLeft and marginLeft
      // are the same in Safari causing offset.left to incorrectly be 0
      offset.top  -= parseFloat( $(elem).css('margin-top') ) || 0
      offset.left -= parseFloat( $(elem).css('margin-left') ) || 0

      // Add offsetParent borders
      parentOffset.top  += parseFloat( $(offsetParent[0]).css('border-top-width') ) || 0
      parentOffset.left += parseFloat( $(offsetParent[0]).css('border-left-width') ) || 0

      // Subtract the two offsets
      return {
        top:  offset.top  - parentOffset.top,
        left: offset.left - parentOffset.left
      }
    },
    offsetParent: function() {
      return this.map(function(){
        var parent = this.offsetParent || document.body
        while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css("position") == "static")
          parent = parent.offsetParent
        return parent
      })
    }
  }

  // for now
  $.fn.detach = $.fn.remove

  // Generate the `width` and `height` functions
  ;['width', 'height'].forEach(function(dimension){
    $.fn[dimension] = function(value){
      var offset, el = this[0],
        Dimension = dimension.replace(/./, function(m){ return m[0].toUpperCase() })
      if (value === undefined) return isWindow(el) ? el['inner' + Dimension] :
        isDocument(el) ? el.documentElement['offset' + Dimension] :
        (offset = this.offset()) && offset[dimension]
      else return this.each(function(idx){
        el = $(this)
        el.css(dimension, funcArg(this, value, idx, el[dimension]()))
      })
    }
  })

  function traverseNode(node, fun) {
    fun(node)
    for (var key in node.childNodes) traverseNode(node.childNodes[key], fun)
  }

  // Generate the `after`, `prepend`, `before`, `append`,
  // `insertAfter`, `insertBefore`, `appendTo`, and `prependTo` methods.
  adjacencyOperators.forEach(function(operator, operatorIndex) {
    var inside = operatorIndex % 2 //=> prepend, append

    $.fn[operator] = function(){
      // arguments can be nodes, arrays of nodes, Zepto objects and HTML strings
      var argType, nodes = $.map(arguments, function(arg) {
            argType = type(arg)
            return argType == "object" || argType == "array" || arg == null ?
              arg : zepto.fragment(arg)
          }),
          parent, copyByClone = this.length > 1
      if (nodes.length < 1) return this

      return this.each(function(_, target){
        parent = inside ? target : target.parentNode

        // convert all methods to a "before" operation
        target = operatorIndex == 0 ? target.nextSibling :
                 operatorIndex == 1 ? target.firstChild :
                 operatorIndex == 2 ? target :
                 null

        nodes.forEach(function(node){
          if (copyByClone) node = node.cloneNode(true)
          else if (!parent) return $(node).remove()

          traverseNode(parent.insertBefore(node, target), function(el){
            if (el.nodeName != null && el.nodeName.toUpperCase() === 'SCRIPT' &&
               (!el.type || el.type === 'text/javascript') && !el.src)
              window['eval'].call(window, el.innerHTML)
          })
        })
      })
    }

    // after    => insertAfter
    // prepend  => prependTo
    // before   => insertBefore
    // append   => appendTo
    $.fn[inside ? operator+'To' : 'insert'+(operatorIndex ? 'Before' : 'After')] = function(html){
      $(html)[operator](this)
      return this
    }
  })

  zepto.Z.prototype = $.fn

  // Export internal API functions in the `$.zepto` namespace
  zepto.uniq = uniq
  zepto.deserializeValue = deserializeValue
  $.zepto = zepto

  return $
})()

// @@ original loader
// window.Zepto = Zepto
// '$' in window || (window.$ = Zepto)
// @@ modified by jiyinyiyong
module.exports.$ = Zepto;
module.exports.Zepto = Zepto;
// @@ modifications end


;(function($){
  function detect(ua){
    var os = this.os = {}, browser = this.browser = {},
      webkit = ua.match(/WebKit\/([\d.]+)/),
      android = ua.match(/(Android)\s+([\d.]+)/),
      ipad = ua.match(/(iPad).*OS\s([\d_]+)/),
      iphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/),
      webos = ua.match(/(webOS|hpwOS)[\s\/]([\d.]+)/),
      touchpad = webos && ua.match(/TouchPad/),
      kindle = ua.match(/Kindle\/([\d.]+)/),
      silk = ua.match(/Silk\/([\d._]+)/),
      blackberry = ua.match(/(BlackBerry).*Version\/([\d.]+)/),
      bb10 = ua.match(/(BB10).*Version\/([\d.]+)/),
      rimtabletos = ua.match(/(RIM\sTablet\sOS)\s([\d.]+)/),
      playbook = ua.match(/PlayBook/),
      chrome = ua.match(/Chrome\/([\d.]+)/) || ua.match(/CriOS\/([\d.]+)/),
      firefox = ua.match(/Firefox\/([\d.]+)/)

    // Todo: clean this up with a better OS/browser seperation:
    // - discern (more) between multiple browsers on android
    // - decide if kindle fire in silk mode is android or not
    // - Firefox on Android doesn't specify the Android version
    // - possibly devide in os, device and browser hashes

    if (browser.webkit = !!webkit) browser.version = webkit[1]

    if (android) os.android = true, os.version = android[2]
    if (iphone) os.ios = os.iphone = true, os.version = iphone[2].replace(/_/g, '.')
    if (ipad) os.ios = os.ipad = true, os.version = ipad[2].replace(/_/g, '.')
    if (webos) os.webos = true, os.version = webos[2]
    if (touchpad) os.touchpad = true
    if (blackberry) os.blackberry = true, os.version = blackberry[2]
    if (bb10) os.bb10 = true, os.version = bb10[2]
    if (rimtabletos) os.rimtabletos = true, os.version = rimtabletos[2]
    if (playbook) browser.playbook = true
    if (kindle) os.kindle = true, os.version = kindle[1]
    if (silk) browser.silk = true, browser.version = silk[1]
    if (!silk && os.android && ua.match(/Kindle Fire/)) browser.silk = true
    if (chrome) browser.chrome = true, browser.version = chrome[1]
    if (firefox) browser.firefox = true, browser.version = firefox[1]

    os.tablet = !!(ipad || playbook || (android && !ua.match(/Mobile/)) || (firefox && ua.match(/Tablet/)))
    os.phone  = !!(!os.tablet && (android || iphone || webos || blackberry || bb10 ||
      (chrome && ua.match(/Android/)) || (chrome && ua.match(/CriOS\/([\d.]+)/)) || (firefox && ua.match(/Mobile/))))
  }

  detect.call($, navigator.userAgent)
  // make available to unit tests
  $.__detect = detect

})(Zepto)





;(function($){
  var $$ = $.zepto.qsa, handlers = {}, _zid = 1, specialEvents={},
      hover = { mouseenter: 'mouseover', mouseleave: 'mouseout' }

  specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents'

  function zid(element) {
    return element._zid || (element._zid = _zid++)
  }
  function findHandlers(element, event, fn, selector) {
    event = parse(event)
    if (event.ns) var matcher = matcherFor(event.ns)
    return (handlers[zid(element)] || []).filter(function(handler) {
      return handler
        && (!event.e  || handler.e == event.e)
        && (!event.ns || matcher.test(handler.ns))
        && (!fn       || zid(handler.fn) === zid(fn))
        && (!selector || handler.sel == selector)
    })
  }
  function parse(event) {
    var parts = ('' + event).split('.')
    return {e: parts[0], ns: parts.slice(1).sort().join(' ')}
  }
  function matcherFor(ns) {
    return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)')
  }

  function eachEvent(events, fn, iterator){
    if ($.type(events) != "string") $.each(events, iterator)
    else events.split(/\s/).forEach(function(type){ iterator(type, fn) })
  }

  function eventCapture(handler, captureSetting) {
    return handler.del &&
      (handler.e == 'focus' || handler.e == 'blur') ||
      !!captureSetting
  }

  function realEvent(type) {
    return hover[type] || type
  }

  function add(element, events, fn, selector, getDelegate, capture){
    var id = zid(element), set = (handlers[id] || (handlers[id] = []))
    eachEvent(events, fn, function(event, fn){
      var handler   = parse(event)
      handler.fn    = fn
      handler.sel   = selector
      // emulate mouseenter, mouseleave
      if (handler.e in hover) fn = function(e){
        var related = e.relatedTarget
        if (!related || (related !== this && !$.contains(this, related)))
          return handler.fn.apply(this, arguments)
      }
      handler.del   = getDelegate && getDelegate(fn, event)
      var callback  = handler.del || fn
      handler.proxy = function (e) {
        var result = callback.apply(element, [e].concat(e.data))
        if (result === false) e.preventDefault(), e.stopPropagation()
        return result
      }
      handler.i = set.length
      set.push(handler)
      element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
    })
  }
  function remove(element, events, fn, selector, capture){
    var id = zid(element)
    eachEvent(events || '', fn, function(event, fn){
      findHandlers(element, event, fn, selector).forEach(function(handler){
        delete handlers[id][handler.i]
        element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
      })
    })
  }

  $.event = { add: add, remove: remove }

  $.proxy = function(fn, context) {
    if ($.isFunction(fn)) {
      var proxyFn = function(){ return fn.apply(context, arguments) }
      proxyFn._zid = zid(fn)
      return proxyFn
    } else if (typeof context == 'string') {
      return $.proxy(fn[context], fn)
    } else {
      throw new TypeError("expected function")
    }
  }

  $.fn.bind = function(event, callback){
    return this.each(function(){
      add(this, event, callback)
    })
  }
  $.fn.unbind = function(event, callback){
    return this.each(function(){
      remove(this, event, callback)
    })
  }
  $.fn.one = function(event, callback){
    return this.each(function(i, element){
      add(this, event, callback, null, function(fn, type){
        return function(){
          var result = fn.apply(element, arguments)
          remove(element, type, fn)
          return result
        }
      })
    })
  }

  var returnTrue = function(){return true},
      returnFalse = function(){return false},
      ignoreProperties = /^([A-Z]|layer[XY]$)/,
      eventMethods = {
        preventDefault: 'isDefaultPrevented',
        stopImmediatePropagation: 'isImmediatePropagationStopped',
        stopPropagation: 'isPropagationStopped'
      }
  function createProxy(event) {
    var key, proxy = { originalEvent: event }
    for (key in event)
      if (!ignoreProperties.test(key) && event[key] !== undefined) proxy[key] = event[key]

    $.each(eventMethods, function(name, predicate) {
      proxy[name] = function(){
        this[predicate] = returnTrue
        return event[name].apply(event, arguments)
      }
      proxy[predicate] = returnFalse
    })
    return proxy
  }

  // emulates the 'defaultPrevented' property for browsers that have none
  function fix(event) {
    if (!('defaultPrevented' in event)) {
      event.defaultPrevented = false
      var prevent = event.preventDefault
      event.preventDefault = function() {
        this.defaultPrevented = true
        prevent.call(this)
      }
    }
  }

  $.fn.delegate = function(selector, event, callback){
    return this.each(function(i, element){
      add(element, event, callback, selector, function(fn){
        return function(e){
          var evt, match = $(e.target).closest(selector, element).get(0)
          if (match) {
            evt = $.extend(createProxy(e), {currentTarget: match, liveFired: element})
            return fn.apply(match, [evt].concat([].slice.call(arguments, 1)))
          }
        }
      })
    })
  }
  $.fn.undelegate = function(selector, event, callback){
    return this.each(function(){
      remove(this, event, callback, selector)
    })
  }

  $.fn.live = function(event, callback){
    $(document.body).delegate(this.selector, event, callback)
    return this
  }
  $.fn.die = function(event, callback){
    $(document.body).undelegate(this.selector, event, callback)
    return this
  }

  $.fn.on = function(event, selector, callback){
    return !selector || $.isFunction(selector) ?
      this.bind(event, selector || callback) : this.delegate(selector, event, callback)
  }
  $.fn.off = function(event, selector, callback){
    return !selector || $.isFunction(selector) ?
      this.unbind(event, selector || callback) : this.undelegate(selector, event, callback)
  }

  $.fn.trigger = function(event, data){
    if (typeof event == 'string' || $.isPlainObject(event)) event = $.Event(event)
    fix(event)
    event.data = data
    return this.each(function(){
      // items in the collection might not be DOM elements
      // (todo: possibly support events on plain old objects)
      if('dispatchEvent' in this) this.dispatchEvent(event)
    })
  }

  // triggers event handlers on current element just as if an event occurred,
  // doesn't trigger an actual event, doesn't bubble
  $.fn.triggerHandler = function(event, data){
    var e, result
    this.each(function(i, element){
      e = createProxy(typeof event == 'string' ? $.Event(event) : event)
      e.data = data
      e.target = element
      $.each(findHandlers(element, event.type || event), function(i, handler){
        result = handler.proxy(e)
        if (e.isImmediatePropagationStopped()) return false
      })
    })
    return result
  }

  // shortcut methods for `.bind(event, fn)` for each event type
  ;('focusin focusout load resize scroll unload click dblclick '+
  'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave '+
  'change select keydown keypress keyup error').split(' ').forEach(function(event) {
    $.fn[event] = function(callback) {
      return callback ?
        this.bind(event, callback) :
        this.trigger(event)
    }
  })

  ;['focus', 'blur'].forEach(function(name) {
    $.fn[name] = function(callback) {
      if (callback) this.bind(name, callback)
      else this.each(function(){
        try { this[name]() }
        catch(e) {}
      })
      return this
    }
  })

  $.Event = function(type, props) {
    if (typeof type != 'string') props = type, type = props.type
    var event = document.createEvent(specialEvents[type] || 'Events'), bubbles = true
    if (props) for (var name in props) (name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name])
    event.initEvent(type, bubbles, true, null, null, null, null, null, null, null, null, null, null, null, null)
    event.isDefaultPrevented = function(){ return this.defaultPrevented }
    return event
  }

})(Zepto)





;(function($){
  var jsonpID = 0,
      document = window.document,
      key,
      name,
      rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      scriptTypeRE = /^(?:text|application)\/javascript/i,
      xmlTypeRE = /^(?:text|application)\/xml/i,
      jsonType = 'application/json',
      htmlType = 'text/html',
      blankRE = /^\s*$/

  // trigger a custom event and return false if it was cancelled
  function triggerAndReturn(context, eventName, data) {
    var event = $.Event(eventName)
    $(context).trigger(event, data)
    return !event.defaultPrevented
  }

  // trigger an Ajax "global" event
  function triggerGlobal(settings, context, eventName, data) {
    if (settings.global) return triggerAndReturn(context || document, eventName, data)
  }

  // Number of active Ajax requests
  $.active = 0

  function ajaxStart(settings) {
    if (settings.global && $.active++ === 0) triggerGlobal(settings, null, 'ajaxStart')
  }
  function ajaxStop(settings) {
    if (settings.global && !(--$.active)) triggerGlobal(settings, null, 'ajaxStop')
  }

  // triggers an extra global event "ajaxBeforeSend" that's like "ajaxSend" but cancelable
  function ajaxBeforeSend(xhr, settings) {
    var context = settings.context
    if (settings.beforeSend.call(context, xhr, settings) === false ||
        triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false)
      return false

    triggerGlobal(settings, context, 'ajaxSend', [xhr, settings])
  }
  function ajaxSuccess(data, xhr, settings) {
    var context = settings.context, status = 'success'
    settings.success.call(context, data, status, xhr)
    triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data])
    ajaxComplete(status, xhr, settings)
  }
  // type: "timeout", "error", "abort", "parsererror"
  function ajaxError(error, type, xhr, settings) {
    var context = settings.context
    settings.error.call(context, xhr, type, error)
    triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error])
    ajaxComplete(type, xhr, settings)
  }
  // status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
  function ajaxComplete(status, xhr, settings) {
    var context = settings.context
    settings.complete.call(context, xhr, status)
    triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings])
    ajaxStop(settings)
  }

  // Empty function, used as default callback
  function empty() {}

  $.ajaxJSONP = function(options){
    if (!('type' in options)) return $.ajax(options)

    var callbackName = 'jsonp' + (++jsonpID),
      script = document.createElement('script'),
      cleanup = function() {
        clearTimeout(abortTimeout)
        $(script).remove()
        delete window[callbackName]
      },
      abort = function(type){
        cleanup()
        // In case of manual abort or timeout, keep an empty function as callback
        // so that the SCRIPT tag that eventually loads won't result in an error.
        if (!type || type == 'timeout') window[callbackName] = empty
        ajaxError(null, type || 'abort', xhr, options)
      },
      xhr = { abort: abort }, abortTimeout

    if (ajaxBeforeSend(xhr, options) === false) {
      abort('abort')
      return false
    }

    window[callbackName] = function(data){
      cleanup()
      ajaxSuccess(data, xhr, options)
    }

    script.onerror = function() { abort('error') }

    script.src = options.url.replace(/=\?/, '=' + callbackName)
    $('head').append(script)

    if (options.timeout > 0) abortTimeout = setTimeout(function(){
      abort('timeout')
    }, options.timeout)

    return xhr
  }

  $.ajaxSettings = {
    // Default type of request
    type: 'GET',
    // Callback that is executed before request
    beforeSend: empty,
    // Callback that is executed if the request succeeds
    success: empty,
    // Callback that is executed the the server drops error
    error: empty,
    // Callback that is executed on request complete (both: error and success)
    complete: empty,
    // The context for the callbacks
    context: null,
    // Whether to trigger "global" Ajax events
    global: true,
    // Transport
    xhr: function () {
      return new window.XMLHttpRequest()
    },
    // MIME types mapping
    accepts: {
      script: 'text/javascript, application/javascript',
      json:   jsonType,
      xml:    'application/xml, text/xml',
      html:   htmlType,
      text:   'text/plain'
    },
    // Whether the request is to another domain
    crossDomain: false,
    // Default timeout
    timeout: 0,
    // Whether data should be serialized to string
    processData: true,
    // Whether the browser should be allowed to cache GET responses
    cache: true,
  }

  function mimeToDataType(mime) {
    if (mime) mime = mime.split(';', 2)[0]
    return mime && ( mime == htmlType ? 'html' :
      mime == jsonType ? 'json' :
      scriptTypeRE.test(mime) ? 'script' :
      xmlTypeRE.test(mime) && 'xml' ) || 'text'
  }

  function appendQuery(url, query) {
    return (url + '&' + query).replace(/[&?]{1,2}/, '?')
  }

  // serialize payload and append it to the URL for GET requests
  function serializeData(options) {
    if (options.processData && options.data && $.type(options.data) != "string")
      options.data = $.param(options.data, options.traditional)
    if (options.data && (!options.type || options.type.toUpperCase() == 'GET'))
      options.url = appendQuery(options.url, options.data)
  }

  $.ajax = function(options){
    var settings = $.extend({}, options || {})
    for (key in $.ajaxSettings) if (settings[key] === undefined) settings[key] = $.ajaxSettings[key]

    ajaxStart(settings)

    if (!settings.crossDomain) settings.crossDomain = /^([\w-]+:)?\/\/([^\/]+)/.test(settings.url) &&
      RegExp.$2 != window.location.host

    if (!settings.url) settings.url = window.location.toString()
    serializeData(settings)
    if (settings.cache === false) settings.url = appendQuery(settings.url, '_=' + Date.now())

    var dataType = settings.dataType, hasPlaceholder = /=\?/.test(settings.url)
    if (dataType == 'jsonp' || hasPlaceholder) {
      if (!hasPlaceholder) settings.url = appendQuery(settings.url, 'callback=?')
      return $.ajaxJSONP(settings)
    }

    var mime = settings.accepts[dataType],
        baseHeaders = { },
        protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
        xhr = settings.xhr(), abortTimeout

    if (!settings.crossDomain) baseHeaders['X-Requested-With'] = 'XMLHttpRequest'
    if (mime) {
      baseHeaders['Accept'] = mime
      if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0]
      xhr.overrideMimeType && xhr.overrideMimeType(mime)
    }
    if (settings.contentType || (settings.contentType !== false && settings.data && settings.type.toUpperCase() != 'GET'))
      baseHeaders['Content-Type'] = (settings.contentType || 'application/x-www-form-urlencoded')
    settings.headers = $.extend(baseHeaders, settings.headers || {})

    xhr.onreadystatechange = function(){
      if (xhr.readyState == 4) {
        xhr.onreadystatechange = empty;
        clearTimeout(abortTimeout)
        var result, error = false
        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {
          dataType = dataType || mimeToDataType(xhr.getResponseHeader('content-type'))
          result = xhr.responseText

          try {
            // http://perfectionkills.com/global-eval-what-are-the-options/
            if (dataType == 'script')    (1,eval)(result)
            else if (dataType == 'xml')  result = xhr.responseXML
            else if (dataType == 'json') result = blankRE.test(result) ? null : $.parseJSON(result)
          } catch (e) { error = e }

          if (error) ajaxError(error, 'parsererror', xhr, settings)
          else ajaxSuccess(result, xhr, settings)
        } else {
          ajaxError(null, xhr.status ? 'error' : 'abort', xhr, settings)
        }
      }
    }

    var async = 'async' in settings ? settings.async : true
    xhr.open(settings.type, settings.url, async)

    for (name in settings.headers) xhr.setRequestHeader(name, settings.headers[name])

    if (ajaxBeforeSend(xhr, settings) === false) {
      xhr.abort()
      return false
    }

    if (settings.timeout > 0) abortTimeout = setTimeout(function(){
        xhr.onreadystatechange = empty
        xhr.abort()
        ajaxError(null, 'timeout', xhr, settings)
      }, settings.timeout)

    // avoid sending empty string (#319)
    xhr.send(settings.data ? settings.data : null)
    return xhr
  }

  // handle optional data/success arguments
  function parseArguments(url, data, success, dataType) {
    var hasData = !$.isFunction(data)
    return {
      url:      url,
      data:     hasData  ? data : undefined,
      success:  !hasData ? data : $.isFunction(success) ? success : undefined,
      dataType: hasData  ? dataType || success : success
    }
  }

  $.get = function(url, data, success, dataType){
    return $.ajax(parseArguments.apply(null, arguments))
  }

  $.post = function(url, data, success, dataType){
    var options = parseArguments.apply(null, arguments)
    options.type = 'POST'
    return $.ajax(options)
  }

  $.getJSON = function(url, data, success){
    var options = parseArguments.apply(null, arguments)
    options.dataType = 'json'
    return $.ajax(options)
  }

  $.fn.load = function(url, data, success){
    if (!this.length) return this
    var self = this, parts = url.split(/\s/), selector,
        options = parseArguments(url, data, success),
        callback = options.success
    if (parts.length > 1) options.url = parts[0], selector = parts[1]
    options.success = function(response){
      self.html(selector ?
        $('<div>').html(response.replace(rscript, "")).find(selector)
        : response)
      callback && callback.apply(self, arguments)
    }
    $.ajax(options)
    return this
  }

  var escape = encodeURIComponent

  function serialize(params, obj, traditional, scope){
    var type, array = $.isArray(obj)
    $.each(obj, function(key, value) {
      type = $.type(value)
      if (scope) key = traditional ? scope : scope + '[' + (array ? '' : key) + ']'
      // handle data in serializeArray() format
      if (!scope && array) params.add(value.name, value.value)
      // recurse into nested objects
      else if (type == "array" || (!traditional && type == "object"))
        serialize(params, value, traditional, key)
      else params.add(key, value)
    })
  }

  $.param = function(obj, traditional){
    var params = []
    params.add = function(k, v){ this.push(escape(k) + '=' + escape(v)) }
    serialize(params, obj, traditional)
    return params.join('&').replace(/%20/g, '+')
  }
})(Zepto)





;(function ($) {
  $.fn.serializeArray = function () {
    var result = [], el
    $( Array.prototype.slice.call(this.get(0).elements) ).each(function () {
      el = $(this)
      var type = el.attr('type')
      if (this.nodeName.toLowerCase() != 'fieldset' &&
        !this.disabled && type != 'submit' && type != 'reset' && type != 'button' &&
        ((type != 'radio' && type != 'checkbox') || this.checked))
        result.push({
          name: el.attr('name'),
          value: el.val()
        })
    })
    return result
  }

  $.fn.serialize = function () {
    var result = []
    this.serializeArray().forEach(function (elm) {
      result.push( encodeURIComponent(elm.name) + '=' + encodeURIComponent(elm.value) )
    })
    return result.join('&')
  }

  $.fn.submit = function (callback) {
    if (callback) this.bind('submit', callback)
    else if (this.length) {
      var event = $.Event('submit')
      this.eq(0).trigger(event)
      if (!event.defaultPrevented) this.get(0).submit()
    }
    return this
  }

})(Zepto)





;(function($, undefined){
  var prefix = '', eventPrefix, endEventName, endAnimationName,
    vendors = { Webkit: 'webkit', Moz: '', O: 'o', ms: 'MS' },
    document = window.document, testEl = document.createElement('div'),
    supportedTransforms = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i,
    transform,
    transitionProperty, transitionDuration, transitionTiming,
    animationName, animationDuration, animationTiming,
    cssReset = {}

  function dasherize(str) { return downcase(str.replace(/([a-z])([A-Z])/, '$1-$2')) }
  function downcase(str) { return str.toLowerCase() }
  function normalizeEvent(name) { return eventPrefix ? eventPrefix + name : downcase(name) }

  $.each(vendors, function(vendor, event){
    if (testEl.style[vendor + 'TransitionProperty'] !== undefined) {
      prefix = '-' + downcase(vendor) + '-'
      eventPrefix = event
      return false
    }
  })

  transform = prefix + 'transform'
  cssReset[transitionProperty = prefix + 'transition-property'] =
  cssReset[transitionDuration = prefix + 'transition-duration'] =
  cssReset[transitionTiming   = prefix + 'transition-timing-function'] =
  cssReset[animationName      = prefix + 'animation-name'] =
  cssReset[animationDuration  = prefix + 'animation-duration'] =
  cssReset[animationTiming    = prefix + 'animation-timing-function'] = ''

  $.fx = {
    off: (eventPrefix === undefined && testEl.style.transitionProperty === undefined),
    speeds: { _default: 400, fast: 200, slow: 600 },
    cssPrefix: prefix,
    transitionEnd: normalizeEvent('TransitionEnd'),
    animationEnd: normalizeEvent('AnimationEnd')
  }

  $.fn.animate = function(properties, duration, ease, callback){
    if ($.isPlainObject(duration))
      ease = duration.easing, callback = duration.complete, duration = duration.duration
    if (duration) duration = (typeof duration == 'number' ? duration :
                    ($.fx.speeds[duration] || $.fx.speeds._default)) / 1000
    return this.anim(properties, duration, ease, callback)
  }

  $.fn.anim = function(properties, duration, ease, callback){
    var key, cssValues = {}, cssProperties, transforms = '',
        that = this, wrappedCallback, endEvent = $.fx.transitionEnd

    if (duration === undefined) duration = 0.4
    if ($.fx.off) duration = 0

    if (typeof properties == 'string') {
      // keyframe animation
      cssValues[animationName] = properties
      cssValues[animationDuration] = duration + 's'
      cssValues[animationTiming] = (ease || 'linear')
      endEvent = $.fx.animationEnd
    } else {
      cssProperties = []
      // CSS transitions
      for (key in properties)
        if (supportedTransforms.test(key)) transforms += key + '(' + properties[key] + ') '
        else cssValues[key] = properties[key], cssProperties.push(dasherize(key))

      if (transforms) cssValues[transform] = transforms, cssProperties.push(transform)
      if (duration > 0 && typeof properties === 'object') {
        cssValues[transitionProperty] = cssProperties.join(', ')
        cssValues[transitionDuration] = duration + 's'
        cssValues[transitionTiming] = (ease || 'linear')
      }
    }

    wrappedCallback = function(event){
      if (typeof event !== 'undefined') {
        if (event.target !== event.currentTarget) return // makes sure the event didn't bubble from "below"
        $(event.target).unbind(endEvent, wrappedCallback)
      }
      $(this).css(cssReset)
      callback && callback.call(this)
    }
    if (duration > 0) this.bind(endEvent, wrappedCallback)

    // trigger page reflow so new elements can animate
    this.size() && this.get(0).clientLeft

    this.css(cssValues)

    if (duration <= 0) setTimeout(function() {
      that.each(function(){ wrappedCallback.call(this) })
    }, 0)

    return this
  }

  testEl = null
})(Zepto)

},{}]},{},[9])


//# sourceMappingURL=output.js.map