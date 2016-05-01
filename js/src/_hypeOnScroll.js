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
