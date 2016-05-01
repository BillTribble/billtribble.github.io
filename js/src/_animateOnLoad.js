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
