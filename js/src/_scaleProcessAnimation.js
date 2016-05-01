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
