
var container, stats;
var camera, scene, renderer;
var splineHelperObjects = [],
    splineOutline;
var splinePointsLength = 4;
var options;

var geometry = new THREE.BoxGeometry( 20, 20, 20 );

var ARC_SEGMENTS = 200;
var splineMesh;

var splines = {

};
var box;
var boxHelperObjects = [];

var raycaster = new THREE.Raycaster()
var mouse = new THREE.Vector2();
var lane = null
var selection = null
var offset = new THREE.Vector3()
var objects = [];
var ground;
var grid;
var hover = false;
var draggable = false;
var dragging = false;

var vector;
var dir;

var mouse2D;
var projector;
var oldPosition;
var dimention = 'xz';
var point;
var pos;
var selected;
var size = 200;

var renderStats;
var physicsStats;


var world = new CANNON.World();
var timeStep = 1.0 / 60.0;
var scale = 1;
var size = scale;
var boxBody;
var groundBody;
var boxBody;
var cylinderBody;
var selectedBody;
var bodies = [];
var meshes = [];
var draggableMeshes = [];

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.set(scale*2, scale*2, scale*2)
  camera.lookAt(new THREE.Vector3(0, 3, 0));
  scene.add( camera );

  scene.add(new THREE.AmbientLight(0xf0f0f0));
  var light = new THREE.SpotLight(0xffffff, 1.5);
  light.position.set(scale*7, scale*7, -scale*7);
  light.castShadow = true;
  light.shadowCameraNear = scale*3;
  light.shadowCameraFar = camera.far;
  light.shadowCameraFov = 70;
  light.shadowBias = -0.000222;
  light.shadowDarkness = 0.25;
  light.shadowMapWidth = 1024;
  light.shadowMapHeight = 1024;
  scene.add(light);
  spotlight = light;

  grid = new THREE.GridHelper(scale*5, scale/2);
  grid.position.y = 0.01;
  grid.material.opacity = 0.25;
  grid.material.transparent = true;
  scene.add(grid);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setClearColor(0xf0f0f0);
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.shadowMap.enabled = true;
  document.getElementById('viewport').appendChild( renderer.domElement );

  controls = new THREE.OrbitControls( camera, renderer.domElement );
  controls.damping = 0.2;
  controls.addEventListener( 'change', render );

  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '10px';
  stats.domElement.style.right = '20px';
  stats.domElement.style.zIndex = 100;
  document.getElementById('viewport').appendChild(stats.domElement);

  document.addEventListener('mousedown', onDocumentMouseDown, false);
  document.addEventListener('mousemove', onDocumentMouseDown, false);
  document.addEventListener('mouseup', onDocumentMouseUp, false);
  document.addEventListener('touchstart', onDocumentTouchStart, false);

  window.addEventListener('resize', onWindowResize, false);
}

var pinionMesh;
var rackMesh;
var materials = [];
var basicMaterials = [];
THREE.ImageUtils.crossOrigin = '';
var texture = THREE.ImageUtils.loadTexture('/assets/plaster.jpg');
// materials[2] = material


var a = new THREE.Vector3(1, 0, 0);
var b = new THREE.Vector3(0, 0, 1);
var c = new THREE.Vector3(0, 1, 0);
var ab = new THREE.Vector3();
var bc = new THREE.Vector3();
ab.subVectors(b, a);
bc.subVectors(c, b);

var normal = new THREE.Vector3();
normal.crossVectors(ab, bc)
normal.normalize()

var triangle;
var cylinder;

var start = 880;
// start = 2000
var maxDistance = 4;

function drawObjects () {
  drawCylinder();
  // drawSTL();
}

function drawCylinder () {
  start = 13;
  cylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(size, size, size*2, 20),
    new THREE.MeshBasicMaterial({vertexColors: THREE.FaceColors })
  );
  cylinder.geometry.verticesNeedUpdate = true;
  cylinder.dynamic = true;
  cylinder.castShadow = true;
  cylinder.receiveShadow = true;
  scene.add(cylinder);
  objects.push(cylinder);
  window.geometry = cylinder.geometry

  mesh = cylinder;
  computeUniq(geometry, function () {
    computeExponentialMap( function () {
      hoge();
    });
  })
}


