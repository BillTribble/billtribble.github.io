var THREE = require('three');
var Simplex = require('perlin-simplex');

var simplex = new Simplex();

function heightAtPoint(x,y, strength){
	var mapheight = 10;
	var noisescale = 4;
	var mapheight2 = 20;
	var noisescale2 = 10;
	return simplex.noise(x/noisescale2, y/noisescale2) * mapheight2
		+ simplex.noise(x/noisescale, y/noisescale) * mapheight * (strength || 1);
}

module.exports = function(){
	var waterMaterial = new THREE.MeshPhongMaterial( {
	  color: 'rgb(17,146,213)',
	  // opacity: 0.8,
	  shading: THREE.FlatShading,
	  side: THREE.FrontSide,
	  shininess: 40
	});

	var greenLandMaterial = new THREE.MeshPhongMaterial( {
	  color: '#43b348',
	  // emissive: '#0E260F',
	  // specular: '#0E260F',
	  shading: THREE.FlatShading,
	  side: THREE.FrontSide,
	  shininess: 0.1
	});

	var highLandMaterial = new THREE.MeshPhongMaterial( {
	  color: '#2F921D',
	  // specular: '#0E260F',
	  shading: THREE.FlatShading,
	  side: THREE.FrontSide,
	  shininess: 0.1
	});

	var snowMaterial = new THREE.MeshPhongMaterial( {
	  color: '#FFFFFF',
	  shading: THREE.FlatShading,
	  side: THREE.FrontSide,
	  shininess: 1
	  // opacity: 0.8,
	  // transparent: true
	});

	var atmosphereMaterial = new THREE.MeshPhongMaterial( {
	  color: '#FFFFFF',
	  shading: THREE.FlatShading,
	  side: THREE.FrontSide,
	  shininess: 1,
	  opacity: 0.09,
	  transparent: true
	});


	var atmosphere = new THREE.SphereGeometry(760, 20, 20);

	var globeGeometry = new THREE.SphereGeometry(700, 50, 50);
	var landGeometry = new THREE.SphereGeometry(692, 50, 50);
	var landBigGeometry = new THREE.SphereGeometry(698, 30, 30);
	
	var landSnowcapGeometry = new THREE.SphereGeometry(675, 50, 50);

	function morphSphereGeometry(sphereGeometry, scale) {
		
		sphereGeometry.vertices.forEach(function(v, idx){
			// This is a pretty poor way to map our 2d perlin noise to a sphere, but meh. This isn't easy
			var x = idx % scale, y = Math.floor( idx / scale );

			// Don't morph the edges of the mesh (remove the gap)
			// if((y <= 10) || y >= (scale - 10)){
			// 	return;
			// }

			var vertex1 = new THREE.Vector3();
			
			vertex1.x = v.x;
			vertex1.y = v.y;
			vertex1.z = v.z;

			// I would like to understand how this works. Somehow this scales based on the spheres center
			vertex1.normalize();
			var vertex2 = vertex1.clone();
			vertex2.multiplyScalar(heightAtPoint(x,y, 2.5));

			// The difference needs to be added to our original co-ord
			v.x += vertex1.x - vertex2.x;
			v.y += vertex1.y - vertex2.y;
			v.z += vertex1.z - vertex2.z;
		});

	}

	morphSphereGeometry(landGeometry, 50);
	morphSphereGeometry(landSnowcapGeometry, 50);
	morphSphereGeometry(landBigGeometry, 30);

	var globeBaseMesh = new THREE.Mesh(globeGeometry, waterMaterial);
	var landGeometryMesh = new THREE.Mesh(landGeometry, greenLandMaterial);
	var landBigGeometryMesh = new THREE.Mesh(landBigGeometry, highLandMaterial);
	var landSnowCapMesh = new THREE.Mesh(landSnowcapGeometry, snowMaterial);

	var atmosphereMesh = new THREE.Mesh(atmosphere, atmosphereMaterial);

	landSnowCapMesh.scale.y = 1.05;

	globeBaseMesh.add(landGeometryMesh);
	globeBaseMesh.add(landBigGeometryMesh);
	globeBaseMesh.add(landSnowCapMesh);
	globeBaseMesh.add(atmosphereMesh);

	return globeBaseMesh;
};