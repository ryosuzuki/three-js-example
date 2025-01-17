
String.prototype.format = function () {

  var str = this;
  for ( var i = 0; i < arguments.length; i ++ ) {

    str = str.replace( '{' + i + '}', arguments[ i ] );

  }
  return str;

}

var container, stats;
var camera, scene, renderer;
var splineHelperObjects = [],
    splineOutline;
var splinePointsLength = 4;
var positions = [];
var options;

var geometry = new THREE.BoxGeometry( 20, 20, 20 );

var ARC_SEGMENTS = 200;
var splineMesh;

var splines = {

};
var cube;
var cubeHelperObjecs = [];

setup();
init();
animate();


function setup() {
  container = document.createElement( 'div' );
  document.body.appendChild( container );
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
  camera.position.z = 1000;
  scene.add( camera );

  scene.add( new THREE.AmbientLight( 0xf0f0f0 ) );
  var light = new THREE.SpotLight( 0xffffff, 1.5 );
  light.position.set( 0, 1500, 200 );
  light.castShadow = true;
  light.shadowCameraNear = 200;
  light.shadowCameraFar = camera.far;
  light.shadowCameraFov = 70;
  light.shadowBias = -0.000222;
  light.shadowDarkness = 0.25;
  light.shadowMapWidth = 1024;
  light.shadowMapHeight = 1024;
  scene.add( light );
  spotlight = light;

  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  container.appendChild( stats.domElement );
}

function init() {
  var planeGeometry = new THREE.PlaneGeometry( 2000, 2000, 20, 20 );
  planeGeometry.rotateX( - Math.PI / 2 );
  var planeMaterial = new THREE.MeshBasicMaterial( { color: 0xeeeeee } );

  var plane = new THREE.Mesh( planeGeometry, planeMaterial );
  plane.position.y = -200;
  plane.receiveShadow = true;
  scene.add( plane );

  var helper = new THREE.GridHelper( 1000, 100 );
  helper.position.y = - 199;
  helper.material.opacity = 0.25;
  helper.material.transparent = true;
  scene.add( helper );

  // var axis = new THREE.AxisHelper();
  // axis.position.set( -500, -500, -500 );
  // scene.add( axis );

  var geometry = new THREE.BoxGeometry( 200, 200, 200 );
  var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
  cube = new THREE.Mesh( geometry, material );
  scene.add( cube );

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setClearColor( 0xf0f0f0 );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.shadowMap.enabled = true;
  container.appendChild( renderer.domElement );

  controls = new THREE.OrbitControls( camera, renderer.domElement );
  controls.damping = 0.2;
  controls.addEventListener( 'change', render );

  transformControl = new THREE.TransformControls( camera, renderer.domElement );
  transformControl.addEventListener( 'change', render );

  scene.add( transformControl );

  transformControl.addEventListener( 'change', function( e ) {
    cancelHideTransorm();
  } );

  transformControl.addEventListener( 'mouseDown', function( e ) {
    cancelHideTransorm();
  } );

  transformControl.addEventListener( 'mouseUp', function( e ) {
    delayHideTransform();
  } );

  transformControl.addEventListener( 'objectChange', function( e ) {
    updateSplineOutline();
  } );

  var dragcontrols = new THREE.DragControls( camera, splineHelperObjects, renderer.domElement ); //
  dragcontrols.on( 'hoveron', function( e ) {
    transformControl.attach( e.object );
    cancelHideTransorm(); // *
  } )

  dragcontrols.on( 'hoveroff', function( e ) {
    if ( e ) delayHideTransform();
  } )

  controls.addEventListener( 'start', function() {
    cancelHideTransorm();
  } );

  controls.addEventListener( 'end', function() {
    delayHideTransform();
  } );

  var hiding;

  function delayHideTransform() {
    cancelHideTransorm();
    hideTransform();
  }

  function hideTransform() {
    hiding = setTimeout( function() {
      transformControl.detach( transformControl.object );
    }, 2500 )
  }

  function cancelHideTransorm() {
    if ( hiding ) clearTimeout( hiding );
  }

  var i;
  for ( i = 0; i < splinePointsLength; i ++ ) {
    addSplineObject( positions[ i ] );
  }
  positions = [];
  for ( i = 0; i < splinePointsLength; i ++ ) {
    positions.push( splineHelperObjects[ i ].position );
  }

  var geometry = new THREE.Geometry();
  for ( var i = 0; i < ARC_SEGMENTS; i ++ ) {
    geometry.vertices.push( new THREE.Vector3() );
  }

  /*
  var curve;
  curve = new THREE.CatmullRomCurve3( positions );
  curve.type = 'catmullrom';
  curve.mesh = new THREE.Line( geometry.clone(), new THREE.LineBasicMaterial( {
    color: 0xff0000,
    opacity: 0.35,
    linewidth: 2
  } ) );
  curve.mesh.castShadow = true;
  splines.uniform = curve;

  curve = new THREE.CatmullRomCurve3( positions );
  curve.type = 'centripetal';
  curve.mesh = new THREE.Line( geometry.clone(), new THREE.LineBasicMaterial( {
    color: 0x00ff00,
    opacity: 0.35,
    linewidth: 2
  } ) );
  curve.mesh.castShadow = true;
  splines.centripetal = curve;

  curve = new THREE.CatmullRomCurve3( positions );
  curve.type = 'chordal';
  curve.mesh = new THREE.Line( geometry.clone(), new THREE.LineBasicMaterial( {
    color: 0x0000ff,
    opacity: 0.35,
    linewidth: 2
  } ) );
  curve.mesh.castShadow = true;
  splines.chordal = curve;
  */

  for ( var k in splines ) {

    var spline = splines[ k ];
    scene.add( spline.mesh );

  }

  load( [ new THREE.Vector3( 289.76843686945404, 452.51481137238443, 56.10018915737797 ),
          new THREE.Vector3( -53.56300074753207, 171.49711742836848, -14.495472686253045 ),
          new THREE.Vector3( -91.40118730204415, 176.4306956436485, -6.958271935582161 ),
          new THREE.Vector3( -383.785318791128, 491.1365363371675, 47.869296953772746 ) ] );

}

