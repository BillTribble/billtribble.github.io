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
