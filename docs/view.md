---
title: View 3D model
layout: page
description: View 3D model
bodyClass: page-view
permalink: "/view/"
intro_image_absolute: true
intro_image_hide_on_mobile: false
---

<style>
  #stl-viewer {
    width: 100%;
    height: 600px;
    background: #f4f4f4;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
  }
  #stl-loading {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: sans-serif;
    color: #666;
    pointer-events: none;
  }
</style>

<div id="stl-viewer">
  <div id="stl-loading">Loading model…</div>
</div>

<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.176.0/examples/jsm/"
  }
}
</script>

<script type="module">
  import * as THREE from 'three';
  import { STLLoader } from 'three/addons/loaders/STLLoader.js';
  import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

  const MODEL_URL =
    'https://raw.githubusercontent.com/TorSalve/topography-of-hci/main/models/aarhus25/Aarhus%202025%20-%20flags.stl';

  const container = document.getElementById('stl-viewer');
  const loading   = document.getElementById('stl-loading');

  // Scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf4f4f4);

  // Camera
  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    100000
  );

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(1, 2, 3);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xffffff, 0.4);
  fill.position.set(-2, -1, -2);
  scene.add(fill);

  // Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Load model
  new STLLoader().load(
    MODEL_URL,
    (geometry) => {
      geometry.center();
      const material = new THREE.MeshPhongMaterial({
        color: 0x777777,
        specular: 0x333333,
        shininess: 80,
      });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      // Fit camera to model
      const box  = new THREE.Box3().setFromObject(mesh);
      const size = box.getSize(new THREE.Vector3()).length();
      camera.near = size / 100;
      camera.far  = size * 100;
      camera.position.set(0, 0, size * 1.5);
      camera.updateProjectionMatrix();
      controls.target.set(0, 0, 0);
      controls.update();

      loading.style.display = 'none';
    },
    undefined,
    () => { loading.textContent = 'Failed to load model.'; }
  );

  // Resize
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  // Loop
  (function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  })();
</script>

