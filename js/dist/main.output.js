(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/tribbleb/Sites/make-us-proud-site/js/src/_animateOnLoad.js":[function(require,module,exports){
var $$ = document.querySelectorAll.bind(document);

// animate elements on scroll
(function() {

  var animateElementOnLoad = function(element) {
    setTimeout(function() {
      element.classList.add('animate');
    }, 1500);
  };

  var elementsToAnimateOnLoad = $$('.animate-on-load');

  for (var i = 0; i < elementsToAnimateOnLoad.length; ++i) {
    animateElementOnLoad(elementsToAnimateOnLoad[i]);
  }
}());

},{}],"/Users/tribbleb/Sites/make-us-proud-site/js/src/_animateOnScroll.js":[function(require,module,exports){
var raf = require('raf');
var zepto = require('zepto-browserify').Zepto;
var $$ = document.querySelectorAll.bind(document);

var scrollPos = 0;
var windowHeight = window.innerHeight;

// animate elements on scroll
module.exports = (function() {

  var animateElementOnScroll = function(element) {
    var elementPos;

    function tick() {
      scrollPos = window.pageYOffset;
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

},{"raf":"/Users/tribbleb/Sites/make-us-proud-site/node_modules/raf/index.js","zepto-browserify":"/Users/tribbleb/Sites/make-us-proud-site/node_modules/zepto-browserify/zepto.js"}],"/Users/tribbleb/Sites/make-us-proud-site/js/src/_contactForm.js":[function(require,module,exports){
/* global ga */

var zepto = require('zepto-browserify').Zepto;
var $ = document.querySelector.bind(document);

var elNameField = $('.mail-form [name=name]');
var elEmailField = $('.mail-form [name=email]');
var elMessageField = $('.mail-form [name=message]');
var elContactFormSubmit = $('.mail-form .submit');


function updateValidity(evt){
    var target = evt && evt.target || this;

    if(target.validity.valid){
      target.setAttribute('data-isvalid', true);
    } else {
      target.setAttribute('data-isvalid', false);
    }
}

[elNameField, elEmailField, elMessageField].forEach(function(el){
  // updateValidity.call(el);
  el.addEventListener('input', updateValidity , false);
});

function formIsValid(){
  var valid = true;
  [elNameField, elEmailField, elMessageField].forEach(function(el){
    if(!el.validity.valid){
      valid = false;
    }
  });
  return valid;
}

function showErrors(){
  $('.mail-form').classList.add('show-errors');
}

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
  ga('send', 'event', 'Contact', 'sent contact email', 'Contact Modal');
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
  if(formIsValid()){
    event.preventDefault();
    submitAction();
  } else {
    showErrors();
  }
});

},{"zepto-browserify":"/Users/tribbleb/Sites/make-us-proud-site/node_modules/zepto-browserify/zepto.js"}],"/Users/tribbleb/Sites/make-us-proud-site/js/src/_contactModal.js":[function(require,module,exports){
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

},{"zepto-browserify":"/Users/tribbleb/Sites/make-us-proud-site/node_modules/zepto-browserify/zepto.js"}],"/Users/tribbleb/Sites/make-us-proud-site/js/src/_detectAutoplay.js":[function(require,module,exports){
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


},{"bowser":"/Users/tribbleb/Sites/make-us-proud-site/node_modules/bowser/bowser.js","domready":"/Users/tribbleb/Sites/make-us-proud-site/node_modules/domready/ready.js"}],"/Users/tribbleb/Sites/make-us-proud-site/js/src/_geniacAnimateHeader.js":[function(require,module,exports){
var Vivus = require('vivus');
var zepto = require('zepto-browserify').$;
var $ = document.querySelector.bind(document);

zepto(function(){
	var el = $('.geniac-study .animation-container svg');
	// console.log(el)
	if(el){
		new Vivus(el, {
			duration: 1000,
			type: 'oneByOne',
			start: 'autostart'
		});
	}
});

},{"vivus":"/Users/tribbleb/Sites/make-us-proud-site/node_modules/vivus/dist/vivus.js","zepto-browserify":"/Users/tribbleb/Sites/make-us-proud-site/node_modules/zepto-browserify/zepto.js"}],"/Users/tribbleb/Sites/make-us-proud-site/js/src/_hypeOnScroll.js":[function(require,module,exports){
var raf = require('raf');
var zepto = require('zepto-browserify').Zepto;
var $ = document.querySelector.bind(document);

var hypeAnimations = [
  {
    hypeId: 'What we do banner',
    elementId: 'whatwedobanner_hype_container'
  },
  {
    hypeId: 'icon-UX',
    elementId: 'iconux_hype_container'
  },
  {
    hypeId: 'UI-engin-icon',
    elementId: 'uienginicon_hype_container'
  },
  {
    hypeId: 'icon-UI design',
    elementId: 'iconuidesign_hype_container'
  },
  {
    hypeId: 'icon-proto',
    elementId: 'iconproto_hype_container'
  }
];

function triggerHypeAnimation(obj){
  
  var el = $('#' + obj.elementId);

  if(!el){
    return;
  }

  var elOffsetTop = el.getBoundingClientRect().top;
  var timelineName = 'start-anim';
  var played = false;
  
  raf(function tick(){
    raf(tick);

    if(window.scrollY >= elOffsetTop - window.innerHeight * 0.75
        && window.HYPE
        && !played
        // && !window.HYPE.documents[obj.hypeId].isPlayingTimelineNamed(timelineName)
      ){
      
      var hypeInstance = window.HYPE.documents[obj.hypeId];
      hypeInstance.goToTimeInTimelineNamed(0, timelineName);
      hypeInstance.continueTimelineNamed(timelineName);
      played = true;
    }

  });
}

zepto(function(){
  hypeAnimations.forEach(triggerHypeAnimation);
});

},{"raf":"/Users/tribbleb/Sites/make-us-proud-site/node_modules/raf/index.js","zepto-browserify":"/Users/tribbleb/Sites/make-us-proud-site/node_modules/zepto-browserify/zepto.js"}],"/Users/tribbleb/Sites/make-us-proud-site/js/src/_navHighlighting.js":[function(require,module,exports){
var zepto = require('zepto-browserify').Zepto;

// Highlight nav items when mouse over
module.exports = (function() {  
  zepto(function() {
    var navSelectors = ['.work-nav-item', '.clients-nav-item', '.process-nav-item', '.blog-nav-item', '.contact-nav-item'];

    navSelectors.forEach(function(navSelector) {
      var navItems = zepto(navSelector);
      navItems
        .on('mouseenter', function() {
          navItems.addClass('mouse-in');
        })
        .on('mouseleave', function() {
          navItems.removeClass('mouse-in');
        });
    });
  });
}());

},{"zepto-browserify":"/Users/tribbleb/Sites/make-us-proud-site/node_modules/zepto-browserify/zepto.js"}],"/Users/tribbleb/Sites/make-us-proud-site/js/src/_navInjection.js":[function(require,module,exports){
var zepto = require('zepto-browserify').Zepto;

module.exports = (function() {
  var navHTML = '<div class="nav-mask"><nav class="main" aria-hidden="true"><a href="/" class="img"> <div class="svg-logo-container"><?xml version="1.0" encoding="utf-8"?><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="-4.2 173.2 485.7 485.6" style="enable-background:new -4.2 173.2 485.7 485.6;" xml:space="preserve"><style type="text/css">.st0{fill:#FFFFFF;}</style><g><path class="st0" d="M481.5,416.1C481.2,550.4,372.8,659,238.3,658.8C104.2,658.6-4.3,550.1-4.2,415.8C-4.1,281.5,104.5,173,238.9,173.2C373.1,173.3,481.3,281.8,481.5,416.1z M362.3,463.3c-0.6,0.4-1.3,0.7-1.8,1.1c-0.7,0.6-1.3,1.4-2,2c0.5-1.2,1-2.3,1.7-3.2c1.3-1.8,2.9-3.5,4.1-5.5c0.8-1.3,2-2.4,1.9-4.1c0-0.2,0.3-0.6,0.5-0.7c0.6-0.3,0.9-0.7,0.8-1.4c0-0.2,0.2-0.5,0.3-0.8c0.3-0.6,0.6-1.2,0.8-1.8c0.1-0.5,0-1,0-1.6c1.9,0.4,2.6-0.1,2.6-1.6c0-0.7-0.2-1.1-1-0.7c-0.6,0.3-1.2,0.4-1.8,0.6c-0.7-1.4-0.8-2.4,0.3-3.4c0.4-0.3,0.4-1.1,0.6-1.6c0.1-0.2,0.3-0.4,0.5-0.8c0.2,0.5,0.2,0.8,0.4,1.1c0.1,0.2,0.4,0.4,0.6,0.4s0.5-0.2,0.5-0.4c0.2-0.9,0.5-1.8,0.3-2.7c-0.2-1.5-0.1-2,0.9-2.4c0.5-1.1,0.9-1.8,1.2-2.6c0.5-1.7,1.3-3.2,2.4-4.6c0.2-0.2-0.2-0.8-0.3-1.3c-0.5,0.2-1.3,0.4-1.3,0.5c0,1.7-1.5,2.5-2.1,3.8c-1.6,3.1-3.5,6-5.2,9c-0.3,0.5-0.6,1-1,1.3c-0.2,0.2-0.7,0.1-1,0c-0.1,0-0.2-0.6-0.1-0.7c0.6-1.1,1.3-2,1.9-3.1c0.8-1.6,2.7-2.7,2.4-4.9c0-0.1,0.1-0.2,0.1-0.2c0-0.5,0.1-1.1-0.1-1.4c-0.5-0.7-0.4-1.3,0-2c0.6-1.1,1.3-2.2,1.5-3.4c0.3-1.2,0.2-2.4,1-3.4c0.1-0.1,0-0.5-0.1-0.6s-0.4-0.1-0.6,0c-0.7,0.6-1.5,1.2-2.3,1.8c0.5,2.3,0.4,2.6-1.1,2.9c0.1-0.2,0.2-0.5,0.1-0.6c-0.1-0.4-0.3-0.8-0.5-1.2c-0.3,0.3-0.6,0.5-0.8,0.9c-1,1.4-1.9,2.9-2.8,4.3c-0.1-0.1-0.3-0.1-0.4-0.2c0.1-0.5,0.2-1,0.4-1.5c0.7-1.7,1.4-3.5,2.2-5.1c0.6-1.2,1.5-2.2,2-3.4c0.3-0.8,0.6-2.1,0.2-2.7c-0.6-0.9-0.5-1.4,0-2.1c0.4-0.6,0.9-1.1,1.5-1.8c0.2-0.8,0.4-1.9,0.9-3c0.9-2,2.1-3.9,3.1-5.9c0.3-0.7,0.2-1.6,0.2-2.3c-0.1-0.6-0.5-0.8-0.9-0.3c-1.1,1.3-2.2,2.6-3.3,3.9c-0.2,0.2-0.4,0.4-0.8,0.7c0-1,0-1.7,0-2.6c-0.6,0.7-1.1,1.3-1.6,1.8c-0.1-0.1-0.3-0.2-0.4-0.2c0.3-0.8,0.7-1.6,0.9-2.4c0.1-0.3,0.3-0.8,0.2-1.1c-0.4-1.7,0.1-3.2,0.7-4.8c0.3-0.7,0.5-1.7,0.1-2.2c-0.7-1-0.7-1.7,0-2.6c0.3-0.4,0.5-0.9,0.5-1.3c0-0.5-0.3-1-0.5-1.5c-0.5,0.2-1,0.3-1.4,0.6c-0.4,0.4-0.6,1-1.1,1.4c-1,0.8-1.8,2.2-3.5,1.7c-0.2-0.1-0.6,0.3-0.9,0.6c-1.1,0.8-2.1,1.7-3.4,2.7c0.1,1.2-1.1,2.3-1.9,3.5c-0.9,1.4-2.1,2.7-3,4.1c-0.9,1.5-1.5,3.1-2.3,4.6c-1.5,2.5-3.1,4.9-4.7,7.3c-1.7,2.7-3.4,5.3-5.1,8c-2,3.1-4,6.3-6,9.3c-1.5,2.2-3.1,4.3-4.6,6.5c-1.1,1.5-2.1,3.1-3.2,4.5c-0.7,0.9-1.6,1.6-2.4,2.4c-0.2,0.2-0.5,0.4-0.4,0.6c0.1,1.7-1.2,2.5-2.1,3.6c-0.6,0.8-1.6,1.5-1.4,2.7c0.4,2.8-1.2,4.7-2.8,6.6c-1.1,1.3-2.6,1.1-3.3-0.1c0.5-1.6,0.9-3,1.4-4.3c0.6-1.5,1.2-2.9,0.8-4.5c-0.1-0.5,0.2-1.1,0.3-1.6c0.1-0.6,0.4-1.2,0.5-1.8c0.4-2,0.8-3.9,1.3-5.9c0.2-0.7,1-1.3,1.1-2.1c0.4-2,0.5-4,0.7-5.9c0-0.3,0.2-0.7,0.4-1c0.2-0.4,0.6-0.8,0.7-1.3c0.3-1.2,0.4-2.5,0.8-3.6c0.7-2.2,1.7-4.3,2.3-6.4c0.6-2,1-4.1,1.5-6.2c1.4,0.3,1.9-0.4,2.3-1.3c-0.6-0.1-1.5-0.2-1.5-0.3c-0.1-0.8,0-1.6,0.1-2.4c0.5,0.1,1.1,0.2,1.7,0.4c0.2-1,0.4-2.1,0.6-3.2c-0.5,0.1-0.7,0.3-0.9,0.5c-0.2,0.2-0.3,0.4-0.5,0.7c-0.7-1.1-0.6-2.5,0.1-3.6c0.3-0.5,0.6-1.3,0.5-1.8c-0.2-1-0.2-1.7,0.5-2.5c0.2-0.2,0.2-0.5,0.3-0.8c0.3-1.7,0.5-3.5,0.8-5.2c0.1-0.8,0.6-1.3,1.5-0.9c0.2,0.1,0.5,0.1,0.8,0.2c0.2-1.3,0.4-2.6,0.6-3.9c0.1-0.7,0-1.3,0.2-2c0.5-1.7,1.1-3.3,1.6-5c0.1-0.2,0-0.6-0.2-0.8c-0.1-0.1-0.5-0.1-0.8,0c-0.2,0.1-0.4,0.2-0.6,0.4c-0.6-1,0-1.4,0.7-1.6c0.9-0.3,0.9-0.8,0.5-1.6c-0.2-0.3-0.3-0.7-0.5-1.1c0.4-0.1,0.8-0.2,1.5-0.3c0.3-2.2,0.7-4.6,1.1-7.1c-0.5,0.2-0.8,0.3-1.4,0.6c0.2-0.8,0.4-1.3,0.5-1.9c0.4,0.3,0.7,0.5,1.3,1c0.1-0.7,0.4-1.3,0.2-1.7c-0.4-0.9,0-1.6,0.2-2.4c0.4-1.2,1-2.7,0.6-3.7c-0.6-1.7-0.1-2.8,0.8-3.9c0.8-1,1-2,0.9-3.3c0-1.6,0.2-3.2,0.4-4.8c0-0.5,0.1-1,0.1-1.5c0-0.3,0-0.7,0.2-1c0.1-0.1,0.6-0.2,0.7-0.1c0.2,0.2,0.3,0.6,0.3,0.9c0,0.8-0.2,1.7-0.3,2.5c-0.2,1.4-0.2,2.8-0.5,4.1c-0.4,2.1-1.1,4.1-1.4,6.2c-0.2,1.7-0.1,3.4-0.1,5.2c-0.1,2.1,0,4.1-0.2,6.2c-0.4,2.8-1,5.5-1.5,8.3c-0.1,0.7-0.4,1.5-0.3,2.2c0.1,2.3-0.3,4.4-1.1,6.6c-0.4,1.1-0.3,2.4-0.5,3.5c1.8,0.6,2.4,0.3,3.1-1.2c0.4-0.9,0.8-1.8,1.3-2.6c1.7-2.7,2-5.7,2.3-8.7c0.2-2.2,0-4.5,0-6.8c1.7,0.1,1.8-1,2-2c0.4-2,0.9-3.9,1.4-5.9c0.5-2.2,1.2-4.5,1.7-6.7c0.3-1.3,0.1-2.9,0.6-4.1c0.8-1.7,1.1-3.4,1.3-5.2c0.3-2-0.1-3.9,0.5-6c0.9-3.3,1.3-6.8,1.6-10.2c0.3-3.6,0.7-7.3-0.2-10.9c-0.2-0.8-0.5-1.6-0.7-2.4c-0.3-1.1-0.4-2.4-1-3.3c-0.6-0.8-1.6-1.7-2.6-1.8c-1.4-0.2-2.8,0.5-4.2,0.6c-0.7,0-1.8-0.1-2.2-0.6c-0.6-0.8-0.9-1.9-1.1-3s-1.2-2.4-2.2-2.4s-2.2,0.6-2.9-0.7c0-0.1-0.8,0.1-1.1,0.3c-0.2,0.1-0.4,0.5-0.8,1.2c-0.3-0.7-0.5-1.1-0.5-1.5c0.1-2.1-0.1-2.3-2.1-2.2c-0.1-0.3-0.1-0.6-0.2-0.9c-0.6-1.9-2.4-2.8-4.2-2.1c-0.3,0.1-0.8,0.2-1,0c-0.7-0.6-1.5-1-1.4-2.3c0.1-1.6-0.5-2-2-1.8c-1.9,0.3-2.1,0.1-1.9-1.9c0.1-1.5-0.6-2.9-1.9-3.3c0.2,1,0.5,1.9,0.4,2.7c-0.1,0.8-0.6,1.6-1.1,2.7c-0.3-0.4-0.7-0.8-0.7-1.1c0-1,0.2-2.1,0.4-3.1c0.2-1.3-0.1-1.6-1.3-1.6c-0.5,0-1.2-0.3-1.3-0.6c-0.5-1.5-2.1-1.6-3-2.5s-2,0.1-2.9,0c-2.1-0.2-4,0.3-5.8,1.4c-1.6,1-3.5,1.7-4.4,3.7c-0.8-0.5-1.1-0.2-1.2,0.6c0,0.3-0.2,0.8-0.5,1c-1.8,1.4-3.8,2.7-5.4,4.2c-3.2,3.1-6.3,6.3-9.5,9.5c-1.4,1.4-2.7,3-4.1,4.5c-0.9,0.9-1.9,1.8-2.7,2.7c-1.4,1.5-2.8,3.1-4.3,4.7c-0.5,0.6-1,0.7-1.6,0c-0.9-1.1-1.9-2.2-3-3.3c-1.3-1.3-2.7-1.3-4.4-0.8c-1.2,0.3-2.5,0.4-3.7,0.3c-0.3,0-0.6-1.1-0.9-1.6c-0.1-0.2-0.4-0.2-0.5-0.4c-0.2-0.3-0.3-0.6-0.4-0.8c-0.2-0.4-0.4-1-0.7-1.2c-0.9-0.4-2-0.6-2.9-1c-0.4-0.1-0.8-0.3-1-0.5c-0.4-0.5-0.7-1.3-1.2-1.4s-1.2,0.3-1.9,0.6c-0.7-0.8-1.6-1.7-2.3-2.7c-1-1.5-2.6-1.7-4.1-1.8c-1-0.1-1.6-0.4-2-1.1c-0.9-1.6-2.2-2.3-3.9-2.8c-0.5-0.2-1.2-0.5-1.4-1c-1-1.9-2.9-2.7-4.3-4.2c-0.9-0.9-1.8-1.7-2.8-2.5c-0.9-0.8-1.9-1.5-2.8-2.2c-0.2-0.1-0.5,0.1-0.8,0.1c0.1,0.2,0.1,0.5,0.2,0.7c0.1,0.2,0.2,0.3,0.4,0.4c-0.2,0.1-0.3,0.2-0.4,0.2c-0.2,0-0.5,0-0.8,0c-2.7-0.3-5.2-0.1-7.4,1.7c-0.2,0.2-0.5,0.2-0.8,0.4c-1.8,0.9-3.3,2.2-4.3,4c-0.6-0.7-1.1-0.4-1.5,0.4c-0.1,0.3-0.6,0.4-0.8,0.7c-0.7,0.6-1.8,1-2.1,1.7c-0.5,1-1.1,1.7-2,2.3c-1.6,1.2-2.9,3-5,3.6c-0.8,0.2-1.7,0.8-2.1,1.5c-0.8,1.6-2.2,2.6-3.5,3.8c-1.4,1.3-2.8,2.5-4,3.9c-1,1-1.1,1.1-1.8-0.2c-0.7-1.3-1.4-2.6-2.2-3.8c-0.5-0.9-1.3-1.1-2.2-0.5s-1.8,1.2-2.6,1.8c-1.7-0.4-3.2-2.3-4.9-0.2c-1-1.3-1-1.3-2.3-0.1c-1.8-3.2-4.7-4-8.1-3.7c-0.7,0.1-1.4,0.2-2,0.1c-0.6-0.1-1.2-0.3-1.8-0.6c-2.1-1.1-4.1-2.5-6.5-1.1c-0.1,0.1-0.2,0-0.4,0c-0.1-0.1-0.2-0.3-0.2-0.4c-0.2-1-0.9-1.6-1.9-1.5s-1.1,1-1.1,1.9v0.1c-0.3,0.3-0.5,0.6-0.8,0.8c-0.2-0.3-0.6-0.6-0.7-0.9c-0.1-0.5,0-1,0-1.5c0.2-1.1,0-1.9-1.6-1.5c0.3-2-0.9-3.3-1.9-4.7c-0.6-0.8-1-0.8-1.7,0c-0.1,0.2-0.3,0.4-0.5,0.6c-0.8-0.7-1.7-1-1.1-2.4c0.3-0.6,0-1.7-0.4-2.2s-1.4-0.5-2.2-0.5c-0.2,0-0.4,0.9-0.5,1.5c-0.2,1-0.3,2-0.5,3.1c-0.1,0.4-0.3,0.8-0.4,1.2c-0.4,2.6-0.9,5.3-1.3,8c-0.5,3.2-0.8,6.4-1.3,9.6c-0.3,1.9,0.2,3.9-0.9,5.7c-0.1,0.2,0.1,0.7,0.1,1c0,0.5,0.2,1,0,1.4c-0.4,1.6-0.8,3.2-0.9,5c-0.1,3.1-0.7,6.2-1.1,9.3c-0.2,1.2-0.2,2.5-0.3,3.7c0,0.3-0.1,0.6-0.1,0.9c-0.7,2.5-1.4,4.9-1.3,7.5c0,0.3-0.1,0.6-0.1,0.9c-0.3,1.9-0.6,3.8-0.9,5.7c-0.5,3.6-1,7.1-1.6,10.7c-0.4,2.3-0.8,4.5-1.2,6.8c-0.4,3-0.8,5.9-1.1,8.9c-0.2,1.9-0.5,3.7-0.8,5.6c-0.4,2.8-1,5.5-1.4,8.3c-0.5,3.6-1,7.2-1.5,10.9c-0.3,2.2-0.5,4.4-0.8,6.6c-0.4,2.5-1.1,5-1.5,7.5c-0.5,2.7-0.7,5.5-1.1,8.3c-0.2,1.7-0.6,3.3-0.9,4.9c-0.4,1.9-0.8,3.9-1.1,5.8c-0.2,1.5-0.2,3-0.4,4.5c-0.3,2.8-0.7,5.6-1.1,8.4c-0.1,1-0.5,1.9-0.7,2.9c-0.3,1.9-0.3,3.8-0.6,5.6c-0.4,2.8-1,5.6-1.5,8.4c-0.6,2.9-1.2,5.8-1.8,8.8c-0.6,3.4-1.1,6.9-1.6,10.4c-0.2,1.4-0.4,2.9-0.6,4.3c-0.3,1.9-0.6,3.7-1.1,5.5c-1.1,3.6-1,7.4-2.1,11.1c-0.4,1.2-0.1,2.8,0.3,4.1c0.7,2.2,1.7,4.3,4.3,5c1.1,0.3,2,1.3,3.3,0.8c0.1,0,0.3,0.2,0.4,0.3c0.5,0.1,0.9,0.2,1.4,0.3c0.3,0.1,0.7,0,1,0.1c1.9,1.1,4,1,6,1.1c0.4,0,0.9,0.2,1.3,0.5c0.9,0.6,1.7,1.4,2.9,1.2c0.2,0,0.6,0.1,0.8,0.3c1,1,2.1,1.2,3.4,0.6c0.3-0.1,0.7-0.4,0.9-0.3c2.2,0.9,4.8,0.8,6.4,2.8c0.2,0.2,0.7,0.2,1,0.1c0.3-0.1,0.6-0.4,0.9-0.5c1.1-0.3,1.3-0.8,0.7-1.8c-0.7-1.2-0.5-1.7,0.6-2.4c0.2,1.1,0.9,1.3,1.8,1c0.3,0.4,0.4,0.9,0.7,1.1c1,0.6,0.9,1.3,0.6,2.2c-0.4,1.2,0.2,1.7,1.2,1.9c0.8,0.2,1.6,0.3,2.4,0.4c0.5,0,1-0.3,1.5-0.4c-0.2-0.4-0.4-0.9-0.6-1.3c0.4-1,0.8-2.1,0.7-3.1c-0.2-1.4,0.1-3,1.1-3.8c0.8-0.6,1.6-1.1,2.4-1.7c-0.1,1.3-0.2,2.6-0.2,4c0,0.6,0.1,1.4,0.4,1.6c0.5,0.4,1.4,0.6,2,0.4c0.5-0.2,0.9-1.1,1-1.7c0.4-1.8,0.4-3.8,0.9-5.5c1.1-3.7,1.7-7.5,2.3-11.3c0.4-2.6,0.8-5.2,1.3-7.8c0.2-1.2,0.5-2.4,0.7-3.6c0.1-1-0.1-2.1,0.8-3c0.2-0.1,0.1-0.5,0.1-0.8c0-0.5,0-1,0-1.5c0.4-2.4,0.9-4.7,1.3-7.1c0.2-1,0.2-2,0.4-3c0.4-1.6,0.9-3.2,1.3-4.8c0.5-2,0.9-4,1.1-6.1c0.3-2.7,0.8-5.5,1.2-8.2c0.3-1.9,0.5-3.9,0.9-5.8c0.4-2.1,1-4.1,1.6-6.1c0.1-0.3,0.3-0.5,0.5-0.7c0.5-0.9,1.2-1.7,1.3-2.6c0.3-4.1,2.9-7.4,3.6-11.3c0-0.1,0.1-0.2,0.2-0.3c0.5-1.1,0.9-2.2,1.3-3.2c0.3-0.7,0.6-1.5,1-2.2c0.3-0.6,0.8-1.2,0.9-1.8c0.4-2,1-4,2.1-5.7c0.2-0.3,0.2-0.6,0.3-1c0.2-1.9,1-3.6,2.2-5c0.2-0.3,0.5-0.5,0.6-0.8c0.4-1,0.8-2,1.1-3c0.7-1.7,1.3-3.4,2.4-5c1.1-1.6,1.5-3.6,2.4-5.4c0.7-1.6,1.5-3.2,2.4-4.8c1-1.9,2.2-3.8,3.3-5.8c0.5-0.8,0.9-1.7,1.4-2.5c0.6-1,1.2-2,1.8-3c1.7-2.5,2.1-5.9,5.5-7c0.4-0.1,0.7-0.7,1-1.1c0.2-0.2,0.3-0.4,0.5-0.6c0.3,0.5,0.5,0.9,1,1.7c1.4-2.2,2.6-4.1,3.8-6c0.8-1.4,1.6-2.8,2.5-4.1c0.5-0.7,1.2-1.3,2.1-2.3c0.2,1.2,0.7,2.3,0.4,2.8c-1.4,2.3,0.3,5.1-1.4,7.3v0.1c-0.2,2-0.3,4.1-0.6,6.1c-0.1,0.8-0.5,1.6-0.6,2.4c-0.5,2.8-0.8,5.6-1.3,8.3c-0.5,2.5-1,5-1.5,7.5c-0.2,0.9-0.6,1.9-0.6,2.8c-0.1,1.9-0.5,3.7-1.2,5.5c-0.2,0.4-0.1,1-0.2,1.5c-0.4,2.6-0.9,5.2-1.4,7.8c-0.3,1.4-0.7,2.7-1,4c-0.4,1.9-0.8,3.8-1.2,5.7c-0.5,2.8-1.9,5.4-1.8,8.3c0,0.4-0.1,0.8-0.2,1.1c-0.4,1.2-1,2.4-1.2,3.7c-0.3,2.3-1.7,4.4-1.6,6.8c0,0.3-0.2,0.6-0.3,0.9c-0.2,0.7-0.4,1.4-0.6,2c-0.5,1.3-0.7,2.6-1,3.9c-0.5,2.7-1.4,5.3-2.1,7.9c-0.3,1.2-0.5,2.5-0.8,3.7c-0.2,0.9-0.6,1.8-0.8,2.7c-0.4,1.7-0.8,3.4-1.2,5.1c-0.6,2.3-1.2,4.7-1.7,7c-0.2,0.7,0.1,1.5,0,2.2c-0.6,2.4,0.9,4.1,1.7,6c0.1,0.2,0.3,0.3,0.5,0.4c1.5,0.6,3.1,1.3,4.6,1.9c0.2,0.1,0.4-0.2,0.7-0.2c1.2,0,2.5-0.1,3.6,0.1c1,0.2,1.9,0.7,2.9,1.1c0.1,0.2,0.1,0.7,0.4,1c0.1,0.1,0.8-0.1,1.1-0.3c1.1-0.9,2.6-0.6,3.2,0.7c0.8,1.7,0.8,1.7,2.3,0.7c0.1-0.1,0.2-0.1,0.5-0.1c0.9,1,1.8,2,2.7,3.1c0.1-0.3,0.1-0.6,0.2-1c1.8-0.2,2.7-1.2,2.8-3c0-0.8,1.1-1.4,1.3-1c0.4,1.2,2.5,1.7,1.4,3.5c-0.1,0.2,0.4,0.9,0.6,1.3c0.4-0.2,0.8-0.4,1.2-0.7c0.2-0.2,0.5-0.7,0.4-0.9c-1.1-1.9,0.5-2.3,1.6-3.2c0.9-0.8,1.5-2,2.3-3c0.2-0.2,0.4-0.4,0.8-0.7c0,0.5,0.1,0.6,0.1,0.8c-0.2,1.1,0.6,1.5,1.4,1.8c1,0.4,1.1-0.4,1.4-1c0.3-0.5,0.5-1,0.9-1.4c0.6-0.6,0.7-1.2,0.6-2.1c-0.1-0.6,0.2-1.3,0.5-1.8c0.5-0.9,0.9-1.7,0.5-2.8c-0.1-0.5,0-1,0.2-1.5c0.2-0.6,0.6-1.1,0.7-1.7c0.5-2.1,0.9-4.3,1.4-6.4c0-0.2,0.1-0.3,0.2-0.5c0.4-1.1,0.9-2.3,1.2-3.4c0.6-2,1-4.1,1.6-6.1c0.7-2.3,1.6-4.6,2.3-6.9c0.6-1.9,1.1-3.8,1.7-5.7c0.8-2.7,1.8-5.3,2.7-8c0.2-0.5,0.3-1,0.5-1.4c0.6-1.5,1.3-3,1.8-4.6c0.6-1.9,1-3.9,1.6-5.9c0.1-0.4,0.5-0.9,0.9-1c1.1-0.4,1.3-1.2,1.5-2.1c0.5-1.5,1.1-3,1.5-4.5c0.3-1.2,0.4-2.4,0.6-3.6c0-0.1,0-0.2,0.1-0.4c0.3,0.1,0.6,0.1,0.8,0.2c0.5-1.3,0.9-2.5,1.4-3.7c0.2-0.6,0.3-1.3,0.7-1.7c1.5-1.2,1.6-2.9,2-4.5c0.5-1.8,1.1-3.5,1.7-5.2c0-0.1,0.2-0.2,0.2-0.3c0.2-0.6,0.5-1.1,0.7-1.7c0.2-0.4,0.3-0.8,0.5-1.3c0.4-1.1,0.9-2.3,1.3-3.4c0.2-0.6,0.4-1.2,0.7-1.7c0.9-1.5,1.8-3,2.7-4.5c0.4-0.6,0.9-1.2,1.2-1.9c0.5-0.9,0.8-1.8,1.3-2.7c0.2-0.5,0.4-1,0.7-1.4c0.4-0.6,1-1.1,1.4-1.8c0.6-1.2,1.6-2,1.8-3.5c0.2-1.1,1.2-2.2,1.8-3.2c0.1,0.1,0.2,0.1,0.3,0.2c0.1,0.4,0.1,0.8,0.2,1.3c0.6-0.2,1-0.3,1.5-0.5c0.1,0.1,0.2,0.2,0.3,0.3c-1.5,2.4-2.9,4.9-3.7,7.7c1.6-0.2,0.7-2.4,2.4-2.8c-0.1,0.6-0.1,0.8-0.1,1.1c0,0.2,0.2,0.6,0.3,0.6c0.3,0,0.6-0.1,0.8-0.2c0.8-1.2,1.5-2.4,2.2-3.7c0.7-1.2,1.2-2.5,1.9-3.7c1.1-1.9,2.5-3.6,3.6-5.6c0.8-1.5,2.1-2.6,2.8-4.3c0.8-2.1,2.5-3.9,3.9-5.9c0.7-1,1.3-2,2-3.1c0.6,1,0.3,2-0.2,2.8c-1.8,3.4-3.6,6.9-5.5,10.2c-1,1.8-2.4,3.4-3.4,5.3c-1.4,2.7-2.7,5.5-3.9,8.3c-0.4,0.9-0.8,2-0.8,3c0,0.7,0.2,1.1-0.7,1.2c-0.2,0-0.5,0.4-0.5,0.6s0.4,0.6,0.5,0.5c0.6-0.2,1.5-0.3,1.8-0.7c0.6-0.8,0.6-2,1.2-2.6c1.1-1.1,1.4-2.6,2.1-3.8c1.5-2.4,2.9-4.9,4.5-7.3c0.4-0.7,1.1-1.3,1.7-2.1c0.7,2.1-0.5,3.8-0.8,5.5c-0.2,1.4-0.9,2.6-1.2,4c-0.8,3.9-1.6,7.8-2.4,11.7c-0.6,2.5-1.3,5-1.9,7.6c-0.4,1.8-0.6,3.6-1.2,5.3c-0.5,1.4-1,2.7-1.3,4.2c-0.6,3.4-1.6,6.7-2.4,10c-0.2,0.9-0.7,1.8-0.8,2.8c-0.1,1.2-0.3,2.2-1.2,3.1c-0.2,0.2-0.2,0.7-0.2,1c0.1,1.5,0,2.9-0.9,4.2c-0.3,0.4-0.3,0.9-0.4,1.4s-0.1,1-0.2,1.5c-0.6,2.3-1.2,4.6-1.7,7c-0.5,2.2-1,4.3-1.5,6.5c-0.4,1.7-0.9,3.5-1.2,5.2c-0.3,1.5-0.5,3.1-0.9,4.6c-0.7,3-1.5,5.9-2.2,8.9c-0.2,1,0,2.2-0.3,3.1c-1.3,3.6-1.4,7.3-1.9,11c-0.2,1.9-0.4,3.8-0.7,5.6c-0.1,0.4-0.2,0.9-0.2,1.3c0,1.5,0,3.1,0.1,4.6c0.1,1.9,0.1,3.8,0.5,5.7c0.3,1.6,1,3.1,1.7,4.6c0.5,1,1.3,2.2,2.2,2.7c1.1,0.6,2.5,0.8,3.8,1s2.6,0.1,3.8,0.3c0.5,0.1,1,0.4,1.5,0.6c0.2,0.1,0.4,0.5,0.6,0.6c1.7,0.9,3.5,1.2,5.4,1.5c1.8,0.4,3.5,1,5.3,1.4c1.3,0.3,2.8,0.7,4,0.4c1.9-0.4,3.4-2.1,5.6-1.3c0.1,0,0.3,0,0.5-0.1c1.5-0.7,3.2-1.1,4.2-2.6c0.2-0.3,0.7-0.4,1.1-0.5c1.6-0.1,3.2-0.1,4.8-0.9c1.7-0.8,3.3-1.3,4.2-3.1c0.2-0.4,0.9-0.5,1.4-0.6c0.2,0,0.7,0.4,0.7,0.7c0.4,3.2,2.9,5.7,3.4,8.9c0,0,0.1,0.1,0.2,0.1c0.5-0.7,1-1.3,1.5-2c1.4-2.4,2.9-4.7,4.3-7.1c0.2-0.3,0.2-0.8,0.2-1.2c-0.4,0.2-0.8,0.3-1.1,0.5c-0.7,0.7-1.3,1.5-1.9,2.2c-0.3-0.9-0.5-1.6-0.7-2.4c0.6-0.4,1.2-0.9,1.9-1.4c0-0.1,0-0.2,0-0.3c-0.2-1.2-0.7-2.4,0.9-3.1c0.6-0.3,0.4-1-0.1-1.4c-0.2-0.2-0.4-0.6-0.4-0.8c0.2-1.1,0.8-2,1.8-2.3c0.2,0.5,0.4,1,0.6,1.5c0.1,0.4,0.1,0.8,0.1,1.2c0,0.4,0,0.8-0.1,1.2c0.4-0.3,1.2-0.5,1.2-0.8c0.2-1,0.2-1.9,1.2-2.5c0.2-0.1,0.2-0.9,0-1.2c-0.6-0.9-0.1-1.3,0.7-1.5c2.2-0.8,3.4-2.2,4-4.5s1.6-4.6,2.5-6.9c0.1,0.1,0.2,0.2,0.3,0.3c0.5,0,1,0,1.5,0c-0.2-0.5-0.4-1-0.6-1.5c-0.1-0.1-0.3-0.1-0.4-0.2c0.6-0.5,1.1-1,1.7-1.4c0.7-0.5,1.6-0.9,2.3-1.6c1.8-1.7,3.6-3.4,5.4-5.2c0.8-0.8,1.7-1.6,2.4-2.5c0.8-1,1.5-2,2.2-3c0.2-0.3,0.7-0.5,1-0.8c0.1,0.1,0.2,0.2,0.3,0.2c-0.2,0.4-0.2,0.9-0.5,1.3c-1.5,1.7-3,3.4-4.5,5.2c-0.7,0.8-1.2,1.8-1.8,2.7c0.1,0.1,0.3,0.2,0.4,0.3c0.6-0.7,1.3-1.3,1.7-2.1c0.5-1,1.2-1.5,2.2-2c0.6-0.3,1-0.9,1.4-1.4c0.5-0.5,0.7-1.3,1.2-1.7c1.1-1,1.9-2.1,2.4-3.5c0.3-0.7,1-1.3,1.5-2c0.6-0.8,1.3-0.9,2.2-0.4c-0.9-1.1-0.9-1.6,0-2.6C361.4,465.8,362.4,464.8,362.3,463.3c0.4-0.4,1-0.6,1.3-1.1c0.8-1.2,1.5-2.4,2.2-3.7c0.1-0.3,0-0.7,0-1.1c-0.3,0.2-0.7,0.3-0.8,0.5c-0.9,1.2-1.7,2.5-2.4,3.8C362.3,462.1,362.4,462.7,362.3,463.3z M271.7,402c0.1,0.1,0.3,0.2,0.4,0.2c-0.9,1.9-1.9,3.9-2.7,5.7c-0.5-0.2-0.9-0.5-1.4-0.6c-0.1,0-0.5,0.5-0.5,0.6c0.2,0.4,0.6,0.8,1,1.2c-0.3,0.7-0.7,1.4-1.2,2.3c-0.8-0.9-1.1-0.5-1.4,0.3c-0.4,1-0.9,1.9-1.2,2.9c-0.2,0.6-0.3,1.3-0.5,2c0.1,0,0.3-0.1,0.4-0.1c0.2,0.3,0.5,0.6,0.7,0.8c0.2,0.2,0.4,0.4,0.6,0.3c0.2-0.1,0.4-0.3,0.4-0.6c0.1-0.4-0.1-1,0-1.1c1-0.7,0.3-1.2-0.2-1.7c0.8-0.6,1.6-1.1,2.1-1.8c1.6-2.3,1.9-5.3,4-7.4v-0.1c1.1-3.7,3-6.9,5.1-10.1c0.2-0.3,0.1-0.7,0.1-1.1c-0.4,0.1-1,0.1-1.2,0.4c-0.4,0.5-0.7,1.2-1,1.8c-0.3,0.5-0.4,1.2-1.3,0.6c-0.2-0.1-0.7,0.3-1.1,0.5c0,0.1,0.1,0.2,0.1,0.3c0.3,0.1,0.7,0.1,1.1,0.2c-0.1,0.4-0.2,0.7-0.4,1.1c-1.1-1.1-1.4-0.6-1.8,0.5c-0.6,1.4-1.4,2.8-2.1,4.1c-0.2,0.4-0.3,0.9-0.4,1.3c0.1,0,0.2,0.1,0.4,0.1C270.4,404,271.1,403,271.7,402z M346.5,482.7c-0.4,0.2-0.7,0.3-1,0.5c-1.2,0.8-2.4,1.7-3.6,2.6c-0.5,0.4-0.9,1-1.3,1.5c-0.1,0.1-0.1,0.5,0,0.7c0.1,0.1,0.5,0.2,0.7,0.2c0.3-0.1,0.6-0.3,0.9-0.5c1.3-1,2.6-2.1,4-3.1C346.7,484.1,346.8,483.6,346.5,482.7z M366.7,455.3c0.1,0.1,0.3,0.2,0.4,0.3c0.5-0.4,1.1-0.6,1.4-1.1c0.7-1.1,1.4-2.3,2-3.4c0.1-0.2-0.1-0.8-0.2-0.8c-0.3-0.1-0.8,0-1,0.2c-0.5,0.7-1,1.4-1.4,2.1C367.5,453.5,367.1,454.4,366.7,455.3z M363.1,392.3c1.3,0.2,3.2-1.2,3.4-2.7c0.1-0.5-0.2-1.1-0.3-1.6c-0.5,0.3-1.2,0.5-1.4,1C364.1,390,363.6,391.1,363.1,392.3z M374.8,417.8c-0.3-0.4-0.4-0.8-0.7-1c-0.2-0.1-0.7,0.2-0.8,0.5c-0.5,1.1-1,2.2-1.4,3.3c-0.1,0.2,0.1,0.6,0.3,0.8c0.1,0.1,0.6,0,0.7-0.2C373.5,420.2,374.1,419,374.8,417.8z M327.5,417.1c-0.2,1.4-0.5,2.6-0.6,3.9c0,0.3,0.3,0.6,0.4,0.9c0.3-0.2,0.8-0.3,0.9-0.6c0.2-0.7,0.3-1.5,0.5-2.2C328.7,418.4,328.8,417.5,327.5,417.1z M371.1,444.5c0.4-0.3,0.5-0.3,0.6-0.5c0.8-1,1.5-2,2.3-3c0.1-0.1,0-0.5,0-0.7c-0.3,0-0.6,0-0.8,0.1c-0.8,0.9-1.6,1.9-2.3,2.9C370.7,443.6,370.9,444,371.1,444.5z M260.7,423.6c0.2,0.5,0.3,0.9,0.4,1.1c0,0.1,0.5,0,0.5-0.1c0.5-1.1,1.1-2.2,1.5-3.3c0.1-0.2-0.2-0.5-0.4-0.7c-0.1-0.1-0.5,0.1-0.6,0.2C261.7,421.7,261.2,422.7,260.7,423.6z M274.1,392.2c-0.1,0-0.2-0.1-0.3-0.1c-0.3,0.5-0.6,0.9-0.8,1.5c-0.1,0.3,0.1,0.7,0.1,1.1c0.4-0.2,0.9-0.4,1-0.7C274.2,393.4,274.1,392.8,274.1,392.2z M330,407.2c1-1,1-2.4,0-3.4C330,405,330,406,330,407.2z M143.1,537.4c-0.1,0-0.3-0.1-0.4-0.1c-0.3,0.5-0.6,1-0.8,1.6c-0.1,0.3,0.4,0.6,0.6,0.9c0.2-0.2,0.6-0.4,0.7-0.7C143.3,538.6,143.2,538,143.1,537.4z M278.7,400.4c-0.1,0-0.2,0-0.2-0.1c-0.4,0.4-0.8,0.8-1.1,1.3c-0.1,0.2,0.1,0.5,0.2,0.8c0.2-0.1,0.6-0.2,0.7-0.3C278.5,401.5,278.6,401,278.7,400.4z M371.4,430.1c-0.5-0.3-0.8-0.7-0.9-0.6c-0.3,0.1-0.6,0.4-0.8,0.6c0.2,0.2,0.4,0.6,0.6,0.6C370.6,430.7,370.9,430.4,371.4,430.1z M324.6,431c0.1,0.1,0.2,0.2,0.4,0.3c0.3-0.3,0.7-0.6,0.8-0.9c0.1-0.2-0.3-0.6-0.4-0.9c-0.1,0-0.2,0-0.4,0.1C324.9,430.1,324.7,430.5,324.6,431z"/><path class="st0" d="M350.7,472.7c0.1-0.3,0.1-0.6,0.2-0.8c0.5-0.7,1.1-1.2,1.5-2c0.4-0.7,0.4-1.5,0.8-2.1c0.3-0.7,0.7-1.4,1.3-1.8c1.2-0.9,1.7-2,2-3.4c0.1-0.4,0.3-0.8,0.5-1.5c0.2,0.8,0.4,1.2,0.5,1.8c0.4-0.2,0.8-0.4,1.1-0.5c0.1,0.1,0.1,0.1,0.2,0.2c-2.5,3.5-5.1,7-7.6,10.4C351.1,472.9,350.9,472.8,350.7,472.7z"/><path class="st0" d="M365.6,447.1c0.6,0.2,1.1,0.3,1.9,0.5c-0.6,1.1-1.3,2.2-1.8,3.2c-0.5,1.1-0.9,2.2-1.4,3.4c-0.7-0.2-1.3-0.4-2-0.6C363.4,451.5,364.4,449.3,365.6,447.1z"/><path class="st0" d="M251.6,430.2c0,0.6,0.1,1.1,0,1.7c0,0.5-0.2,0.9-0.3,1.3c-0.2,1.6-0.4,3.1-0.7,4.7c-0.1,0.3-0.5,0.6-0.8,0.7c-0.2,0-0.6-0.4-0.7-0.7c-0.1-0.4-0.2-1.1,0.1-1.3c0.9-0.8,0.2-2.1,1.3-3c0.5-0.4,0.3-1.7,0.4-2.6c0-0.3,0.1-0.5,0.2-0.8C251.3,430.2,251.4,430.2,251.6,430.2z"/><path class="st0" d="M242.9,456.7c-0.6-1.4-0.1-2.6,0.2-3.8c0.3-1.2,0.8-2.5,1.3-3.6c0.1-0.3,0.5-0.5,0.8-0.8c0.2,0.3,0.4,0.6,0.4,0.9c0,0.7-0.1,1.5-0.4,2.1C244.6,453.2,243.8,454.9,242.9,456.7z"/><path class="st0" d="M341.6,348.2c0.6-1.3-1-2.3-0.1-3.6c0.1-0.2,0-0.7-0.1-1c-0.6-1.6-0.1-2.6,1.5-3.4c0,0.1,0.1,0.2,0.1,0.2c-0.8,0.8-0.9,1.5-0.4,2.6c0.3,0.7,0,1.7-0.1,2.6s-0.4,1.7-0.6,2.5C341.9,348.2,341.7,348.2,341.6,348.2z"/><path class="st0" d="M287.3,375c1-3.3,3.6-5.6,5.5-8.5C293,367.4,289.3,373.3,287.3,375z"/><path class="st0" d="M277.5,390.5c1.4-2.4,2.7-4.9,4.1-7.3c0.1-0.2,0.5-0.1,1.2-0.3c-1.7,2.8-3.2,5.4-4.7,7.9C277.9,390.7,277.7,390.6,277.5,390.5z"/><path class="st0" d="M361.6,448.3c0.3-2.3,1.5-4.1,2.9-6.1c0.7,1.3,0.6,2.1-0.2,2.9c-0.8,0.8-1.8,1.5-1.9,2.8c0,0.2-0.3,0.4-0.5,0.5C361.8,448.4,361.7,448.4,361.6,448.3z"/><path class="st0" d="M241,463.2c-0.7-1.9,0.1-3.4,0.4-4.8c0-0.2,0.5-0.4,0.8-0.4c0.1,0,0.4,0.4,0.4,0.7c0,0.3,0,0.7-0.1,1C242,460.8,241.5,461.8,241,463.2z"/><path class="st0" d="M247.2,442.2c-0.1,1.4-0.1,2.8-0.3,4.3c-0.1,1-0.8,1-1.6,0.6c0.5-1.7,1.1-3.3,1.6-4.9C247,442.1,247.1,442.2,247.2,442.2z"/><path class="st0" d="M282.7,382.2c0.9-1.4-0.8-3,0.6-4.3c0.4,0.8,1,1.5,1,2.2c0,0.8-0.6,1.5-0.9,2.3C283.2,382.3,283,382.2,282.7,382.2z"/><path class="st0" d="M320.3,422.5c-0.1,0.8-0.1,1.6-0.2,2.4c0,0.2-0.4,0.6-0.6,0.6s-0.6-0.3-0.7-0.6c-0.4-1.2,0.5-1.8,1.2-2.6C320,422.4,320.1,422.5,320.3,422.5z"/><path class="st0" d="M179.2,423.7c-0.6-1.3,0.3-2.3,0.7-3.4C180.4,421.8,180.2,422.8,179.2,423.7z"/><path class="st0" d="M317.9,441.8c0.1-0.9,0.2-1.7,0.3-2.6C319.6,440.3,319.5,441.1,317.9,441.8z"/><path class="st0" d="M256.4,416.6c-0.4,1.2-0.9,2.5-1.3,3.7c-0.1,0-0.2-0.1-0.3-0.1c0.3-1.3,0.7-2.6,1-3.8C256,416.5,256.2,416.5,256.4,416.6z"/><path class="st0" d="M282.1,380.6c-0.7,0.9-1.3,1.8-2,2.7c-0.1-0.1-0.2-0.2-0.3-0.2c0.6-0.9,1.2-1.9,1.8-2.8C281.8,380.4,282,380.5,282.1,380.6z"/><path class="st0" d="M286.8,376.7c-0.6,0.8-1.3,1.5-1.9,2.3c-0.1-0.1-0.3-0.2-0.4-0.3c0.6-0.8,1.2-1.5,1.9-2.3C286.6,376.5,286.7,376.6,286.8,376.7z"/><path class="st0" d="M177.7,430.6c-0.3,0.7-0.5,1.3-0.8,2c-0.2-0.1-0.4-0.1-0.6-0.2c0.3-0.7,0.5-1.3,0.8-2C177.4,430.5,177.5,430.5,177.7,430.6z"/><path class="st0" d="M295.5,363.8c-0.5,0.7-0.8,1.2-1.2,1.9C293.8,364.2,294,363.9,295.5,363.8z"/><path class="st0" d="M358.2,459.5c0.6-0.4,1.1-0.8,1.9-1.3C359.2,460.2,359.2,460.2,358.2,459.5z"/><path class="st0" d="M254.4,422.9c-0.1,0.5-0.2,1-0.3,1.5l-0.5-0.1c0.1-0.5,0.1-1,0.2-1.6C254,422.8,254.2,422.8,254.4,422.9z"/><path class="st0" d="M333.4,387.3c0.1-0.7,0.1-1.3,0.3-1.8c0.1-0.2,0.4-0.3,0.6-0.5c0.1,0.3,0.3,0.6,0.2,0.8C334.2,386.3,333.9,386.7,333.4,387.3z"/><path class="st0" d="M349.9,474.4c-0.4,0.8-0.8,1.6-1.3,2.4c-0.1-0.1-0.3-0.1-0.4-0.2c0.4-0.8,0.9-1.6,1.3-2.3C349.7,474.2,349.8,474.3,349.9,474.4z"/><path class="st0" d="M249.4,315.8c0.3,0.4,0.5,0.6,0.7,0.8c-0.2,0.2-0.5,0.6-0.7,0.5c-0.2,0-0.5-0.4-0.6-0.6C248.9,316.3,249.2,316.1,249.4,315.8z"/><path class="st0" d="M365.2,436.7c0.5-0.6,0.9-1.3,1.4-1.9c0.1,0.1,0.2,0.1,0.3,0.2c-0.4,0.7-0.8,1.4-1.1,2C365.5,436.9,365.3,436.8,365.2,436.7z"/></g></svg></div></a> <ul class="nav-items"> <li class="work-nav-item"><a href="/#work" class="smooth-scroll">Our Work</a></li><li class="clients-nav-item"><a href="/#clients" class="smooth-scroll">Our Clients</a></li><li class="process-nav-item"><a href="/#process" class="smooth-scroll">What we do</a></li><li class="blog-nav-item"><a href="/#team">The Team</a></li><li class="contact-nav-item show-contact-modal"><button class="unstyled">Get in Touch</button></li></ul> <button class="mobile-nav-burger"> <div class="burger-3d-container"> <div class="burger-3d-object"><div class="front"><?xml version="1.0" encoding="utf-8"?><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="-843 1214.7 32 32" style="enable-background:new -843 1214.7 32 32;" xml:space="preserve"><style type="text/css">.st0{fill:#FFFFFF;}</style><path class="st0" d="M-835.8,1226.3h17.6c0.8,0,1.5-0.7,1.5-1.5c0-0.8-0.7-1.5-1.5-1.5h-17.6c-0.8,0-1.5,0.7-1.5,1.5C-837.3,1225.6-836.6,1226.3-835.8,1226.3z M-818.2,1229.2h-17.6c-0.8,0-1.5,0.7-1.5,1.5s0.7,1.5,1.5,1.5h17.6c0.8,0,1.5-0.7,1.5-1.5S-817.4,1229.2-818.2,1229.2z M-818.2,1235.1h-17.6c-0.8,0-1.5,0.7-1.5,1.5s0.7,1.5,1.5,1.5h17.6c0.8,0,1.5-0.7,1.5-1.5S-817.4,1235.1-818.2,1235.1z M-811,1230.7c0,8.8-7.2,16-16,16s-16-7.2-16-16s7.2-16,16-16S-811,1221.9-811,1230.7z"/></svg> </div><div class="back"><?xml version="1.0" encoding="utf-8"?><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="-1124 1619.6 32 32" style="enable-background:new -1124 1619.6 32 32;" xml:space="preserve"><style type="text/css">.st0{fill:#FFFFFF;}</style><path class="st0" d="M-1108,1619.6c-8.8,0-16,7.2-16,16s7.2,16,16,16s16-7.2,16-16S-1099.2,1619.6-1108,1619.6z M-1098.5,1642.4c0.5,0.5,0.5,1.3,0,1.8s-1.3,0.5-1.8,0l-7.2-7.2l0,0l-7.2,7.2c-0.5,0.5-1.3,0.5-1.8,0s-0.5-1.3,0-1.8l7.2-7.2l-7.2-7.2c-0.5-0.5-0.5-1.3,0-1.8l0,0c0.5-0.5,1.3-0.5,1.8,0l7.2,7.2l7.2-7.2c0.5-0.5,1.3-0.5,1.8,0s0.5,1.3,0,1.8l-7.2,7.2L-1098.5,1642.4z"/></svg> </div></div></div></button> </nav></div>';

  zepto(function() {
    zepto('.splash, section, .section, .nav-please').prepend(navHTML);
  });

}());

},{"zepto-browserify":"/Users/tribbleb/Sites/make-us-proud-site/node_modules/zepto-browserify/zepto.js"}],"/Users/tribbleb/Sites/make-us-proud-site/js/src/_navSelectScroll.js":[function(require,module,exports){
var $ = require('zepto-browserify').$;
var animatedScrollTo = require('animated-scrollto');

var scrollMargin = 5;

$(function(){
    $('nav a[href]').on('click', function(){
      var menuHeight = document.querySelector('nav.main').offsetHeight;
      var url = this.getAttribute('href');
      var target = ~url.indexOf('#') ? $(url.substring(url.indexOf('#'))) : null;

      if(target){
        animatedScrollTo(document.body, target.offset().top - menuHeight - scrollMargin, 1000);
        // Broadcast and event to let anything know a nav selection has happaned (this is used to close the menu on mobile)
        $(document.body).trigger('nav:selected');
        event.preventDefault();
      }
    });
});

},{"animated-scrollto":"/Users/tribbleb/Sites/make-us-proud-site/node_modules/animated-scrollto/animatedScrollTo.js","zepto-browserify":"/Users/tribbleb/Sites/make-us-proud-site/node_modules/zepto-browserify/zepto.js"}],"/Users/tribbleb/Sites/make-us-proud-site/js/src/_playOnScroll.js":[function(require,module,exports){
var raf = require('raf');
var zepto = require('zepto-browserify').Zepto;
var $$ = document.querySelectorAll.bind(document);

var scrollPos = 0;
var windowHeight = window.innerHeight;

var triggeredElements = [];

// play video on scroll
(function() {
  var playVideoOnScroll = function(element) {
    var elementPos;

    function tick() {
      scrollPos = window.pageYOffset;
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

},{"raf":"/Users/tribbleb/Sites/make-us-proud-site/node_modules/raf/index.js","zepto-browserify":"/Users/tribbleb/Sites/make-us-proud-site/node_modules/zepto-browserify/zepto.js"}],"/Users/tribbleb/Sites/make-us-proud-site/js/src/_scaleProcessAnimation.js":[function(require,module,exports){
var zepto = require('zepto-browserify').Zepto;

// resize index process diagram
zepto(function() {
  var elProcessDiagram = zepto('#whatwedobanner_hype_container');
  var maxWidth = window.innerWidth * 0.9;
  var diagramWidth = 735;

  if (elProcessDiagram.length > 0) {
    var scaleProcessDiagram = function() {
      if (maxWidth < diagramWidth * 1.2) {
        var proportionalScale = maxWidth / diagramWidth;
        elProcessDiagram.css({
          '-moz-transform'    : 'scale('+proportionalScale+')',
          '-webkit-transform' : 'scale('+proportionalScale+')',
          '-ms-transform'     : 'scale('+proportionalScale+')',
          '-o-transform'      : 'scale('+proportionalScale+')',
          'transform'         : 'scale('+proportionalScale+')'
        });
      }
    };

    scaleProcessDiagram();
    window.addEventListener('resize', scaleProcessDiagram);
  }
});

},{"zepto-browserify":"/Users/tribbleb/Sites/make-us-proud-site/node_modules/zepto-browserify/zepto.js"}],"/Users/tribbleb/Sites/make-us-proud-site/js/src/_splitCardSpacer.js":[function(require,module,exports){
var zepto = require('zepto-browserify').Zepto;

module.exports = (function() {
  zepto(function() {
    var elSplitCard = zepto('.split-card-to-space');

    if (elSplitCard.length > 0) {
      var elBeforeSplitCard = zepto('.split-card-before');
      var elAfterSplitCard = zepto('.split-card-after');
      var cardHeight;

      var spaceElements = function() {
        cardHeight = elSplitCard.height();
        if (window.matchMedia('(min-width: 750px)').matches) {
          elBeforeSplitCard.height(cardHeight / 2);
          elAfterSplitCard.height(cardHeight / 2);
        } else {
          elBeforeSplitCard.height(0);
          elAfterSplitCard.height(cardHeight);
        }
      };

      spaceElements();

      window.addEventListener('resize', spaceElements);
    }
  });
}());

},{"zepto-browserify":"/Users/tribbleb/Sites/make-us-proud-site/node_modules/zepto-browserify/zepto.js"}],"/Users/tribbleb/Sites/make-us-proud-site/js/src/_toggleMobileNav.js":[function(require,module,exports){
var zepto = require('zepto-browserify').Zepto;

// Show and hide mobile nav
zepto(function() {
	var elToggleNav = zepto('.mobile-nav-burger');
	var elNavItems = zepto('nav.main');
	var otherTriggers = zepto('.show-contact-modal button');

	function toggleMobileNav() {
	  elNavItems.toggleClass('shown');
	};

	otherTriggers.on('click', function(){
		zepto(document.body).trigger('nav:selected');
	});

	elToggleNav.on('click', toggleMobileNav);
	// Global event fired by navSelectScroll to hide the nav when on mobile
	zepto(document.body).on('nav:selected', toggleMobileNav);
});

},{"zepto-browserify":"/Users/tribbleb/Sites/make-us-proud-site/node_modules/zepto-browserify/zepto.js"}],"/Users/tribbleb/Sites/make-us-proud-site/js/src/main.js":[function(require,module,exports){
window.zepto = require('zepto-browserify').Zepto;

require('./_navInjection.js');
require('./_detectAutoplay.js');
require('./_navHighlighting.js');
require('./_splitCardSpacer.js');
require('./_scaleProcessAnimation.js');
require('./_toggleMobileNav.js');
require('./_contactModal.js');
require('./_contactForm.js');
require('./_navSelectScroll');
require('./_animateOnScroll.js');
require('./_playOnScroll.js');
require('./_hypeOnScroll.js');
require('./_animateOnLoad.js');
require('./_geniacAnimateHeader.js');

},{"./_animateOnLoad.js":"/Users/tribbleb/Sites/make-us-proud-site/js/src/_animateOnLoad.js","./_animateOnScroll.js":"/Users/tribbleb/Sites/make-us-proud-site/js/src/_animateOnScroll.js","./_contactForm.js":"/Users/tribbleb/Sites/make-us-proud-site/js/src/_contactForm.js","./_contactModal.js":"/Users/tribbleb/Sites/make-us-proud-site/js/src/_contactModal.js","./_detectAutoplay.js":"/Users/tribbleb/Sites/make-us-proud-site/js/src/_detectAutoplay.js","./_geniacAnimateHeader.js":"/Users/tribbleb/Sites/make-us-proud-site/js/src/_geniacAnimateHeader.js","./_hypeOnScroll.js":"/Users/tribbleb/Sites/make-us-proud-site/js/src/_hypeOnScroll.js","./_navHighlighting.js":"/Users/tribbleb/Sites/make-us-proud-site/js/src/_navHighlighting.js","./_navInjection.js":"/Users/tribbleb/Sites/make-us-proud-site/js/src/_navInjection.js","./_navSelectScroll":"/Users/tribbleb/Sites/make-us-proud-site/js/src/_navSelectScroll.js","./_playOnScroll.js":"/Users/tribbleb/Sites/make-us-proud-site/js/src/_playOnScroll.js","./_scaleProcessAnimation.js":"/Users/tribbleb/Sites/make-us-proud-site/js/src/_scaleProcessAnimation.js","./_splitCardSpacer.js":"/Users/tribbleb/Sites/make-us-proud-site/js/src/_splitCardSpacer.js","./_toggleMobileNav.js":"/Users/tribbleb/Sites/make-us-proud-site/js/src/_toggleMobileNav.js","zepto-browserify":"/Users/tribbleb/Sites/make-us-proud-site/node_modules/zepto-browserify/zepto.js"}],"/Users/tribbleb/Sites/make-us-proud-site/node_modules/animated-scrollto/animatedScrollTo.js":[function(require,module,exports){
(function (window) {
    var requestAnimFrame = (function(){return window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||function(callback){window.setTimeout(callback,1000/60);};})();

    var easeInOutQuad = function (t, b, c, d) {
        t /= d/2;
        if (t < 1) return c/2*t*t + b;
        t--;
        return -c/2 * (t*(t-2) - 1) + b;
    };

    var animatedScrollTo = function (element, to, duration, callback) {
        var start = element.scrollTop,
        change = to - start,
        animationStart = +new Date();
        var animating = true;
        var lastpos = null;

        var animateScroll = function() {
            if (!animating) {
                return;
            }
            requestAnimFrame(animateScroll);
            var now = +new Date();
            var val = Math.floor(easeInOutQuad(now - animationStart, start, change, duration));
            if (lastpos) {
                if (lastpos === element.scrollTop) {
                    lastpos = val;
                    element.scrollTop = val;
                } else {
                    animating = false;
                }
            } else {
                lastpos = val;
                element.scrollTop = val;
            }
            if (now > animationStart + duration) {
                element.scrollTop = to;
                animating = false;
                if (callback) { callback(); }
            }
        };
        requestAnimFrame(animateScroll);
    };

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = animatedScrollTo;
    } else {
        window.animatedScrollTo = animatedScrollTo;
    }
})(window);

},{}],"/Users/tribbleb/Sites/make-us-proud-site/node_modules/bowser/bowser.js":[function(require,module,exports){
/*!
  * Bowser - a browser detector
  * https://github.com/ded/bowser
  * MIT License | (c) Dustin Diaz 2015
  */

!function (name, definition) {
  if (typeof module != 'undefined' && module.exports) module.exports = definition()
  else if (typeof define == 'function' && define.amd) define(definition)
  else this[name] = definition()
}('bowser', function () {
  /**
    * See useragents.js for examples of navigator.userAgent
    */

  var t = true

  function detect(ua) {

    function getFirstMatch(regex) {
      var match = ua.match(regex);
      return (match && match.length > 1 && match[1]) || '';
    }

    function getSecondMatch(regex) {
      var match = ua.match(regex);
      return (match && match.length > 1 && match[2]) || '';
    }

    var iosdevice = getFirstMatch(/(ipod|iphone|ipad)/i).toLowerCase()
      , likeAndroid = /like android/i.test(ua)
      , android = !likeAndroid && /android/i.test(ua)
      , chromeBook = /CrOS/.test(ua)
      , edgeVersion = getFirstMatch(/edge\/(\d+(\.\d+)?)/i)
      , versionIdentifier = getFirstMatch(/version\/(\d+(\.\d+)?)/i)
      , tablet = /tablet/i.test(ua)
      , mobile = !tablet && /[^-]mobi/i.test(ua)
      , result

    if (/opera|opr/i.test(ua)) {
      result = {
        name: 'Opera'
      , opera: t
      , version: versionIdentifier || getFirstMatch(/(?:opera|opr)[\s\/](\d+(\.\d+)?)/i)
      }
    }
    else if (/yabrowser/i.test(ua)) {
      result = {
        name: 'Yandex Browser'
      , yandexbrowser: t
      , version: versionIdentifier || getFirstMatch(/(?:yabrowser)[\s\/](\d+(\.\d+)?)/i)
      }
    }
    else if (/windows phone/i.test(ua)) {
      result = {
        name: 'Windows Phone'
      , windowsphone: t
      }
      if (edgeVersion) {
        result.msedge = t
        result.version = edgeVersion
      }
      else {
        result.msie = t
        result.version = getFirstMatch(/iemobile\/(\d+(\.\d+)?)/i)
      }
    }
    else if (/msie|trident/i.test(ua)) {
      result = {
        name: 'Internet Explorer'
      , msie: t
      , version: getFirstMatch(/(?:msie |rv:)(\d+(\.\d+)?)/i)
      }
    } else if (chromeBook) {
      result = {
        name: 'Chrome'
      , chromeBook: t
      , chrome: t
      , version: getFirstMatch(/(?:chrome|crios|crmo)\/(\d+(\.\d+)?)/i)
      }
    } else if (/chrome.+? edge/i.test(ua)) {
      result = {
        name: 'Microsoft Edge'
      , msedge: t
      , version: edgeVersion
      }
    }
    else if (/chrome|crios|crmo/i.test(ua)) {
      result = {
        name: 'Chrome'
      , chrome: t
      , version: getFirstMatch(/(?:chrome|crios|crmo)\/(\d+(\.\d+)?)/i)
      }
    }
    else if (iosdevice) {
      result = {
        name : iosdevice == 'iphone' ? 'iPhone' : iosdevice == 'ipad' ? 'iPad' : 'iPod'
      }
      // WTF: version is not part of user agent in web apps
      if (versionIdentifier) {
        result.version = versionIdentifier
      }
    }
    else if (/sailfish/i.test(ua)) {
      result = {
        name: 'Sailfish'
      , sailfish: t
      , version: getFirstMatch(/sailfish\s?browser\/(\d+(\.\d+)?)/i)
      }
    }
    else if (/seamonkey\//i.test(ua)) {
      result = {
        name: 'SeaMonkey'
      , seamonkey: t
      , version: getFirstMatch(/seamonkey\/(\d+(\.\d+)?)/i)
      }
    }
    else if (/firefox|iceweasel/i.test(ua)) {
      result = {
        name: 'Firefox'
      , firefox: t
      , version: getFirstMatch(/(?:firefox|iceweasel)[ \/](\d+(\.\d+)?)/i)
      }
      if (/\((mobile|tablet);[^\)]*rv:[\d\.]+\)/i.test(ua)) {
        result.firefoxos = t
      }
    }
    else if (/silk/i.test(ua)) {
      result =  {
        name: 'Amazon Silk'
      , silk: t
      , version : getFirstMatch(/silk\/(\d+(\.\d+)?)/i)
      }
    }
    else if (android) {
      result = {
        name: 'Android'
      , version: versionIdentifier
      }
    }
    else if (/phantom/i.test(ua)) {
      result = {
        name: 'PhantomJS'
      , phantom: t
      , version: getFirstMatch(/phantomjs\/(\d+(\.\d+)?)/i)
      }
    }
    else if (/blackberry|\bbb\d+/i.test(ua) || /rim\stablet/i.test(ua)) {
      result = {
        name: 'BlackBerry'
      , blackberry: t
      , version: versionIdentifier || getFirstMatch(/blackberry[\d]+\/(\d+(\.\d+)?)/i)
      }
    }
    else if (/(web|hpw)os/i.test(ua)) {
      result = {
        name: 'WebOS'
      , webos: t
      , version: versionIdentifier || getFirstMatch(/w(?:eb)?osbrowser\/(\d+(\.\d+)?)/i)
      };
      /touchpad\//i.test(ua) && (result.touchpad = t)
    }
    else if (/bada/i.test(ua)) {
      result = {
        name: 'Bada'
      , bada: t
      , version: getFirstMatch(/dolfin\/(\d+(\.\d+)?)/i)
      };
    }
    else if (/tizen/i.test(ua)) {
      result = {
        name: 'Tizen'
      , tizen: t
      , version: getFirstMatch(/(?:tizen\s?)?browser\/(\d+(\.\d+)?)/i) || versionIdentifier
      };
    }
    else if (/safari/i.test(ua)) {
      result = {
        name: 'Safari'
      , safari: t
      , version: versionIdentifier
      }
    }
    else {
      result = {
        name: getFirstMatch(/^(.*)\/(.*) /),
        version: getSecondMatch(/^(.*)\/(.*) /)
     };
   }

    // set webkit or gecko flag for browsers based on these engines
    if (!result.msedge && /(apple)?webkit/i.test(ua)) {
      result.name = result.name || "Webkit"
      result.webkit = t
      if (!result.version && versionIdentifier) {
        result.version = versionIdentifier
      }
    } else if (!result.opera && /gecko\//i.test(ua)) {
      result.name = result.name || "Gecko"
      result.gecko = t
      result.version = result.version || getFirstMatch(/gecko\/(\d+(\.\d+)?)/i)
    }

    // set OS flags for platforms that have multiple browsers
    if (!result.msedge && (android || result.silk)) {
      result.android = t
    } else if (iosdevice) {
      result[iosdevice] = t
      result.ios = t
    }

    // OS version extraction
    var osVersion = '';
    if (result.windowsphone) {
      osVersion = getFirstMatch(/windows phone (?:os)?\s?(\d+(\.\d+)*)/i);
    } else if (iosdevice) {
      osVersion = getFirstMatch(/os (\d+([_\s]\d+)*) like mac os x/i);
      osVersion = osVersion.replace(/[_\s]/g, '.');
    } else if (android) {
      osVersion = getFirstMatch(/android[ \/-](\d+(\.\d+)*)/i);
    } else if (result.webos) {
      osVersion = getFirstMatch(/(?:web|hpw)os\/(\d+(\.\d+)*)/i);
    } else if (result.blackberry) {
      osVersion = getFirstMatch(/rim\stablet\sos\s(\d+(\.\d+)*)/i);
    } else if (result.bada) {
      osVersion = getFirstMatch(/bada\/(\d+(\.\d+)*)/i);
    } else if (result.tizen) {
      osVersion = getFirstMatch(/tizen[\/\s](\d+(\.\d+)*)/i);
    }
    if (osVersion) {
      result.osversion = osVersion;
    }

    // device type extraction
    var osMajorVersion = osVersion.split('.')[0];
    if (tablet || iosdevice == 'ipad' || (android && (osMajorVersion == 3 || (osMajorVersion == 4 && !mobile))) || result.silk) {
      result.tablet = t
    } else if (mobile || iosdevice == 'iphone' || iosdevice == 'ipod' || android || result.blackberry || result.webos || result.bada) {
      result.mobile = t
    }

    // Graded Browser Support
    // http://developer.yahoo.com/yui/articles/gbs
    if (result.msedge ||
        (result.msie && result.version >= 10) ||
        (result.yandexbrowser && result.version >= 15) ||
        (result.chrome && result.version >= 20) ||
        (result.firefox && result.version >= 20.0) ||
        (result.safari && result.version >= 6) ||
        (result.opera && result.version >= 10.0) ||
        (result.ios && result.osversion && result.osversion.split(".")[0] >= 6) ||
        (result.blackberry && result.version >= 10.1)
        ) {
      result.a = t;
    }
    else if ((result.msie && result.version < 10) ||
        (result.chrome && result.version < 20) ||
        (result.firefox && result.version < 20.0) ||
        (result.safari && result.version < 6) ||
        (result.opera && result.version < 10.0) ||
        (result.ios && result.osversion && result.osversion.split(".")[0] < 6)
        ) {
      result.c = t
    } else result.x = t

    return result
  }

  var bowser = detect(typeof navigator !== 'undefined' ? navigator.userAgent : '')

  bowser.test = function (browserList) {
    for (var i = 0; i < browserList.length; ++i) {
      var browserItem = browserList[i];
      if (typeof browserItem=== 'string') {
        if (browserItem in bowser) {
          return true;
        }
      }
    }
    return false;
  }

  /*
   * Set our detect method to the main bowser object so we can
   * reuse it to test other user agents.
   * This is needed to implement future tests.
   */
  bowser._detect = detect;

  return bowser
});

},{}],"/Users/tribbleb/Sites/make-us-proud-site/node_modules/browserify/node_modules/process/browser.js":[function(require,module,exports){
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
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
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

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],"/Users/tribbleb/Sites/make-us-proud-site/node_modules/domready/ready.js":[function(require,module,exports){
/*!
  * domready (c) Dustin Diaz 2014 - License MIT
  */
!function (name, definition) {

  if (typeof module != 'undefined') module.exports = definition()
  else if (typeof define == 'function' && typeof define.amd == 'object') define(definition)
  else this[name] = definition()

}('domready', function () {

  var fns = [], listener
    , doc = document
    , hack = doc.documentElement.doScroll
    , domContentLoaded = 'DOMContentLoaded'
    , loaded = (hack ? /^loaded|^c/ : /^loaded|^i|^c/).test(doc.readyState)


  if (!loaded)
  doc.addEventListener(domContentLoaded, listener = function () {
    doc.removeEventListener(domContentLoaded, listener)
    loaded = 1
    while (listener = fns.shift()) listener()
  })

  return function (fn) {
    loaded ? setTimeout(fn, 0) : fns.push(fn)
  }

});

},{}],"/Users/tribbleb/Sites/make-us-proud-site/node_modules/raf/index.js":[function(require,module,exports){
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

},{"performance-now":"/Users/tribbleb/Sites/make-us-proud-site/node_modules/raf/node_modules/performance-now/lib/performance-now.js"}],"/Users/tribbleb/Sites/make-us-proud-site/node_modules/raf/node_modules/performance-now/lib/performance-now.js":[function(require,module,exports){
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

},{"_process":"/Users/tribbleb/Sites/make-us-proud-site/node_modules/browserify/node_modules/process/browser.js"}],"/Users/tribbleb/Sites/make-us-proud-site/node_modules/vivus/dist/vivus.js":[function(require,module,exports){
/**
 * vivus - JavaScript library to make drawing animation on SVG
 * @version v0.2.3
 * @link https://github.com/maxwellito/vivus
 * @license MIT
 */

'use strict';

(function (window, document) {

  'use strict';

/**
 * Pathformer
 * Beta version
 *
 * Take any SVG version 1.1 and transform
 * child elements to 'path' elements
 *
 * This code is purely forked from
 * https://github.com/Waest/SVGPathConverter
 */

/**
 * Class constructor
 *
 * @param {DOM|String} element Dom element of the SVG or id of it
 */
function Pathformer(element) {
  // Test params
  if (typeof element === 'undefined') {
    throw new Error('Pathformer [constructor]: "element" parameter is required');
  }

  // Set the element
  if (element.constructor === String) {
    element = document.getElementById(element);
    if (!element) {
      throw new Error('Pathformer [constructor]: "element" parameter is not related to an existing ID');
    }
  }
  if (element.constructor instanceof window.SVGElement || /^svg$/i.test(element.nodeName)) {
    this.el = element;
  } else {
    throw new Error('Pathformer [constructor]: "element" parameter must be a string or a SVGelement');
  }

  // Start
  this.scan(element);
}

/**
 * List of tags which can be transformed
 * to path elements
 *
 * @type {Array}
 */
Pathformer.prototype.TYPES = ['line', 'ellipse', 'circle', 'polygon', 'polyline', 'rect'];

/**
 * List of attribute names which contain
 * data. This array list them to check if
 * they contain bad values, like percentage. 
 *
 * @type {Array}
 */
Pathformer.prototype.ATTR_WATCH = ['cx', 'cy', 'points', 'r', 'rx', 'ry', 'x', 'x1', 'x2', 'y', 'y1', 'y2'];

/**
 * Finds the elements compatible for transform
 * and apply the liked method
 *
 * @param  {object} options Object from the constructor
 */
Pathformer.prototype.scan = function (svg) {
  var fn, element, pathData, pathDom,
    elements = svg.querySelectorAll(this.TYPES.join(','));
  for (var i = 0; i < elements.length; i++) {
    element = elements[i];
    fn = this[element.tagName.toLowerCase() + 'ToPath'];
    pathData = fn(this.parseAttr(element.attributes));
    pathDom = this.pathMaker(element, pathData);
    element.parentNode.replaceChild(pathDom, element);
  }
};


/**
 * Read `line` element to extract and transform
 * data, to make it ready for a `path` object.
 *
 * @param  {DOMelement} element Line element to transform
 * @return {object}             Data for a `path` element
 */
Pathformer.prototype.lineToPath = function (element) {
  var newElement = {};
  newElement.d = 'M' + element.x1 + ',' + element.y1 + 'L' + element.x2 + ',' + element.y2;
  return newElement;
};

/**
 * Read `rect` element to extract and transform
 * data, to make it ready for a `path` object.
 * The radius-border is not taken in charge yet.
 * (your help is more than welcomed)
 *
 * @param  {DOMelement} element Rect element to transform
 * @return {object}             Data for a `path` element
 */
Pathformer.prototype.rectToPath = function (element) {
  var newElement = {},
    x = parseFloat(element.x) || 0,
    y = parseFloat(element.y) || 0,
    width = parseFloat(element.width) || 0,
    height = parseFloat(element.height) || 0;
  newElement.d  = 'M' + x + ' ' + y + ' ';
  newElement.d += 'L' + (x + width) + ' ' + y + ' ';
  newElement.d += 'L' + (x + width) + ' ' + (y + height) + ' ';
  newElement.d += 'L' + x + ' ' + (y + height) + ' Z';
  return newElement;
};

/**
 * Read `polyline` element to extract and transform
 * data, to make it ready for a `path` object.
 *
 * @param  {DOMelement} element Polyline element to transform
 * @return {object}             Data for a `path` element
 */
Pathformer.prototype.polylineToPath = function (element) {
  var i, path;
  var newElement = {};
  var points = element.points.trim().split(' ');
  
  // Reformatting if points are defined without commas
  if (element.points.indexOf(',') === -1) {
    var formattedPoints = [];
    for (i = 0; i < points.length; i+=2) {
      formattedPoints.push(points[i] + ',' + points[i+1]);
    }
    points = formattedPoints;
  }

  // Generate the path.d value
  path = 'M' + points[0];
  for(i = 1; i < points.length; i++) {
    if (points[i].indexOf(',') !== -1) {
      path += 'L' + points[i];
    }
  }
  newElement.d = path;
  return newElement;
};

/**
 * Read `polygon` element to extract and transform
 * data, to make it ready for a `path` object.
 * This method rely on polylineToPath, because the
 * logic is similar. The path created is just closed,
 * so it needs an 'Z' at the end.
 *
 * @param  {DOMelement} element Polygon element to transform
 * @return {object}             Data for a `path` element
 */
Pathformer.prototype.polygonToPath = function (element) {
  var newElement = Pathformer.prototype.polylineToPath(element);
  newElement.d += 'Z';
  return newElement;
};

/**
 * Read `ellipse` element to extract and transform
 * data, to make it ready for a `path` object.
 *
 * @param  {DOMelement} element ellipse element to transform
 * @return {object}             Data for a `path` element
 */
Pathformer.prototype.ellipseToPath = function (element) {
  var startX = element.cx - element.rx,
      startY = element.cy;
  var endX = parseFloat(element.cx) + parseFloat(element.rx),
      endY = element.cy;

  var newElement = {};
  newElement.d = 'M' + startX + ',' + startY +
                 'A' + element.rx + ',' + element.ry + ' 0,1,1 ' + endX + ',' + endY +
                 'A' + element.rx + ',' + element.ry + ' 0,1,1 ' + startX + ',' + endY;
  return newElement;
};

/**
 * Read `circle` element to extract and transform
 * data, to make it ready for a `path` object.
 *
 * @param  {DOMelement} element Circle element to transform
 * @return {object}             Data for a `path` element
 */
Pathformer.prototype.circleToPath = function (element) {
  var newElement = {};
  var startX = element.cx - element.r,
      startY = element.cy;
  var endX = parseFloat(element.cx) + parseFloat(element.r),
      endY = element.cy;
  newElement.d =  'M' + startX + ',' + startY +
                  'A' + element.r + ',' + element.r + ' 0,1,1 ' + endX + ',' + endY +
                  'A' + element.r + ',' + element.r + ' 0,1,1 ' + startX + ',' + endY;
  return newElement;
};

/**
 * Create `path` elements form original element
 * and prepared objects
 *
 * @param  {DOMelement} element  Original element to transform
 * @param  {object} pathData     Path data (from `toPath` methods)
 * @return {DOMelement}          Path element
 */
Pathformer.prototype.pathMaker = function (element, pathData) {
  var i, attr, pathTag = document.createElementNS('http://www.w3.org/2000/svg','path');
  for(i = 0; i < element.attributes.length; i++) {
    attr = element.attributes[i];
    if (this.ATTR_WATCH.indexOf(attr.name) === -1) {
      pathTag.setAttribute(attr.name, attr.value);
    }
  }
  for(i in pathData) {
    pathTag.setAttribute(i, pathData[i]);
  }
  return pathTag;
};

/**
 * Parse attributes of a DOM element to
 * get an object of attribute => value
 *
 * @param  {NamedNodeMap} attributes Attributes object from DOM element to parse
 * @return {object}                  Object of attributes
 */
Pathformer.prototype.parseAttr = function (element) {
  var attr, output = {};
  for (var i = 0; i < element.length; i++) {
    attr = element[i];
    // Check if no data attribute contains '%', or the transformation is impossible
    if (this.ATTR_WATCH.indexOf(attr.name) !== -1 && attr.value.indexOf('%') !== -1) {
      throw new Error('Pathformer [parseAttr]: a SVG shape got values in percentage. This cannot be transformed into \'path\' tags. Please use \'viewBox\'.');
    }
    output[attr.name] = attr.value;
  }
  return output;
};

  'use strict';

var requestAnimFrame, cancelAnimFrame, parsePositiveInt;

/**
 * Vivus
 * Beta version
 *
 * Take any SVG and make the animation
 * to give give the impression of live drawing
 *
 * This in more than just inspired from codrops
 * At that point, it's a pure fork.
 */

/**
 * Class constructor
 * option structure
 *   type: 'delayed'|'async'|'oneByOne'|'script' (to know if the item must be drawn asynchronously or not, default: delayed)
 *   duration: <int> (in frames)
 *   start: 'inViewport'|'manual'|'autostart' (start automatically the animation, default: inViewport)
 *   delay: <int> (delay between the drawing of first and last path)
 *   dashGap <integer> whitespace extra margin between dashes
 *   pathTimingFunction <function> timing animation function for each path element of the SVG
 *   animTimingFunction <function> timing animation function for the complete SVG
 *   forceRender <boolean> force the browser to re-render all updated path items
 *   selfDestroy <boolean> removes all extra styling on the SVG, and leaves it as original
 *
 * The attribute 'type' is by default on 'delayed'.
 *  - 'delayed'
 *    all paths are draw at the same time but with a
 *    little delay between them before start
 *  - 'async'
 *    all path are start and finish at the same time
 *  - 'oneByOne'
 *    only one path is draw at the time
 *    the end of the first one will trigger the draw
 *    of the next one
 *
 * All these values can be overwritten individually
 * for each path item in the SVG
 * The value of frames will always take the advantage of
 * the duration value.
 * If you fail somewhere, an error will be thrown.
 * Good luck.
 *
 * @constructor
 * @this {Vivus}
 * @param {DOM|String}   element  Dom element of the SVG or id of it
 * @param {Object}       options  Options about the animation
 * @param {Function}     callback Callback for the end of the animation
 */
function Vivus (element, options, callback) {

  // Setup
  this.isReady = false;
  this.setElement(element, options);
  this.setOptions(options);
  this.setCallback(callback);

  if (this.isReady) {
    this.init();
  }
}

/**
 * Timing functions
 ************************************** 
 * 
 * Default functions to help developers.
 * It always take a number as parameter (between 0 to 1) then
 * return a number (between 0 and 1)
 */
Vivus.LINEAR          = function (x) {return x;};
Vivus.EASE            = function (x) {return -Math.cos(x * Math.PI) / 2 + 0.5;};
Vivus.EASE_OUT        = function (x) {return 1 - Math.pow(1-x, 3);};
Vivus.EASE_IN         = function (x) {return Math.pow(x, 3);};
Vivus.EASE_OUT_BOUNCE = function (x) {
  var base = -Math.cos(x * (0.5 * Math.PI)) + 1,
    rate = Math.pow(base,1.5),
    rateR = Math.pow(1 - x, 2),
    progress = -Math.abs(Math.cos(rate * (2.5 * Math.PI) )) + 1;
  return (1- rateR) + (progress * rateR);
};


/**
 * Setters
 **************************************
 */

/**
 * Check and set the element in the instance
 * The method will not return anything, but will throw an
 * error if the parameter is invalid
 *
 * @param {DOM|String}   element  SVG Dom element or id of it
 */
Vivus.prototype.setElement = function (element, options) {
  // Basic check
  if (typeof element === 'undefined') {
    throw new Error('Vivus [constructor]: "element" parameter is required');
  }

  // Set the element
  if (element.constructor === String) {
    element = document.getElementById(element);
    if (!element) {
      throw new Error('Vivus [constructor]: "element" parameter is not related to an existing ID');
    }
  }
  this.parentEl = element;

  // Create the object element if the property `file` exists in the options object
  if (options && options.file) {
    var objElm = document.createElement('object');
    objElm.setAttribute('type', 'image/svg+xml');
    objElm.setAttribute('data', options.file);
    objElm.setAttribute('width', '100%');
    objElm.setAttribute('height', '100%');
    element.appendChild(objElm);
    element = objElm;
  }

  switch (element.constructor) {
  case window.SVGSVGElement:
  case window.SVGElement:
    this.el = element;
    this.isReady = true;
    break;

  case window.HTMLObjectElement:
    // If the Object is already loaded
    this.el = element.contentDocument && element.contentDocument.querySelector('svg');
    if (this.el) {
      this.isReady = true;
      return;
    }

    // If we have to wait for it
    var self = this;
    element.addEventListener('load', function () {
      self.el = element.contentDocument && element.contentDocument.querySelector('svg');
      if (!self.el) {
        throw new Error('Vivus [constructor]: object loaded does not contain any SVG');
      }
      else {
        self.isReady = true;
        self.init();
      }
    });
    break;

  default:
    throw new Error('Vivus [constructor]: "element" parameter is not valid (or miss the "file" attribute)');
  }
};

/**
 * Set up user option to the instance
 * The method will not return anything, but will throw an
 * error if the parameter is invalid
 *
 * @param  {object} options Object from the constructor
 */
Vivus.prototype.setOptions = function (options) {
  var allowedTypes = ['delayed', 'async', 'oneByOne', 'scenario', 'scenario-sync'];
  var allowedStarts =  ['inViewport', 'manual', 'autostart'];

  // Basic check
  if (options !== undefined && options.constructor !== Object) {
    throw new Error('Vivus [constructor]: "options" parameter must be an object');
  }
  else {
    options = options || {};
  }

  // Set the animation type
  if (options.type && allowedTypes.indexOf(options.type) === -1) {
    throw new Error('Vivus [constructor]: ' + options.type + ' is not an existing animation `type`');
  }
  else {
    this.type = options.type || allowedTypes[0];
  }

  // Set the start type
  if (options.start && allowedStarts.indexOf(options.start) === -1) {
    throw new Error('Vivus [constructor]: ' + options.start + ' is not an existing `start` option');
  }
  else {
    this.start = options.start || allowedStarts[0];
  }

  this.isIE        = (window.navigator.userAgent.indexOf('MSIE') !== -1 || window.navigator.userAgent.indexOf('Trident/') !== -1 || window.navigator.userAgent.indexOf('Edge/') !== -1 );
  this.duration    = parsePositiveInt(options.duration, 120);
  this.delay       = parsePositiveInt(options.delay, null);
  this.dashGap     = parsePositiveInt(options.dashGap, 2);
  this.forceRender = options.hasOwnProperty('forceRender') ? !!options.forceRender : this.isIE;
  this.selfDestroy = !!options.selfDestroy;
  this.onReady     = options.onReady;

  this.ignoreInvisible = options.hasOwnProperty('ignoreInvisible') ? !!options.ignoreInvisible : false;

  this.animTimingFunction = options.animTimingFunction || Vivus.LINEAR;
  this.pathTimingFunction = options.pathTimingFunction || Vivus.LINEAR;

  if (this.delay >= this.duration) {
    throw new Error('Vivus [constructor]: delay must be shorter than duration');
  }
};

/**
 * Set up callback to the instance
 * The method will not return enything, but will throw an
 * error if the parameter is invalid
 *
 * @param  {Function} callback Callback for the animation end
 */
Vivus.prototype.setCallback = function (callback) {
  // Basic check
  if (!!callback && callback.constructor !== Function) {
    throw new Error('Vivus [constructor]: "callback" parameter must be a function');
  }
  this.callback = callback || function () {};
};


/**
 * Core
 **************************************
 */

/**
 * Map the svg, path by path.
 * The method return nothing, it just fill the
 * `map` array. Each item in this array represent
 * a path element from the SVG, with informations for
 * the animation.
 *
 * ```
 * [
 *   {
 *     el: <DOMobj> the path element
 *     length: <number> length of the path line
 *     startAt: <number> time start of the path animation (in frames)
 *     duration: <number> path animation duration (in frames)
 *   },
 *   ...
 * ]
 * ```
 *
 */
Vivus.prototype.mapping = function () {
  var i, paths, path, pAttrs, pathObj, totalLength, lengthMeter, timePoint;
  timePoint = totalLength = lengthMeter = 0;
  paths = this.el.querySelectorAll('path');

  for (i = 0; i < paths.length; i++) {
    path = paths[i];
    if (this.isInvisible(path)) {
      continue;
    }
    pathObj = {
      el: path,
      length: Math.ceil(path.getTotalLength())
    };
    // Test if the path length is correct
    if (isNaN(pathObj.length)) {
      if (window.console && console.warn) {
        console.warn('Vivus [mapping]: cannot retrieve a path element length', path);
      }
      continue;
    }
    totalLength += pathObj.length;
    this.map.push(pathObj);
    path.style.strokeDasharray  = pathObj.length + ' ' + (pathObj.length + this.dashGap);
    path.style.strokeDashoffset = pathObj.length;

    // Fix IE glitch
    if (this.isIE) {
      pathObj.length += this.dashGap;
    }
    this.renderPath(i);
  }

  totalLength = totalLength === 0 ? 1 : totalLength;
  this.delay = this.delay === null ? this.duration / 3 : this.delay;
  this.delayUnit = this.delay / (paths.length > 1 ? paths.length - 1 : 1);

  for (i = 0; i < this.map.length; i++) {
    pathObj = this.map[i];

    switch (this.type) {
    case 'delayed':
      pathObj.startAt = this.delayUnit * i;
      pathObj.duration = this.duration - this.delay;
      break;

    case 'oneByOne':
      pathObj.startAt = lengthMeter / totalLength * this.duration;
      pathObj.duration = pathObj.length / totalLength * this.duration;
      break;

    case 'async':
      pathObj.startAt = 0;
      pathObj.duration = this.duration;
      break;

    case 'scenario-sync':
      path = paths[i];
      pAttrs = this.parseAttr(path);
      pathObj.startAt = timePoint + (parsePositiveInt(pAttrs['data-delay'], this.delayUnit) || 0);
      pathObj.duration = parsePositiveInt(pAttrs['data-duration'], this.duration);
      timePoint = pAttrs['data-async'] !== undefined ? pathObj.startAt : pathObj.startAt + pathObj.duration;
      this.frameLength = Math.max(this.frameLength, (pathObj.startAt + pathObj.duration));
      break;

    case 'scenario':
      path = paths[i];
      pAttrs = this.parseAttr(path);
      pathObj.startAt = parsePositiveInt(pAttrs['data-start'], this.delayUnit) || 0;
      pathObj.duration = parsePositiveInt(pAttrs['data-duration'], this.duration);
      this.frameLength = Math.max(this.frameLength, (pathObj.startAt + pathObj.duration));
      break;
    }
    lengthMeter += pathObj.length;
    this.frameLength = this.frameLength || this.duration;
  }
};

/**
 * Interval method to draw the SVG from current
 * position of the animation. It update the value of
 * `currentFrame` and re-trace the SVG.
 *
 * It use this.handle to store the requestAnimationFrame
 * and clear it one the animation is stopped. So this
 * attribute can be used to know if the animation is
 * playing.
 *
 * Once the animation at the end, this method will
 * trigger the Vivus callback.
 *
 */
Vivus.prototype.drawer = function () {
  var self = this;
  this.currentFrame += this.speed;

  if (this.currentFrame <= 0) {
    this.stop();
    this.reset();
    this.callback(this);
  } else if (this.currentFrame >= this.frameLength) {
    this.stop();
    this.currentFrame = this.frameLength;
    this.trace();
    if (this.selfDestroy) {
      this.destroy();
    }
    this.callback(this);
  } else {
    this.trace();
    this.handle = requestAnimFrame(function () {
      self.drawer();
    });
  }
};

/**
 * Draw the SVG at the current instant from the
 * `currentFrame` value. Here is where most of the magic is.
 * The trick is to use the `strokeDashoffset` style property.
 *
 * For optimisation reasons, a new property called `progress`
 * is added in each item of `map`. This one contain the current
 * progress of the path element. Only if the new value is different
 * the new value will be applied to the DOM element. This
 * method save a lot of resources to re-render the SVG. And could
 * be improved if the animation couldn't be played forward.
 *
 */
Vivus.prototype.trace = function () {
  var i, progress, path, currentFrame;
  currentFrame = this.animTimingFunction(this.currentFrame / this.frameLength) * this.frameLength;
  for (i = 0; i < this.map.length; i++) {
    path = this.map[i];
    progress = (currentFrame - path.startAt) / path.duration;
    progress = this.pathTimingFunction(Math.max(0, Math.min(1, progress)));
    if (path.progress !== progress) {
      path.progress = progress;
      path.el.style.strokeDashoffset = Math.floor(path.length * (1 - progress));
      this.renderPath(i);
    }
  }
};

/**
 * Method forcing the browser to re-render a path element
 * from it's index in the map. Depending on the `forceRender`
 * value.
 * The trick is to replace the path element by it's clone.
 * This practice is not recommended because it's asking more
 * ressources, too much DOM manupulation..
 * but it's the only way to let the magic happen on IE.
 * By default, this fallback is only applied on IE.
 * 
 * @param  {Number} index Path index
 */
Vivus.prototype.renderPath = function (index) {
  if (this.forceRender && this.map && this.map[index]) {
    var pathObj = this.map[index],
        newPath = pathObj.el.cloneNode(true);
    pathObj.el.parentNode.replaceChild(newPath, pathObj.el);
    pathObj.el = newPath;
  }
};

/**
 * When the SVG object is loaded and ready,
 * this method will continue the initialisation.
 *
 * This this mainly due to the case of passing an
 * object tag in the constructor. It will wait
 * the end of the loading to initialise.
 * 
 */
Vivus.prototype.init = function () {
  // Set object variables
  this.frameLength = 0;
  this.currentFrame = 0;
  this.map = [];

  // Start
  new Pathformer(this.el);
  this.mapping();
  this.starter();

  if (this.onReady) {
    this.onReady(this);
  }
};

/**
 * Trigger to start of the animation.
 * Depending on the `start` value, a different script
 * will be applied.
 *
 * If the `start` value is not valid, an error will be thrown.
 * Even if technically, this is impossible.
 *
 */
Vivus.prototype.starter = function () {
  switch (this.start) {
  case 'manual':
    return;

  case 'autostart':
    this.play();
    break;

  case 'inViewport':
    var self = this,
    listener = function () {
      if (self.isInViewport(self.parentEl, 1)) {
        self.play();
        window.removeEventListener('scroll', listener);
      }
    };
    window.addEventListener('scroll', listener);
    listener();
    break;
  }
};


/**
 * Controls
 **************************************
 */

/**
 * Get the current status of the animation between
 * three different states: 'start', 'progress', 'end'.
 * @return {string} Instance status
 */
Vivus.prototype.getStatus = function () {
  return this.currentFrame === 0 ? 'start' : this.currentFrame === this.frameLength ? 'end' : 'progress';
};

/**
 * Reset the instance to the initial state : undraw
 * Be careful, it just reset the animation, if you're
 * playing the animation, this won't stop it. But just
 * make it start from start.
 *
 */
Vivus.prototype.reset = function () {
  return this.setFrameProgress(0);
};

/**
 * Set the instance to the final state : drawn
 * Be careful, it just set the animation, if you're
 * playing the animation on rewind, this won't stop it.
 * But just make it start from the end.
 *
 */
Vivus.prototype.finish = function () {
  return this.setFrameProgress(1);
};

/**
 * Set the level of progress of the drawing.
 * 
 * @param {number} progress Level of progress to set
 */
Vivus.prototype.setFrameProgress = function (progress) {
  progress = Math.min(1, Math.max(0, progress));
  this.currentFrame = Math.round(this.frameLength * progress);
  this.trace();
  return this;
};

/**
 * Play the animation at the desired speed.
 * Speed must be a valid number (no zero).
 * By default, the speed value is 1.
 * But a negative value is accepted to go forward.
 *
 * And works with float too.
 * But don't forget we are in JavaScript, se be nice
 * with him and give him a 1/2^x value.
 *
 * @param  {number} speed Animation speed [optional]
 */
Vivus.prototype.play = function (speed) {
  if (speed && typeof speed !== 'number') {
    throw new Error('Vivus [play]: invalid speed');
  }
  this.speed = speed || 1;
  if (!this.handle) {
    this.drawer();
  }
  return this;
};

/**
 * Stop the current animation, if on progress.
 * Should not trigger any error.
 *
 */
Vivus.prototype.stop = function () {
  if (this.handle) {
    cancelAnimFrame(this.handle);
    delete this.handle;
  }
  return this;
};

/**
 * Destroy the instance.
 * Remove all bad styling attributes on all
 * path tags
 *
 */
Vivus.prototype.destroy = function () {
  var i, path;
  for (i = 0; i < this.map.length; i++) {
    path = this.map[i];
    path.el.style.strokeDashoffset = null;
    path.el.style.strokeDasharray = null;
    this.renderPath(i);
  }
};


/**
 * Utils methods
 * include methods from Codrops
 **************************************
 */

/**
 * Method to best guess if a path should added into
 * the animation or not.
 *
 * 1. Use the `data-vivus-ignore` attribute if set
 * 2. Check if the instance must ignore invisible paths
 * 3. Check if the path is visible
 *
 * For now the visibility checking is unstable.
 * It will be used for a beta phase.
 *
 * Other improvments are planned. Like detecting
 * is the path got a stroke or a valid opacity.
 */
Vivus.prototype.isInvisible = function (el) {
  var rect,
    ignoreAttr = el.getAttribute('data-ignore');

  if (ignoreAttr !== null) {
    return ignoreAttr !== 'false';
  }

  if (this.ignoreInvisible) {
    rect = el.getBoundingClientRect();
    return !rect.width && !rect.height;
  }
  else {
    return false;
  }
};

/**
 * Parse attributes of a DOM element to
 * get an object of {attributeName => attributeValue}
 *
 * @param  {object} element DOM element to parse
 * @return {object}         Object of attributes
 */
Vivus.prototype.parseAttr = function (element) {
  var attr, output = {};
  if (element && element.attributes) {
    for (var i = 0; i < element.attributes.length; i++) {
      attr = element.attributes[i];
      output[attr.name] = attr.value;
    }
  }
  return output;
};

/**
 * Reply if an element is in the page viewport
 *
 * @param  {object} el Element to observe
 * @param  {number} h  Percentage of height
 * @return {boolean}
 */
Vivus.prototype.isInViewport = function (el, h) {
  var scrolled   = this.scrollY(),
    viewed       = scrolled + this.getViewportH(),
    elBCR        = el.getBoundingClientRect(),
    elHeight     = elBCR.height,
    elTop        = scrolled + elBCR.top,
    elBottom     = elTop + elHeight;

  // if 0, the element is considered in the viewport as soon as it enters.
  // if 1, the element is considered in the viewport only when it's fully inside
  // value in percentage (1 >= h >= 0)
  h = h || 0;

  return (elTop + elHeight * h) <= viewed && (elBottom) >= scrolled;
};

/**
 * Alias for document element
 *
 * @type {DOMelement}
 */
Vivus.prototype.docElem = window.document.documentElement;

/**
 * Get the viewport height in pixels
 *
 * @return {integer} Viewport height
 */
Vivus.prototype.getViewportH = function () {
  var client = this.docElem.clientHeight,
    inner = window.innerHeight;

  if (client < inner) {
    return inner;
  }
  else {
    return client;
  }
};

/**
 * Get the page Y offset
 *
 * @return {integer} Page Y offset
 */
Vivus.prototype.scrollY = function () {
  return window.pageYOffset || this.docElem.scrollTop;
};

/**
 * Alias for `requestAnimationFrame` or
 * `setTimeout` function for deprecated browsers.
 *
 */
requestAnimFrame = (function () {
  return (
    window.requestAnimationFrame       ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame    ||
    window.oRequestAnimationFrame      ||
    window.msRequestAnimationFrame     ||
    function(/* function */ callback){
      return window.setTimeout(callback, 1000 / 60);
    }
  );
})();

/**
 * Alias for `cancelAnimationFrame` or
 * `cancelTimeout` function for deprecated browsers.
 *
 */
cancelAnimFrame = (function () {
  return (
    window.cancelAnimationFrame       ||
    window.webkitCancelAnimationFrame ||
    window.mozCancelAnimationFrame    ||
    window.oCancelAnimationFrame      ||
    window.msCancelAnimationFrame     ||
    function(id){
      return window.clearTimeout(id);
    }
  );
})();

/**
 * Parse string to integer.
 * If the number is not positive or null
 * the method will return the default value
 * or 0 if undefined
 *
 * @param {string} value String to parse
 * @param {*} defaultValue Value to return if the result parsed is invalid
 * @return {number}
 *
 */
parsePositiveInt = function (value, defaultValue) {
  var output = parseInt(value, 10);
  return (output >= 0) ? output : defaultValue;
};


  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], function() {
      return Vivus;
    });
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = Vivus;
  } else {
    // Browser globals
    window.Vivus = Vivus;
  }

}(window, document));

},{}],"/Users/tribbleb/Sites/make-us-proud-site/node_modules/zepto-browserify/zepto.js":[function(require,module,exports){
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

},{}]},{},["/Users/tribbleb/Sites/make-us-proud-site/js/src/main.js"])


//# sourceMappingURL=main.output.js.map
