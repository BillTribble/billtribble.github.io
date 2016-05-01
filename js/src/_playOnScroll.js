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
