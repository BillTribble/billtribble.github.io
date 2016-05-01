var THREE = require('three');

function getRandom(size){
	var val = Math.random() * size - size / 2;
	return val;
}

module.exports = function(sizeOfStarfield, sizeOfStar, starCount){
	
	var geometry = new THREE.Geometry();

	var innerSphereTest = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1700);
	var outerSphereTest = new THREE.Sphere(new THREE.Vector3(0, 0, 0), sizeOfStarfield/2);

	for (var i = 0; i < starCount; i++){
		var vertex = new THREE.Vector3();
	
		vertex.x = getRandom(sizeOfStarfield);
		vertex.y = getRandom(sizeOfStarfield);
		vertex.z = getRandom(sizeOfStarfield);

		if(!innerSphereTest.containsPoint(vertex) && outerSphereTest.containsPoint(vertex)){
			geometry.vertices.push(vertex);
		}
	}

	var material = new THREE.PointsMaterial({
		size: sizeOfStar,
		color: 0xFFFFFF
	});

	var pointCloud = new THREE.Points(geometry, material);

	return pointCloud;
};