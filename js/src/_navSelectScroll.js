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