function addSplineObject( position ) {
  var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( {
    color: Math.random() * 0xffffff
  } ) );
  object.material.ambient = object.material.color;
  if ( position ) {
    object.position.copy( position );
  } else {
    object.position.x = Math.random() * 1000 - 500;
    object.position.y = Math.random() * 600
    object.position.z = Math.random() * 800 - 400;
  }

  object.castShadow = true;
  object.receiveShadow = true;
  scene.add( object );
  splineHelperObjects.push( object );
  return object;

}

function addPoint() {
  splinePointsLength ++;
  positions.push( addSplineObject()
      .position );
  updateSplineOutline();

}

function removePoint() {
  if ( splinePointsLength <= 4 ) {
    return;
  }
  splinePointsLength --;
  positions.pop();
  scene.remove( splineHelperObjects.pop() );
  updateSplineOutline();
}

function updateSplineOutline() {
  var p;
  for ( var k in splines ) {
    var spline = splines[ k ];
    splineMesh = spline.mesh;
    for ( var i = 0; i < ARC_SEGMENTS; i ++ ) {
      p = splineMesh.geometry.vertices[ i ];
      p.copy( spline.getPoint( i /  ( ARC_SEGMENTS - 1 ) ) );
    }
    splineMesh.geometry.verticesNeedUpdate = true;
  }
}

function exportSpline() {
  var p;
  var strplace = [];
  for ( i = 0; i < splinePointsLength; i ++ ) {
    p = splineHelperObjects[ i ].position;
    strplace.push( 'new THREE.Vector3({0}, {1}, {2})'.format( p.x, p.y, p.z ) )

  }
  console.log( strplace.join( ',\n' ) );
  var code = '[' + ( strplace.join( ',\n\t' ) ) + ']';
  prompt( 'copy and paste code', code );

}

function load( new_positions ) {
  while ( new_positions.length > positions.length ) {
    addPoint();
  }
  while ( new_positions.length < positions.length ) {
    removePoint();
  }
  for ( i = 0; i < positions.length; i ++ ) {
    positions[ i ].copy( new_positions[ i ] );
  }
  updateSplineOutline();

}

function animate() {

  requestAnimationFrame( animate );
  render();
  stats.update();
  controls.update();
  transformControl.update();

}

function render() {

  // splines.uniform.mesh.visible = uniform.checked;
  // splines.centripetal.mesh.visible = centripetal.checked;
  // splines.chordal.mesh.visible = chordal.checked;
  renderer.render( scene, camera );

}




  /*
  var info = document.createElement( 'div' );
  info.style.position = 'absolute';
  info.style.top = '10px';
  info.style.width = '100%';
  info.style.textAlign = 'center';
  info.innerHTML = 'catmull-rom rom spline comparisions';
  options = document.createElement( 'div' );
  options.style.position = 'absolute';
  options.style.top = '30px';
  options.style.width = '100%';
  options.style.textAlign = 'center';

  options.innerHTML = 'Points: <input type="button" onclick="addPoint();" value="+" />\
<input type="button" onclick="removePoint();" value="-" />\
<input type="button" onclick="exportSpline();" value="Export" /><br />\
<input type="checkbox" id="uniform" checked /> <label for="uniform">Uniform Catmull-rom</label>  <input type="range" id="tension" onchange="splines.uniform.tension = tension.value;updateSplineOutline();" min=0 max=1 step=0.01 value=0.5 /> <span id="tension_value" /></span> <br />\
<input type="checkbox" id="centripetal" checked /> Centripetal Catmull-rom<br />\
<input type="checkbox" id="chordal" checked /> Chordal Catmull-rom<br />';
  container.appendChild( info );
  container.appendChild( options );
  */