function drawBox () {
  box = new THREE.Mesh(
    new THREE.BoxGeometry(size, size, size),
    new THREE.MeshBasicMaterial({vertexColors: THREE.FaceColors })
  );
  box.geometry.verticesNeedUpdate = true;
  box.dynamic = true;
  box.castShadow = true;
  box.receiveShadow = true;
  scene.add(box);
  objects.push(box);
  window.geometry = box.geometry
  computeUniq(geometry);
  computeLaplacian(geometry);
}

function drawSTL () {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if ( xhr.readyState == 4 ) {
      if ( xhr.status == 200 || xhr.status == 0 ) {
        var rep = xhr.response; // || xhr.mozResponseArrayBuffer;
        console.log(rep);
        parseStlBinary(rep);
        //parseStl(xhr.responseText);
        window.geometry = mesh.geometry;
        mesh.material.color.set(new THREE.Color('blue'))
        mesh.position.y = 1;
        mesh.rotation.x = 5;
        mesh.rotation.z = .25;
        // for mavin
        // mesh.scale.set(0.1, 0.1, 0.1);
        console.log('done parsing');
        computeUniq(geometry, function (geometry) {
          // computeLaplacian(geometry, function (geometry) {
            computeExponentialMap( function () {
              hoge();
            });
          // });
        });
      }
    }
  }
  xhr.onerror = function(e) {
    console.log(e);
  }
  xhr.open( "GET", 'assets/mini_knight.stl', true );
  // xhr.open( "GET", 'assets/marvin-original.stl', true );
  // xhr.open( "GET", 'assets/marvin-original.stl', true );
  xhr.responseType = "arraybuffer";
  xhr.send( null );
}


var candidates;

// TODO
// - candidates should be heap data structure
// - the order of edges should be clockwise
//


function computeExponentialMap (callback) {
  console.log('Start computeExponentialMap');
  geometry.uniq.map( function (node) {
    node.distance = undefined;
    return node;
  })
  candidates = [];
  initializeGamma(start);
  var s = map[start];
  while (candidates.length > 0) {
    var candidate = candidates[0];
    for (var i=0; i<candidate.edges.length; i++) {
      var node = geometry.uniq[candidate.edges[i]];
      if (!node.distance) {
        computeDistance(node);
      }
    }
    candidates.shift();
  }
  console.log('Finish computeExponentialMap')
  if (callback) callback();
}

function initializeGamma (index) {
  var s = map[index];
  var origin = geometry.uniq[s];
  origin.distance = Math.pow(10, -12);
  origin.theta = 0;
  getUV(origin);
  var theta = 0;
  var edges = origin.edges.slice(1);
  var num = edges.length;
  console.log(edges);
  for (var i=0; i<num; i++) {
    var node = geometry.uniq[edges[i]];
    var ip = i+1;
    if (ip>=num) ip=0;
    var next = geometry.uniq[edges[ip]];
    node.distance = node.vertex.distanceTo(origin.vertex);
    var v1 = new THREE.Vector3()
    var v2 = new THREE.Vector3()
    v1.subVectors(node.vertex, origin.vertex).normalize();
    v2.subVectors(next.vertex, origin.vertex).normalize();
    var cos_delta = v1.dot(v2);
    var delta = Math.acos(cos_delta);
    console.log('#' + i)
    console.log("Distance: " + (node.distance).toPrecision(2));
    console.log("Theta: " + (theta/Math.PI).toPrecision(2) + " pi");
    node.theta = theta;
    theta = theta + delta;
    getUV(node);
    console.log('');
    console.log('UV: ' + node.uv.x + ', ' + node.uv.y);
    console.log('----------');
    candidates.push(node);
  }
  // candidates = []
  return theta;
}

function getUV (node) {
  node.u = (node.distance / (Math.sqrt(2)*maxDistance)) * Math.cos(node.theta) + 0.5;
  node.v = (node.distance / (Math.sqrt(2)*maxDistance)) * Math.sin(node.theta) + 0.5;
  // node.u = (node.distance / maxDistance) * Math.cos(node.theta) + 0.5;
  // node.v = (node.distance / maxDistance) * Math.sin(node.theta) + 0.5;
  // node.u = node.distance*Math.cos(node.theta) + 0.5;
  // node.v = node.distance*Math.sin(node.theta) + 0.5;
  node.uv = new THREE.Vector2(node.u, node.v);
  return node;
}

