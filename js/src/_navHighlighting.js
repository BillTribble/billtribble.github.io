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
