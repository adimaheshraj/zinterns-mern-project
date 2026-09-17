import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Hero3DCanvas({ className = "w-24 h-24" }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 96;
    const height = container.clientHeight || 96;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Outer Torus Knot
    const knotGeo = new THREE.TorusKnotGeometry(1.2, 0.28, 100, 16);
    const knotMat = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      roughness: 0.2,
      metalness: 0.8,
      wireframe: false,
      emissive: 0x312e81,
      emissiveIntensity: 0.4
    });
    const knotMesh = new THREE.Mesh(knotGeo, knotMat);
    scene.add(knotMesh);

    // Inner Glowing Sphere
    const sphereGeo = new THREE.SphereGeometry(0.6, 32, 32);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0xec4899,
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0xa855f7,
      emissiveIntensity: 0.8
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphereMesh);

    // Lighting
    const pointLight = new THREE.PointLight(0xffffff, 2, 50);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const blueLight = new THREE.PointLight(0x6366f1, 3, 50);
    blueLight.position.set(-5, -5, -2);
    scene.add(blueLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    let animationFrameId;
    const timer = new THREE.Timer();

    const animate = (currentTime) => {
      animationFrameId = requestAnimationFrame(animate);
      timer.update(currentTime);
      const elapsed = timer.getElapsed();

      knotMesh.rotation.x = elapsed * 0.5;
      knotMesh.rotation.y = elapsed * 0.7;

      sphereMesh.rotation.y = -elapsed * 0.4;
      const scaleFactor = 1 + Math.sin(elapsed * 2) * 0.08;
      sphereMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      knotGeo.dispose();
      knotMat.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className={`${className} relative cursor-pointer`} />;
}
