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
