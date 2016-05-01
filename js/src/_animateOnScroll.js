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
