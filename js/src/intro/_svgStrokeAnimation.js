module.exports = function(selector){
	var path = document.querySelector(selector);
	var length = path.getTotalLength();

	path.style.strokeDasharray = length;
	path.style.strokeDashoffset = length;

	return function trigger(){
		path.style.strokeDashoffset = 0;
	};
};