function hoge () {
  geometry.faceVertexUvs = [[]];
  // var faces = uniq[map[start]].faces;
  for (var i=0; i<geometry.faces.length; i++) {
    var face = geometry.faces[i];
  // for (var i=0; i<faces.length; i++) {
  //   var index = faces[i];
  //   var face = geometry.faces[index];
    var a = uniq[map[face.a]];
    var b = uniq[map[face.b]];
    var c = uniq[map[face.c]];
    if (a.uv && b.uv && c.uv) {
      geometry.faceVertexUvs[0].push([a.uv, b.uv, c.uv]);
      geometry.uvsNeedUpdate = true;
    }
  }
  var texture = new THREE.ImageUtils.loadTexture('/assets/checkerboard-3.jpg');
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  // texture.repeat.set(1, 1);
  mesh.material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
}


function computeAngle (node, node_j, node_k, alpha) {
  var theta_j = node_j.theta;
  var theta_k = node_k.theta;
  var diff = theta_j - theta_k;
  if (diff < 0) {
    return theta_j;
  }
  if (diff > Math.PI) {
    if(theta_j < theta_k) {
      theta_j += 2*Math.PI;
    } else {
      theta_k += 2*Math.PI;
    }
  }
  var theta = (1-alpha)*theta_j + alpha*theta_k;
  if(theta > 2*Math.PI) theta -= 2*Math.PI;
  return theta;
}

function computeDistance (node) {
  // console.log('Start computeDistance()');
  var distance;
  var alpha;
  var theta;
  for (var i=0; i<node.faces.length; i++) {
    var face = geometry.faces[node.faces[i]];
    var node_j;
    var node_k;
    if (node.index.includes(face.a)) {
      node_j = geometry.uniq[map[face.b]];
      node_k = geometry.uniq[map[face.c]];
    } else if (node.index.includes(face.b)) {
      node_j = geometry.uniq[map[face.a]];
      node_k = geometry.uniq[map[face.c]];
    } else {
      node_j = geometry.uniq[map[face.a]];
      node_k = geometry.uniq[map[face.b]];
    }
    var U_j = node_j.distance;
    var U_k = node_k.distance;
    if (!U_j || !U_k) continue;

    var v_i = node.vertex;
    var v_j = node_j.vertex;
    var v_k = node_k.vertex;
    var e_j = new THREE.Vector3()
    var e_k = new THREE.Vector3()
    var e_kj = new THREE.Vector3()
    e_j.subVectors(v_j, v_i);
    e_k.subVectors(v_k, v_i);
    e_kj.subVectors(v_k, v_j);
    var sq_ej = e_j.dot(e_j);
    var sq_ek = e_k.dot(e_k);
    var sq_ekj = e_kj.dot(e_kj);


    var e = new THREE.Vector3();
    e.crossVectors(e_j, e_k);
    var A = Math.sqrt(e.dot(e));
    var array = [U_j, U_k, Math.sqrt(sq_ekj)].sort();
    var a = array[2];
    var b = array[1];
    var c = array[0];
    var H = Math.sqrt(
      (a + (b + c)) *
      (c - (a - b)) *
      (c + (a - b)) *
      (a + (b - c))
    )
    var x_j = (A * (sq_ekj + U_k*U_k - U_j*U_j) + e_k.dot(e_kj) * H ) / ( 2 * A * sq_ekj);
    var x_k = (A * (sq_ekj + U_j*U_j - U_k*U_k) - e_j.dot(e_kj) * H ) / ( 2 * A * sq_ekj);

    if(x_j<0 || x_k<0) {
      var dijkstra_j = U_j + Math.sqrt(sq_ej);
      var dijkstra_k = U_k + Math.sqrt(sq_ek);
      if(dijkstra_j < dijkstra_k) {
        alpha = 0;
        U_i = dijkstra_j;
      } else {
        alpha = 1;
        U_i = dijkstra_k;
      }
    } else {
      var e_i = new THREE.Vector3();
      e_i.addVectors(e_j.clone().multiplyScalar(x_j) , e_k.clone().multiplyScalar(x_k));
      U_i = Math.sqrt(e_i.dot(e_i));

      var cos_jk = (U_j*U_j + U_k*U_k - sq_ekj) / (2*U_j*U_k);
      var cos_ij = (U_i*U_i + U_j*U_j - sq_ej) / (2*U_i*U_j);
      alpha = Math.acos(cos_ij) / Math.acos(cos_jk);
    }

    if (!distance || distance > U_i) {
      distance = U_i;
      theta = computeAngle(node, node_j, node_k, alpha)
    }
  }

  node.distance = distance;
  node.theta = theta;
  getUV(node);
  if (node.distance < maxDistance) {
    for (var j=0; j<node.edges.length; j++) {
      var edge = geometry.uniq[node.edges[j]]
      if (!edge.distance) candidates.push(edge);
    }
  }
  // console.log(node);
  return distance;
}

