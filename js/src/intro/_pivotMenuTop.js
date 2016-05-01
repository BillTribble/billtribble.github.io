var TweenLite = require('../../../node_modules/gsap/src/uncompressed/TweenLite.js');
require('../../../node_modules/gsap/src/uncompressed/plugins/CSSPlugin.js');

var $ = document.querySelector.bind(document);
var domReady = require('domready');

var raf = require('raf');
var scrollPos = window.scrollY;

var el;

var maxAngle = 90;
var minAngle = 70;

function update(){
	raf(update);
	var winHeight = window.innerHeight / 1.3;
	if(scrollPos <= winHeight){
		var angle = scrollPos / winHeight * (maxAngle - minAngle) + minAngle;
		// console.log(angle)
		TweenLite.set(el, {
			rotationX: angle
		});
	}
	scrollPos = window.scrollY;
};

module.exports = function(selector){
	domReady(function(){
		el = $(selector);
		update();
	});
};