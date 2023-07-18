import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import * as THREE from 'three';
import vertexShader from './shaders/vertex.glsl?raw'
import fragmentShader from './shaders/fragment.glsl?raw'
import sunFragment from './shaders/sunFragment.glsl?raw'
import sunVertex from './shaders/sunVertex.glsl?raw'
import sunFragmentLayer from './shaders/sunFragmentLayer.glsl?raw'
import sunVertexLayer from './shaders/sunVertexLayer.glsl?raw'
import sunVertexGlow from './shaders/sunVertexGlow.glsl?raw';
import sunFragmentGlow from './shaders/sunFragmentGlow.glsl?raw';
import atmosphereVertexShader from './shaders/atmosphereVertex.glsl?raw'
import atmosphereFragmentShader from './shaders/atmosphereFragment.glsl?raw'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer'
import PlanetOverlay from './components/planetInfo';

function App() {
  const clock = new THREE.Clock();
  let planets = [];
  const scaleVector = new THREE.Vector3();
  let timestamp = 0;
  let time = 0;
  let cubeCamera, cubeRenderTarget, materialPerlin;

  const controlsRef = useRef(null);

  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [planetRenderer, setPlanetRenderer] = useState(null);

  useEffect(() => {
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    const canvas = document.getElementById('myThreeJsCanvas');
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
    })
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    // renderer.physicallyCorrectLights = true;
    document.body.appendChild(renderer.domElement);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = "8px";
    labelRenderer.domElement.style.pointerEvents = 'none';
    document.body.appendChild(labelRenderer.domElement);

    // CLICKING
    const onCanvasClick = (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(scene.children, true);

      for (const intersect of intersects) {
        if(intersect.object.name) {
          const planet = intersect.object;
          setSelectedPlanet(planet);
        }
      }
    };

    canvas.addEventListener('click', onCanvasClick);

    // const interaction = new InteractionManager(renderer, scene, camera);

    // Creating the sun
    const sunMaterial = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives: enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        uPerlin: { value: null },
        resolution: { value: new THREE.Vector4() },
      },
      vertexShader: sunVertexLayer,
      fragmentShader: sunFragmentLayer
    })

    const sun = new THREE.SphereGeometry(5, 50, 50);

    const sunMesh = new THREE.Mesh(sun, sunMaterial);

    scene.add(sunMesh);

    // Sun's glow
    // const sunGlow = new THREE.ShaderMaterial({
    //   extensions: {
    //     derivatives: "#extension GL_OES_standard_derivatives: enable"
    //   },
    //   side: THREE.BackSide,
    //   uniforms: {
    //     time: { value: 0 },
    //     uPerlin: { value: null },
    //     resolution: { value: new THREE.Vector4() },
    //   },
    //   // transparent: true,
    //   vertexShader: sunVertexGlow,
    //   fragmentShader: sunFragmentGlow
    // })

    // const sunGlowGeometry = new THREE.SphereGeometry(6.2, 50, 50);

    // const sunGlowMesh = new THREE.Mesh(sunGlowGeometry, sunGlow);

    // scene.add(sunGlowMesh);

    // create a sphere
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(5, 50, 50), new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        globeTexture: {
          value: new THREE.TextureLoader().load('../src/assets/img/sun.jpeg')
        }
      }
    }));   

    sphere.name = 'Sol'

    // create atmosphere
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(5, 50, 50),
      new THREE.ShaderMaterial({
        vertexShader: atmosphereVertexShader,
        fragmentShader: atmosphereFragmentShader,
        uniforms: {
          time: { value: 0 }, // Add a uniform for time
          resolution: { value: new THREE.Vector2() }, // Add a uniform for resolution
        },
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
      })
    ); 
    
    atmosphere.scale.set(1.1, 1.1, 1.1)

    // scene.add(atmosphere)

    const group = new THREE.Group()
    // group.add(sphere)
    scene.add(group)

    // Get rotation speed of planet
    function rotationSpeed(hours) {
      const seconds = hours * 60 * 60;
      const radsPerHour = (2 * Math.PI) / seconds;

      return (radsPerHour * 10) * 2;
    }

    // Create a planet
    const createPlanet = function(name, radius, orbit, speed, img, hours) {
      const planet = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 16), new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          globeTexture: {
            value: new THREE.TextureLoader().load(img)
          }
        }
      })); 

      // console.log(test)

      const geom = new THREE.SphereGeometry(radius, 32, 16);
      var mat = new THREE.Mesh(new THREE.SphereGeometry(5, 50, 50), new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          globeTexture: {
            value: new THREE.TextureLoader().load(img)
          }
        }
      }));  
      planet.userData.orbit = orbit;
      planet.userData.speed = speed;
      planet.name = name;
      planet.hours = hours;
  
      var canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      var ctx = canvas.getContext("2d");
      ctx.font = "44pt Arial";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.strokeStyle = "black";
      ctx.lineWidth = 8;
      ctx.strokeText(name, 128, 46);
      ctx.fillText(name, 128, 46);
      
      //console.log(ctx);
      var tex = new THREE.Texture(canvas);
      tex.needsUpdate = true;
      var spriteMat = new THREE.SpriteMaterial({
        map: tex
      });
      var sprite = new THREE.Sprite(spriteMat);
  
      planet.add(sprite);
      planets.push(planet);
      group.add(planet);
  
      //orbit
      var shape = new THREE.Shape();
      shape.moveTo(orbit, 0);
      shape.absarc(0, 0, orbit, 0, 2 * Math.PI, false);
      var spacedPoints = shape.getSpacedPoints(128);
      var orbitGeom = new THREE.BufferGeometry().setFromPoints(spacedPoints); 
      orbitGeom.rotateX((-90 * Math.PI) / 180);
      var orbit = new THREE.Line(orbitGeom, new THREE.LineBasicMaterial({
        color: "white"
      }));
      scene.add(orbit);
    };

    createPlanet("Mercury", 1, 10, 5, '../src/assets/img/mercury.jpeg', 1408);
    createPlanet("Venus", 1.5, 20, 3, '../src/assets/img/venus.jpeg', 5832);
    createPlanet("Earth", 2, 30, 4, '../src/assets/img/earth.jpg', 24);
    createPlanet("Mars", 1.8, 40, 2, '../src/assets/img/mars.jpeg', 25);
    createPlanet("Jupiter", 3, 60, 0.8, '../src/assets/img/jupiter.jpeg', 10);
    createPlanet("Saturn", 2.5, 70, 0.5, '../src/assets/img/saturn.jpeg', 11);
    createPlanet("Uranus", 1.75, 80, 0.4, '../src/assets/img/uranus.jpeg', 17);
    createPlanet("Neptune", 0.8, 90, 0.2, '../src/assets/img/neptune.jpeg', 16);

    // Text
    const p = document.createElement('p');
    p.textContent = sphere.name;
    const cPointLabel = new CSS2DObject(p);
    //scene.add(cPointLabel);

    // const div = document.createElement('div');
    // div.appendChild(p);
    // const divContainer = new CSS2DObject(div);
    // scene.add(divContainer);

    // Line
    const material = new THREE.LineBasicMaterial({
      color: 0x0000ff
    });
    
    const points = [];
    points.push( new THREE.Vector3( sphere.position.x, sphere.position.y, sphere.position.z ) );
    points.push( new THREE.Vector3( sphere.position.x + 10, sphere.position.y - 10, sphere.position.z ) );
    points.push( new THREE.Vector3( sphere.position.x + 15, sphere.position.y - 10, sphere.position.z ) );
    
    const geometry = new THREE.BufferGeometry().setFromPoints( points );
    
    const line = new THREE.Line( geometry, material );
    scene.add( line );

    // scene.add(text_box)
    const last_point = points.length - 1
    // text_box.position.set(points[last_point].x, points[last_point].y, points[last_point].z);

    // Text Box
    const textBoxPoints = [];
    textBoxPoints.push( new THREE.Vector3( points[last_point].x, points[last_point].y - 2.5, points[last_point].z ) );
    textBoxPoints.push( new THREE.Vector3( points[last_point].x, points[last_point].y + 2.5, points[last_point].z ) );
    textBoxPoints.push( new THREE.Vector3( points[last_point].x + 5, points[last_point].y + 2.5, points[last_point].z ) );
    textBoxPoints.push( new THREE.Vector3( points[last_point].x + 5, points[last_point].y - 2.5, points[last_point].z ) );
    textBoxPoints.push( new THREE.Vector3( points[last_point].x, points[last_point].y - 2.5, points[last_point].z ) );
    
    const textBoxGeometry = new THREE.BufferGeometry().setFromPoints( textBoxPoints );
    
    const textBoxLine = new THREE.Line( textBoxGeometry, material );
    scene.add( textBoxLine );

    cPointLabel.position.set(textBoxPoints[2].x - 2.5, textBoxPoints[2].y - 2.5, textBoxPoints[2].z);

    // const starGeometry = new THREE.BufferGeometry(5, 32)
    // const starMaterial = new THREE.MeshBasicMaterial({
    //   color: 0xffffff
    // })

    let starGeometry = new THREE.CircleGeometry( 5, 32 );
    let starMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff } );

    // const starVertices = []
    // for(let i = 0; i < 10000; i++) {
    //   const x = (Math.random() - 0.5) * 2000
    //   const y = (Math.random() - 0.5) * 2000 
    //   const z = -Math.random()  * 2000
    //   starVertices.push(x, y, z)
    // }

    // starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3))

    // const stars = new THREE.Mesh(starGeometry, starMaterial);
    

    for(let i = 0; i < 10000; i++) {
      let scale = (Math.random() - 0.5) * 0.2
      if(scale > 0.005 || scale < 0.005) {
        scale *= 0.5
      }
      let stars = new THREE.Mesh( starGeometry, starMaterial );
      stars.position.set((Math.random() - 0.5) * 2000, (Math.random() - 0.5) * 2000 , -Math.random()  * 2000)
      stars.scale.set(scale, scale, 1)
      scene.add(stars)
    }

    camera.position.z = 15;

    // const mouse = {
    //   x: event.clientX,
    //   y: event.clientY
    // }

    controlsRef.current = new OrbitControls(camera, renderer.domElement);
    controlsRef.current.minDistance = 10;
    controlsRef.current.maxDistance = 150;
    controlsRef.current.enableZoom = true;

    // const cubeRenderTarget = new THREE.CubeCamera(0.1, 1000, 256);
    // cubeRenderTarget.position.copy(sunMesh.position);
    // cubeRenderTarget.update(renderer, scene);
    // scene.add(cubeRenderTarget);

    // sunMaterial.envMap = cubeRenderTarget.texture;
    // sphere.material.envMap = cubeRenderTarget.texture;

    const addTexture = () => {
      cubeRenderTarget = new THREE.WebGLCubeRenderTarget( 256 );

      cubeCamera = new THREE.CubeCamera(0.1, 10, cubeRenderTarget);

      materialPerlin = new THREE.ShaderMaterial({
        extensions: {
          derivatives: "#extension GL_OES_standard_derivatives: enable"
        },
        side: THREE.DoubleSide,
        uniforms: {
          time: { value: 0 },
          resolution: { value: new THREE.Vector4() ,}
        },
        vertexShader: sunVertex,
        fragmentShader: sunFragment
      })
      
      const sun = new THREE.SphereGeometry(4.9, 50, 50);

      const perlin = new THREE.Mesh(sun, materialPerlin);

      scene.add(perlin);
    }

    addTexture()

    const render = () => {
      requestAnimationFrame(render);
      renderer.render(scene, camera);
      controlsRef.current.update();

      
      sunMesh.visible = false; // Feedback loop fix
      cubeCamera.update( renderer, scene );
      sunMesh.visible = true;
      sunMaterial.uniforms.uPerlin.value = cubeRenderTarget.texture;

      time += 0.05;
      sunMaterial.uniforms.time.value = time;
      materialPerlin.uniforms.time.value = time;

      // Update time uniform
      atmosphere.material.uniforms.time.value = clock.getElapsedTime();
      // Update resolution uniform
      atmosphere.material.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
    };


    render();

    let isDragging = false;
    let previousMouse = { x: 0, y: 0 }
    let momentumX = 0;
    let momentumY = 0;
    let momentumDecay = 0.95;

    const animate = () => {
      timestamp = Date.now() * 0.0001;
      window.requestAnimationFrame(animate);

      labelRenderer.render(scene, camera);

      renderer.render(scene, camera);
      sphere.rotation.y += 0.001

      planets.forEach(function(planet) {
    
        var scaleFactor = 8;
        var sprite = planet.children[0];
        var scale = scaleVector.subVectors(planet.position, camera.position).length() / scaleFactor;
        sprite.scale.set(scale, scale, 1);
        var orbit = planet.userData.orbit;
        var speed = planet.userData.speed;
        let sp = rotationSpeed(planet.hours)
        planet.rotation.y += sp
        planet.position.x = Math.cos(timestamp * speed) * orbit;
        planet.position.z = Math.sin(timestamp * speed) * orbit;
      });
    };
    animate();
  
    
    // addEventListener('mousedown', (event) => {
    //   isDragging = true;
    //   previousMouse.x = event.clientX;
    //   previousMouse.y = event.clientY;
    //   momentumX = 0;
    //   momentumY = 0;
    // });

    // addEventListener('mousemove', () => {
    //   if(down) {
    //     mouse.x = (event.clientX / innerWidth) * 2 - 1
    //     mouse.y = -(event.clientY / innerHeight) * 2 + 1
    //   }
    // })
    
    // addEventListener('mouseup', () => {
    //   isDragging = false;
    // });
    
    // addEventListener('mousemove', (event) => {
    //   if (isDragging) {
    //     const deltaMouseX = event.clientX - previousMouse.x;
    //     const deltaMouseY = event.clientY - previousMouse.y;
        
    //     previousMouse.x = event.clientX;
    //     previousMouse.y = event.clientY;

    //     gsap.to(group.rotation, {
    //       x: `-=${-deltaMouseY * 0.01}`,
    //       y: `+=${deltaMouseX * 0.01}`,
    //       duration: 0.5
    //     });
    //   }
    // });

    // if (!isDragging) {
    //   gsap.to(group.rotation, {
    //     x: `+=${momentumY}`,
    //     y: `+=${momentumX}`,
    //     duration: 0.1,
    //   });

    //   momentumX *= momentumDecay;
    //   momentumY *= momentumDecay;
    // }

    window.addEventListener('resize', function() {
      renderer.setSize(window.innerWidth, window.innerHeight);
      labelRenderer.setSize(this.window.innerWidth, this.window.innerHeight)
    })

    return () => {
      canvas.removeEventListener('click', onCanvasClick);
      controlsRef.current.dispose();
    };
  }, [])

  const handleCloseOverlay = () => {
    setSelectedPlanet(false);
  };

  const handleOpenOverlay = () => {
    setShowOverlay(true);
  };

  return (
    <div className='App'>
      <canvas id='myThreeJsCanvas' />
      {selectedPlanet && <PlanetOverlay planet={selectedPlanet} image={selectedPlanet.material.uniforms.globeTexture.value.source.data.currentSrc} onClose={handleCloseOverlay} />}
    </div>
  )
}

export default App