function onDocumentMouseUp (event) {
  var intersects = getIntersects(event);
  if (intersects.length > 0) {
    if (changedIndex.indexOf(currentIndex) == -1) {
      console.log(current.face)
      if (!p && !q) {
        p = map[current.face.a];
        current.face.color.set(new THREE.Color('yellow'));
      } else if (!q) {
        q = map[current.face.b];
        current.face.color.set(new THREE.Color('blue'));
        compute();
        q = undefined;
      }
      current.object.geometry.colorsNeedUpdate = true;
    }
  }
}


function compute () {
  console.log('Start compute');

  var N = 15;
  var t = N/2;

  var c = [];
  for (var i=0; i<N; i++) {
    c[i] = Math.exp(- Math.pow(i-t, 2) / (2*Math.pow(t, 2)) )
  }

  var c = [];
  var phi = geometry.phi;
  var a = _.sortBy(phi);
  for (var i=0; i<N; i++) {
    var q = i/N;
    var k = d3.quantile(a, q);
    c[i] = Math.exp(- Math.pow(k-t, 2) / (2*Math.pow(k, 2)) )
  }


  computeHarmonicField(geometry, function () {
    console.log('done');
    var lines = [];
    for (var i=0; i<5; i++) {
      var line = new THREE.Line(
        new THREE.Geometry(),
        new THREE.LineBasicMaterial({color: Math.random() * 0xffffff})
      );
      lines.push(line);
    }
    colorChange(10);
    p = undefined;
    q = undefined;

    /*
    var uniq = geometry.uniq;
    var phi = geometry.phi;
    var faces = geometry.faces;
    var map = geometry.map;
    var val = 50;//d3.mean(phi);
    window.seg = []

    for (var i=0; i<faces.length; i++) {
      var face = faces[i];
      var phi_a = phi[map[face.a]];
      var phi_b = phi[map[face.b]];
      var phi_c = phi[map[face.c]];

      if ( phi_a>val || phi_b>val || phi_c>val) {
        face.color.set(new THREE.Color('yellow'));
        seg.push(face);
      }
    }
    console.log(seg);
    geometry.colorsNeedUpdate = true;
    */

    /*
    seg = []
    for (var i=0; i<uniq.length; i++) {
      var vertex = uniq[i].vertex;
      // if ( 0 < phi[i] <= 0.2) {
      //   lines[0].geometry.vertices.push(vertex);
      if (phi[i] <= 0.1) {
        lines[1].geometry.vertices.push(vertex);
        seg.push(vertex)
      // } else if (0.4 < phi[i] && phi[i] <= 0.6) {
      //   lines[2].geometry.vertices.push(vertex);
      // } else if (0.6 < phi[i] && phi[i] <= 0.8) {
      //   lines[3].geometry.vertices.push(vertex);
      // } else if (0.8 < phi[i] && phi[i] <= 1.0) {
      //   lines[4].geometry.vertices.push(vertex);
      }
    }
    console.log(seg)
    scene.add(lines[0]);
    scene.add(lines[1]);
    scene.add(lines[2]);
    scene.add(lines[3]);
    scene.add(lines[4]);
    */
  });
}



