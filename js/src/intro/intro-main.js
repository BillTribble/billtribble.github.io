/*global Elastic Strong */

var $ = document.querySelectorAll.bind(document);

var THREE = require('three');

var TweenLite = require('../../../node_modules/gsap/src/uncompressed/TweenLite.js');

require('../../../node_modules/gsap/src/uncompressed/easing/EasePack.js');
require('./_pivotMenuTop.js')('.lip');

var domReady = require('domready');

// var strokeIntro = require('./_svgStrokeAnimation')('.logo-sketch-wrapper path');

var lighting = require('./_lighting.js');
var Rocket = require('./_rocketMesh.js');
var worldMesh = require('./_worldMesh.js');
var rocketPath = require('./_rocketPath.js');
var starsGen = require('./_starsGenerator.js');

var canvasContainer;

var enableSmoke = false;

var cameraParent = new THREE.Object3D();
var rocketParent = new THREE.Object3D();
var lightingParent = new THREE.Object3D();

var rocket = new Rocket();
var rocketPathObj = rocketPath(1000);
var starField = starsGen(10000, 10, 10000);

var scene = new THREE.Scene();

var smokeGenerator = require('./_smokeGenerator.js').init(rocket.bodyMid, scene);

var near = 3;
var far = 10000;

var t = 0;

var renderer = new THREE.WebGLRenderer();
renderer.setClearColor( 0x051923 );

// State objects for animation
var tangent = new THREE.Vector3();
var axis = new THREE.Vector3();
var up = new THREE.Vector3(0, 1, 0);

renderer.setPixelRatio( window.devicePixelRatio );

var camera = new THREE.PerspectiveCamera (
	80,
	window.innerWidth / window.innerHeight,
	near,
	far
);

var globe = worldMesh(camera);

cameraParent.add(camera);
scene.add(cameraParent);

camera.position.z = 1500;
camera.position.y = 0;
camera.rotation.x = 0;
lightingParent.rotation.y = -5.5;
globe.rotation.y = -10;

function animate(){

	globe.scale.x = 0.0001;
	globe.scale.y = 0.0001;
	globe.scale.z = 0.0001;

	rocketParent.scale.x = 0.0001;
	rocketParent.scale.y = 0.0001;
	rocketParent.scale.z = 0.0001;

	starField.scale.x = 0.0001;
	starField.scale.y = 0.0001;
	starField.scale.z = 0.0001;

	TweenLite.to(starField.scale, 10, {
		x: 1,
		y: 1,
		z: 1,
		delay: 1,
		ease: Elastic.easeOut,
		easeParams: [0.3, 0.3]
	});

	TweenLite.to(globe.scale, 8, {
		x: 1,
		y: 1,
		z: 1,
		delay: 1,
		ease: Elastic.easeOut,
		easeParams: [0.3, 0.3]
	});

	TweenLite.to(rocketParent.scale, 1.5, {
		x: 1,
		y: 1,
		z: 1,
		delay: 4,
		ease: Strong.easeOut,
		easeParams: [0.5, 0.3],
		onStart: function(){
			enableSmoke = true;
		}
	});
}

function animateRocket(){

	rocket.rocket.position.copy( rocketPathObj.spline.getPointAt( t ) );
	tangent = rocketPathObj.spline.getTangentAt( t ).normalize();

	axis.crossVectors(up, tangent).normalize();

	var radians = Math.acos(up.dot(tangent));


	rocket.rocket.quaternion.setFromAxisAngle(axis, radians);

	// debugger

	t = t >= 0.997 ? 0 : t += 0.002;
}

function render(){
	requestAnimationFrame( render );

	if(window.scrollY < window.innerHeight){
		globe.rotation.y += 0.0015;
		// rocketPathObj.line.rotation.y += 0.01;
		lightingParent.rotation.y -= 0.002;
		starField.rotation.y += 0.0002;
		// starField.position.z += 1;
		rocketParent.rotation.x += 0.002;
		rocketParent.rotation.z -= 0.001;
		// rocketPathObj.line.rotation.z += 0.01;
		animateRocket();

		camera.position.y = window.scrollY/4;

		if(enableSmoke){
			smokeGenerator.update();	
		}

		renderer.render( scene, camera );	
	}
}

function windowResize(){

	canvasContainer = $('.homepage-header-animation-container')[0];

	var callback = function(){
		renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
		camera.aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
		camera.updateProjectionMatrix();
		if(canvasContainer.clientWidth <= 768){
			camera.position.z = 1800;
		} else if (canvasContainer.clientWidth < 500){
			camera.position.z = 2000;
		}
	};
	window.addEventListener('resize', callback, false);
	// run once to set up the canvas
	callback();
}


/// IT BEGINS

lighting(lightingParent);

rocket.rocket.position.x = 1200;
rocket.rocket.scale.x = 0.5;
rocket.rocket.scale.y = 0.5;
rocket.rocket.scale.z = 0.5;

rocketParent.add( rocket.rocket );

scene.add( lightingParent );

scene.add( rocketParent );
scene.add( starField );
// scene.add( rocketPathObj.line );

scene.add( globe );

scene.fog = new THREE.Fog( 0x000000, 1300, 4000);


// function createPath(){
// 	var elipse = new THREE.EllipseCurve(
// 		0,  0,            // ax, aY
// 		1000, 1000,           // xRadius, yRadius
// 		0,  2 * Math.PI,  // aStartAngle, aEndAngle
// 		true             // aClockwise
// 	);

// 	var material = new THREE.LineBasicMaterial({color : '#FFF'});
// 	var ellipsePath = new THREE.CurvePath();
// 	ellipsePath.add(elipse);
// 	var elipseGeometry = ellipsePath.createPointsGeometry(100);
// 	elipseGeometry.computeTangents();

// 	var line = new THREE.Line(elipseGeometry, material);

// 	scene.add(line);

// 	return elipse;
// }

// var path = createPath();


function play(){
	windowResize();
	
	canvasContainer.appendChild(renderer.domElement);

	animate();
	
	render();
	

	setTimeout(function(){
		$('.intro')[0].classList.remove('intro');
	}, 3300);
};

domReady(play);