var THREE = require('three');

function createPath(scale){

    var c = 0.55191502449;

    var ellipseCurvePath = new THREE.CurvePath();

    ellipseCurvePath.add(new THREE.CubicBezierCurve3(
        new THREE.Vector3( 0, 1, 0 ).multiplyScalar(scale),
        new THREE.Vector3( c, 1, 0 ).multiplyScalar(scale),
        new THREE.Vector3( 1, c, 0 ).multiplyScalar(scale),
        new THREE.Vector3( 1, 0, 0 ).multiplyScalar(scale)
    ));
    
    ellipseCurvePath.add(new THREE.CubicBezierCurve3(
       new THREE.Vector3( 1, 0, 0 ).multiplyScalar(scale),
       new THREE.Vector3( 1, -c, 0 ).multiplyScalar(scale),
       new THREE.Vector3( c, -1, 0 ).multiplyScalar(scale),
       new THREE.Vector3( 0, -1, 0 ).multiplyScalar(scale) 
    ));

    ellipseCurvePath.add(new THREE.CubicBezierCurve3(
       new THREE.Vector3( 0, -1, 0 ).multiplyScalar(scale),
       new THREE.Vector3( -c, -1, 0 ).multiplyScalar(scale),
       new THREE.Vector3( -1, -c, 0 ).multiplyScalar(scale),
       new THREE.Vector3( -1, 0, 0 ).multiplyScalar(scale) 
    ));

    ellipseCurvePath.add(new THREE.CubicBezierCurve3(
       new THREE.Vector3( -1, 0, 0 ).multiplyScalar(scale),
       new THREE.Vector3( -1, c, 0 ).multiplyScalar(scale),
       new THREE.Vector3( -c, 1, 0 ).multiplyScalar(scale),
       new THREE.Vector3( 0, 1, 0 ).multiplyScalar(scale) 
    ));

    ellipseCurvePath.closePath();

    var geometryt = ellipseCurvePath.createPointsGeometry( 100 );

    var line = new THREE.Line(geometryt, new THREE.LineBasicMaterial({color : '#FFF'}));
    return {
        line: line,
        spline: ellipseCurvePath
    };
}

module.exports = createPath;