var changedIndex = []
var oldIndex;
var currentIndex;


var oldColor = new THREE.Color('white');
var selectColor = new THREE.Color('yellow');

function onDocumentMouseDown( event ) {
  var intersects = getIntersects(event)
  if ( intersects.length > 0 ) {
    // if (current !== intersects[0]) oldIndex = undefined;
    window.current = intersects[0];
    currentIndex = current.faceIndex;

    var v1 = current.object.geometry.vertices[current.face.a];
    var v2 = current.object.geometry.vertices[current.face.b];
    var v3 = current.object.geometry.vertices[current.face.c];
    var pos = current.object.position;
    var faces = current.object.geometry.faces;

    var n = current.face.normal.normalize();
    var sameNormal = [];
    // faces.forEach( function (face, index) {
    //   var m = face.normal.normalize();
    //   if (compareVector(n, m)) {
    //     face.color.set(new THREE.Color('yellow'));
    //     sameNormal.push(face);
    //   }
    // });
    // console.log(sameNormal)
    // current.object.geometry.colorsNeedUpdate = true;


    // var n = current.face.normal.normalize();
    // var index = current.faceIndex;
    // var sameInverse = [];
    // while (true) {
    //   var face = faces[index+1];
    //   if (!face) break;
    //   var m = face.normal.normalize();
    //   if (compareVector(n.negate(), m)) {
    //     face.color.set(new THREE.Color('yellow'));
    //     sameInverse.push(face);
    //   }
    //   index = index + 1;
    // }
    // while (true) {
    //   var face = faces[index-1];
    //   if (!face) break;
    //   var m = face.normal.normalize();
    //   if (compareVector(n.negate(), m)) {
    //     face.color.set(new THREE.Color('yellow'));
    //     sameInverse.push(face);
    //   }
    //   index = index + 1;
    // }
    // // console.log(sameNormal)
    // current.object.geometry.colorsNeedUpdate = true;


    // var n = calcurateArea(current.face);
    // var sameArea = [];
    // faces.forEach( function (face, index) {
    //   var m = calcurateArea(face);
    //   if (m.toPrecision(2) == n.toPrecision(2)) {
    //     // face.color.set(new THREE.Color('yellow'));
    //     sameArea.push(face);
    //   }
    // });
    // // console.log(sameArea)
    // current.object.geometry.colorsNeedUpdate = true;


    // var index = current.faceIndex;
    // var sameDiff = [];
    // while (true) {
    //   var face = faces[index];
    //   if (!faces[index+1] || !faces[index+2]) break;
    //   var n = calcurateDiff(index, index+1)
    //   var m = calcurateDiff(index+1, index+2)
    //   if (compareVector(n, m)) {
    //     // face.color.set(new THREE.Color('yellow'));
    //     sameDiff.push(face);
    //   }
    //   index = index + 1;
    // }
    // var index = current.faceIndex;
    // while (true) {
    //   var face = faces[index];
    //   if (!faces[index-1] || !faces[index-2]) break;
    //   var n = calcurateDiff(index, index-1)
    //   var m = calcurateDiff(index-1, index-2)
    //   if (compareVector(n, m)) {
    //     // face.color.set(new THREE.Color('yellow'));
    //     sameDiff.push(face);
    //   }
    //   index = index - 1;
    // }
    // console.log(sameDiff)
    // current.object.geometry.colorsNeedUpdate = true;


    function compareVector(n, m) {
      var p = 1;
      if (
        n.x.toPrecision(p) == m.x.toPrecision(p)
        && n.y.toPrecision(p) == m.y.toPrecision(p)
        && n.z.toPrecision(p) == m.z.toPrecision(p)
      ) {
        return true;
      } else {
        false;
      }
    }

    function calcurateDiff(i, j) {
      var face = current.object.geometry.faces[i];
      var next = current.object.geometry.faces[j];
      var a = face.normal.normalize();
      var b = next.normal.normalize();
      var diff = a.clone().sub(b);
      return diff;
    }


    function calcurateArea (face) {
      var va = current.object.geometry.vertices[face.a];
      var vb = current.object.geometry.vertices[face.b];
      var vc = current.object.geometry.vertices[face.c];
      var ab = vb.clone().sub(va);
      var ac = vc.clone().sub(va);
      var cross = new THREE.Vector3();
      cross.crossVectors( ab, ac );
      var area = cross.lengthSq() / 2;
      return area;
    }


    // console.log(currentIndex);
    /*
    if (oldIndex != currentIndex) {
      if (oldIndex && current.object.geometry.faces[oldIndex]) {
        current.object.geometry.faces[oldIndex].color.set(oldColor);
      }
      current.object.geometry.faces[currentIndex].color.set(selectColor);
      current.object.geometry.colorsNeedUpdate = true;
      oldIndex = currentIndex;
      if (changedIndex.indexOf(currentIndex) == -1) {
      }
    }
    */
  }
}



