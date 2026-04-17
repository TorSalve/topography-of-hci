---
title: View 3D model
layout: page
description: View 3D model
bodyClass: page-view
permalink: "/view/"
intro_image_absolute: true
intro_image_hide_on_mobile: false
---

# Topography of HCI -- CHI 2026

<style>
  #model-viewer {
    width: 100%;
    height: 600px;
    background: #f4f4f4;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
  }
  #model-status {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    font-family: sans-serif;
    color: #555;
    pointer-events: none;
    padding: 24px;
    box-sizing: border-box;
    transition: opacity 0.4s;
  }
  #model-status-text {
    font-size: 14px;
  }
  #model-bar-wrap {
    width: 260px;
    height: 6px;
    background: #ddd;
    border-radius: 3px;
    overflow: hidden;
    display: none;
  }
  #model-bar {
    height: 100%;
    width: 0%;
    background: #555;
    border-radius: 3px;
    transition: width 0.15s linear;
  }
</style>

<div id="model-viewer">
  <div id="model-status">
    <div id="model-status-text">Initialising…</div>
    <div id="model-bar-wrap"><div id="model-bar"></div></div>
  </div>
</div>

<script type="importmap">
{
  "imports": {
    "three":          "https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js",
    "three/addons/":  "https://cdn.jsdelivr.net/npm/three@0.176.0/examples/jsm/",
    "fflate":         "https://cdn.jsdelivr.net/npm/fflate@0.8.2/esm/browser.js"
  }
}
</script>

<script type="module">
  import * as THREE from 'three';
  import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

  const MODEL_URL =
    'https://media.githubusercontent.com/media/TorSalve/topography-of-hci/refs/heads/main/models/chi26/CHI%20-%20topography%201.fbx';

  // ── UI refs ───────────────────────────────────────────────────────────────
  const container  = document.getElementById('model-viewer');
  const statusEl   = document.getElementById('model-status');
  const statusText = document.getElementById('model-status-text');
  const barWrap    = document.getElementById('model-bar-wrap');
  const bar        = document.getElementById('model-bar');

  // ── Scene ─────────────────────────────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf4f4f4);

  const camera = new THREE.PerspectiveCamera(
    45, container.clientWidth / container.clientHeight, 0.1, 1e6
  );

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 1.5));
  const sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.position.set(1, 2, 3);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xffffff, 1);
  fill.position.set(-2, -1, -2);
  scene.add(fill);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // ── Helpers ───────────────────────────────────────────────────────────────
  function fitCamera(object) {
    const box    = new THREE.Box3().setFromObject(object);
    const size   = box.getSize(new THREE.Vector3()).length();
    const center = box.getCenter(new THREE.Vector3());
    object.position.sub(center);
    camera.near = size / 100;
    camera.far  = size * 100;
    camera.position.set(0, 0, size * 1.5);
    camera.updateProjectionMatrix();
    controls.target.set(0, 0, 0);
    controls.update();
  }

  const startTime = Date.now();

  function elapsed() {
    return ((Date.now() - startTime) / 1000).toFixed(1);
  }

  function onProgress(xhr) {
    barWrap.style.display = 'block';
    if (xhr.total) {
      const pct = Math.round((xhr.loaded / xhr.total) * 100);
      bar.style.width = pct + '%';
      statusText.textContent =
        `Loading… ${pct}%  ·  ` +
        `${(xhr.loaded / 1e6).toFixed(1)} / ${(xhr.total / 1e6).toFixed(1)} MB  ·  ${elapsed()}s`;
    } else {
      // Server did not send Content-Length — show bytes transferred
      statusText.textContent =
        `Loading… ${(xhr.loaded / 1e6).toFixed(1)} MB  ·  ${elapsed()}s`;
    }
  }

  function onLoaded(object) {
    scene.add(object);
    fitCamera(object);
    statusText.textContent = `Loaded in ${elapsed()}s`;
    barWrap.style.display = 'none';
    setTimeout(() => { statusEl.style.opacity = '0'; }, 1500);
    setTimeout(() => { statusEl.style.display = 'none'; }, 2000);
  }

  function onError(err) {
    console.error(err);
    barWrap.style.display = 'none';
    statusText.textContent = 'Failed to load model.';
  }

  // ── Auto-detect format and pick loader ────────────────────────────────────
  const ext = MODEL_URL.split('?')[0].split('.').pop().toLowerCase();

  if (ext === 'stl') {
    const { STLLoader } = await import('three/addons/loaders/STLLoader.js');
    new STLLoader().load(MODEL_URL, (geometry) => {
      geometry.center();
      const mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshPhongMaterial({ color: 0xcccccc, specular: 0x444444, shininess: 60 })
      );
      onLoaded(mesh);
    }, onProgress, onError);

  } else if (ext === 'fbx') {
    const { FBXLoader } = await import('three/addons/loaders/FBXLoader.js');
    new FBXLoader().load(MODEL_URL, onLoaded, onProgress, onError);

  } else if (ext === 'ply') {
    const { PLYLoader } = await import('three/addons/loaders/PLYLoader.js');
    new PLYLoader().load(MODEL_URL, (geometry) => {
      geometry.center();
      const mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshPhongMaterial({
          color: 0x777777,
          vertexColors: geometry.hasAttribute('color'),
        })
      );
      onLoaded(mesh);
    }, onProgress, onError);

  } else if (ext === 'obj') {
    const { OBJLoader } = await import('three/addons/loaders/OBJLoader.js');
    new OBJLoader().load(MODEL_URL, onLoaded, onProgress, onError);

  } else {
    statusText.textContent = `Unsupported format: .${ext}`;
  }

  // ── Resize ────────────────────────────────────────────────────────────────
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  // ── Render loop ───────────────────────────────────────────────────────────
  (function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  })();
</script>

