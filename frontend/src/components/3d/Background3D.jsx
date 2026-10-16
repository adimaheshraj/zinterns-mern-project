import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Background3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // ── Particles ─────────────────────────────────────────
    const particleCount = 320;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const palette = [
      new THREE.Color(0x6366f1), // Indigo
      new THREE.Color(0xa855f7), // Purple
      new THREE.Color(0xec4899), // Pink
      new THREE.Color(0x06b6d4), // Cyan
      new THREE.Color(0x10b981), // Emerald
      new THREE.Color(0xf59e0b), // Amber
      new THREE.Color(0x3b82f6), // Blue
    ];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 90;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 90;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;

      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Soft glow particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.85)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(32, 32, 32, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      map: texture,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // ── Wireframe Meshes ──────────────────────────────────
    const meshes = [];

    // Torus – indigo
    const torusGeo = new THREE.TorusGeometry(8, 2.2, 16, 50);
    const torusMat = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      wireframe: true,
      transparent: true,
      opacity: 0.18
    });
    const torusMesh = new THREE.Mesh(torusGeo, torusMat);
    torusMesh.position.set(-22, 12, -10);
    scene.add(torusMesh);
    meshes.push({ mesh: torusMesh, geo: torusGeo, mat: torusMat });

    // Icosahedron – purple
    const icoGeo = new THREE.IcosahedronGeometry(10, 1);
    const icoMat = new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      wireframe: true,
      transparent: true,
      opacity: 0.18
    });
    const icoMesh = new THREE.Mesh(icoGeo, icoMat);
    icoMesh.position.set(24, -14, -15);
    scene.add(icoMesh);
    meshes.push({ mesh: icoMesh, geo: icoGeo, mat: icoMat });

    // Dodecahedron – cyan
    const dodecGeo = new THREE.DodecahedronGeometry(6, 0);
    const dodecMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });
    const dodecMesh = new THREE.Mesh(dodecGeo, dodecMat);
    dodecMesh.position.set(18, 18, -20);
    scene.add(dodecMesh);
    meshes.push({ mesh: dodecMesh, geo: dodecGeo, mat: dodecMat });

    // Octahedron – pink
    const octGeo = new THREE.OctahedronGeometry(5, 0);
    const octMat = new THREE.MeshBasicMaterial({
      color: 0xf472b6,
      wireframe: true,
      transparent: true,
      opacity: 0.14
    });
    const octMesh = new THREE.Mesh(octGeo, octMat);
    octMesh.position.set(-18, -16, -12);
    scene.add(octMesh);
    meshes.push({ mesh: octMesh, geo: octGeo, mat: octMat });

    // Small TorusKnot – emerald
    const tkGeo = new THREE.TorusKnotGeometry(3, 0.8, 64, 8);
    const tkMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      wireframe: true,
      transparent: true,
      opacity: 0.12
    });
    const tkMesh = new THREE.Mesh(tkGeo, tkMat);
    tkMesh.position.set(-8, -20, -18);
    scene.add(tkMesh);
    meshes.push({ mesh: tkMesh, geo: tkGeo, mat: tkMat });

    // ── Mouse follow ─────────────────────────────────────
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event) => {
      mouseX = (event.clientX - window.innerWidth / 2) * 0.01;
      mouseY = (event.clientY - window.innerHeight / 2) * 0.01;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // ── Resize ────────────────────────────────────────────
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // ── Animation Loop ───────────────────────────────────
    let animationFrameId;
    const timer = new THREE.Timer();
    let lastRenderTime = 0;
    const fpsLimit = 30;
    const frameInterval = 1000 / fpsLimit;

    const animate = (currentTime) => {
      animationFrameId = requestAnimationFrame(animate);
      if (document.hidden) return;

      const delta = currentTime - lastRenderTime;
      if (delta < frameInterval) return;
      lastRenderTime = currentTime - (delta % frameInterval);

      timer.update(currentTime);
      const t = timer.getElapsed();

      // Smooth mouse follow
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      particles.rotation.y = t * 0.03 + targetX * 0.5;
      particles.rotation.x = t * 0.02 + targetY * 0.5;

      // Animate meshes with varied speeds
      torusMesh.rotation.x = t * 0.1;
      torusMesh.rotation.y = t * 0.15;

      icoMesh.rotation.x = -t * 0.12;
      icoMesh.rotation.z = t * 0.08;

      dodecMesh.rotation.y = t * 0.09;
      dodecMesh.rotation.z = -t * 0.06;
      dodecMesh.position.y = 18 + Math.sin(t * 0.4) * 3;

      octMesh.rotation.x = t * 0.14;
      octMesh.rotation.y = -t * 0.1;
      octMesh.position.x = -18 + Math.cos(t * 0.3) * 2;

      tkMesh.rotation.x = t * 0.2;
      tkMesh.rotation.y = t * 0.15;

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      texture.dispose();
      meshes.forEach(({ geo, mat }) => {
        geo.dispose();
        mat.dispose();
      });
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-90 dark:opacity-100"
    />
  );
}
