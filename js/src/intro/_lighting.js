var THREE = require('three');

module.exports = function(scene){
	
	var dirLight = new THREE.DirectionalLight( 0xFFFFFF, 0.5);
	dirLight.position.set( 1000, 500, 800);
	
	scene.add( dirLight );

	var dirLight2 = new THREE.DirectionalLight( 0xFFFFFF, 0.6);
	dirLight2.position.set( -1000, 500, 800);

	scene.add( dirLight2 );

	var dirLight3 = new THREE.DirectionalLight( 0xFFFFFF, 0.2);
	dirLight3.position.set( -1000, -200, 800);

	scene.add( dirLight3 );	

	var light = new THREE.AmbientLight( 0x414141, 1 ); // soft white light
	scene.add( light );
};