function getTexture (current) {
  var v1 = current.object.geometry.vertices[current.face.a];
  var v2 = current.object.geometry.vertices[current.face.b];
  var v3 = current.object.geometry.vertices[current.face.c];
  var pos = current.object.position;
  var n = current.face.normal.normalize();

  var geometry = new THREE.Geometry();
  geometry.vertices.push(v1);
  geometry.vertices.push(v2);
  geometry.vertices.push(v3);
  geometry.faces.push(new THREE.Face3(0, 1, 2));
  geometry.verticesNeedUpdate = true;

  var rot = current.object.rotation;
  var axis = new THREE.Vector3(0, 1, 0);
  var quaternion = new THREE.Quaternion().setFromUnitVectors(axis, normal)
  var matrix = new THREE.Matrix4().makeRotationFromQuaternion(quaternion);
  for (var i=0; i<10; i++) {
    for (var j=0; j<10; j++) {
      var c1 = v1.clone()
      var c2 = v2.clone()
      var c3 = v3.clone()
      var a = c1.multiplyScalar( (10-i)/10 * j/10 )
      var b = c2.multiplyScalar( (10-i)/10 * (10-j)/10 )
      var c = c3.multiplyScalar( i/10 )
      var point = a.add(b).add(c)

      var radius = size/20;
      var height = size/10;
      var tetra = new THREE.Mesh(
        new THREE.CylinderGeometry(0, radius, height, 8, 1),
        new THREE.MeshLambertMaterial({color: 0x0000ff})
      )
      tetra.applyMatrix(matrix);
      tetra.castShadow = true;
      tetra.receiveShadow = true;
      tetra.position.set(point.x, point.y, point.z)
      geometry.mergeMesh(tetra);
    }
  }

  var texture = new THREE.Mesh(
    geometry, new THREE.MeshBasicMaterial({color: 'yellow'}));
  texture.rotation.set(rot.x, rot.y, rot.z, rot.order)
  texture.castShadow = true;
  texture.receiveShadow = true;
  texture.position.set(pos.x, pos.y, pos.z);
  scene.add(texture);
  return texture;
}


function getIntersects (event) {
  event.preventDefault();
  mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;
  raycaster.setFromCamera( mouse, camera );
  var intersects = raycaster.intersectObjects( objects );
  return intersects
}

function onDocumentMouseMove (event) {
  console.log('move')
  var intersects = getIntersects(event);
  if (intersects.length > 0) {
    var basicMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    changeMaterial(intersects, basicMaterial);
  }
}


function animate(){
  requestAnimationFrame(animate);
  render();
  stats.update();
}

function render() {
  controls.update();
  renderer.clear();
  renderer.render(scene, camera);
}

function onWindowResize () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}

function onDocumentTouchStart( event ) {
  event.preventDefault();
  event.clientX = event.touches[0].clientX;
  event.clientY = event.touches[0].clientY;
  onDocumentMouseDown( event );
}


$( function () {
  init();
  drawObjects();
  // dragObjects();
  animate();

  $('#export').click( function() {
    var exporter = new THREE.STLExporter();
    var stlString = exporter.parse( scene );
    var blob = new Blob([stlString], {type: 'text/plain'});
    saveAs(blob, 'demo.stl');
  });
});



