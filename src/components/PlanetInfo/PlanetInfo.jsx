import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import vertexShader from '../../shaders/vertex.glsl?raw';
import fragmentShader from '../../shaders/fragment.glsl?raw';
import atmosphereVertexShader from '../../shaders/atmosphereVertex.glsl?raw';
import atmosphereFragmentShader from '../../shaders/atmosphereFragment.glsl?raw';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import './PlanetInfo.css';

const PlanetOverlay = ({ planet, image, onClose }) => {
  const canvasRef = useRef(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
    });
    renderer.setSize(window.innerWidth / 2, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio)

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 0.5, 0.1, 1000);
    camera.position.z = 15;

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(5, 50, 50),
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          globeTexture: {
            value: new THREE.TextureLoader().load(image),
          },
        },
      })
    );

    scene.add(sphere);
    scene.background = new THREE.Color(0x000000);

    const animate = () => {
        // timestamp = Date.now() * 0.0001;
        window.requestAnimationFrame(animate);
  
        labelRenderer.render(scene, camera);
  
        renderer.render(scene, camera);
        sphere.rotation.y += 0.001
    }

    const render = () => {
      requestAnimationFrame(render);
      renderer.render(scene, camera);
      sphere.rotation.y += 0.001;
    };

    render();

    return () => {
      scene.remove(sphere);
    };
  }, [planet]);

  const handleClose = () => {
    setVisible(false);
    onClose(); // Call the onClose callback from the parent component
  };

  if (!visible) {
    return null; // Return null when the overlay is not visible
  }

  return (
    <div className='planet-overlay-container'>
        <div className='planet-left-container'>
          <canvas ref={canvasRef} className="planet-overlay-left" />
        </div>
        <div className="planet-overlay">
            <h2>{planet.name}</h2>
            <h2>Length of one day: {planet.data.dayLength}</h2>
            <h2>Gravity: {planet.data.gravity}. (Earth is 9.8 m/s²)</h2>
            <h2>Interesting trivia: {planet.data.fact}</h2>
            <button onClick={handleClose}>Close</button>
        </div>
    </div>
  );
};

export default PlanetOverlay;
