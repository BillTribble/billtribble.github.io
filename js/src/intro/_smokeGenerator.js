/* global Elastic Linear Strong */
var THREE = require('three');
var TweenLite = require('../../../node_modules/gsap/src/uncompressed/TweenLite.js');

var freqCount = 0;
var frequency = 1;
var body;
var scene;
var worldCoords;
var smokeRecycle = [];

var flameColours = [
	[250, 129, 70],
	[250, 188, 70],
	[250, 116, 70]
];

var particleGeometry = new THREE.BoxGeometry( 20, 20, 20);

function setSmokeCoords(){
	body.geometry.computeBoundingBox();
	var boundingBox = body.geometry.boundingBox;
	worldCoords = new THREE.Vector3();
	worldCoords.subVectors( boundingBox.max, boundingBox.min );
	worldCoords.multiplyScalar( 0.5 );
	worldCoords.add( boundingBox.min );
	worldCoords.applyMatrix4( body.matrixWorld );
}

function init(targetBody, targetScene){
	flameColours = flameColours.map(function(color){
		return color.map(function(val){
			return val/255;
		});
	});

	body = targetBody;
	scene = targetScene;
	return module.exports;
}

function dropSmoke(s) {

	s.mesh.position.x = worldCoords.x;
	s.mesh.position.y = worldCoords.y;
	s.mesh.position.z = worldCoords.z;
	s.mesh.scale.set(0.1, 0.1, 0.1);

	var enterTime = Math.random() * 0.2 + 0.3;

	TweenLite.to(s.mesh.scale, enterTime, {
		x: Math.random() * 0.8 + 0.7,
		y: Math.random() * 0.8 + 0.7,
		z: Math.random() * 0.8 + 0.7,
		delay: 0.1,
		ease: Elastic.easeOut,
		easeParams: [0.5, 0.3]
	});
	
	TweenLite.to(s.mesh.scale, Math.random() * 0.5 + 0.1, {
		x: 0.1,
		y: 0.1,
		z: 0.1,
		ease: Linear.easeIn,
		onComplete: resetSmoke,
		onCompleteParams:[s],
		delay: enterTime
	});

	var flameColor = flameColours[Math.floor(Math.random() * flameColours.length)];

	TweenLite.set(s.particleMaterial.color, {
		r: 1,
		g: 1,
		b: 1
	});

	TweenLite.to(s.particleMaterial.color, Math.random() * 0.3 + 0.3, {
		r: flameColor[0],
		g: flameColor[1],
		b: flameColor[2],
		delay: 0.2,
		ease: Strong.easeOut
	});
	// debugger
}

function createDroppingWaste(){
	dropSmoke(getSmokeParticle());
}

function getSmokeParticle(){
	return smokeRecycle.length ? smokeRecycle.pop() : new SmokeParticle();
}

function resetSmoke(s){
	s.mesh.position.x = 0;
	s.mesh.position.y = 0;
	s.mesh.position.z = 0;

	s.mesh.rotation.x = Math.random()*Math.PI*2;
	s.mesh.rotation.y = Math.random()*Math.PI*2;
	s.mesh.rotation.z = Math.random()*Math.PI*2;

	s.mesh.scale.set(0.1,0.1,0.1);

	scene.add(s.mesh);
	smokeRecycle.push(s);
}

function SmokeParticle() {
	
	this.particleMaterial = new THREE.MeshBasicMaterial({
		shading: THREE.FlatShading,
		side: THREE.FrontSide
	});

	this.mesh = new THREE.Mesh(particleGeometry, this.particleMaterial);
	resetSmoke(this);
}

function updateSmokeArr(){
	if (freqCount % frequency === 0){
		createDroppingWaste();
	}
	freqCount++;
}

function update(){
	setSmokeCoords();
	updateSmokeArr();
}

module.exports = {
	init: init,
	drop: createDroppingWaste,
	update: update
};