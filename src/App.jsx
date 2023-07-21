import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import * as THREE from 'three';
import vertexShader from './shaders/vertex.glsl?raw'
import fragmentShader from './shaders/fragment.glsl?raw'
import sunFragment from './shaders/sun/sunFragment.glsl?raw'
import sunVertex from './shaders/sun/sunVertex.glsl?raw'
import sunFragmentLayer from './shaders/sun/sunFragmentLayer.glsl?raw'
import sunVertexLayer from './shaders/sun/sunVertexLayer.glsl?raw'
import sunVertexGlow from './shaders/sun/glow/sunVertexGlow.glsl?raw';
import sunFragmentGlow from './shaders/sun/glow/sunFragmentGlow.glsl?raw';
import atmosphereVertexShader from './shaders/atmosphereVertex.glsl?raw'
import atmosphereFragmentShader from './shaders/atmosphereFragment.glsl?raw'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer'
import PlanetOverlay from './components/PlanetInfo/PlanetInfo';
import Welcome from './components/Welcome/Welcome'

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
  const [welcome, setWelcome] = useState(true);

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
    const createPlanet = function(name, radius, orbit, speed, img, hours, data) {
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
      const mat = new THREE.Mesh(new THREE.SphereGeometry(5, 50, 50), new THREE.ShaderMaterial({
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
      planet.data = data;
  
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");
      ctx.font = "44pt Arial";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.strokeStyle = "black";
      ctx.lineWidth = 8;
      ctx.strokeText(name, 128, 46);
      ctx.fillText(name, 128, 46);
      
      //console.log(ctx);
      let tex = new THREE.Texture(canvas);
      tex.needsUpdate = true;
      let spriteMat = new THREE.SpriteMaterial({
        map: tex
      });
      let sprite = new THREE.Sprite(spriteMat);
  
      planet.add(sprite);
      planets.push(planet);
      group.add(planet);
  
      //orbit
      let shape = new THREE.Shape();
      shape.moveTo(orbit, 0);
      shape.absarc(0, 0, orbit, 0, 2 * Math.PI, false);
      let spacedPoints = shape.getSpacedPoints(128);
      let orbitGeom = new THREE.BufferGeometry().setFromPoints(spacedPoints); 
      orbitGeom.rotateX((-90 * Math.PI) / 180);
      var orbit = new THREE.Line(orbitGeom, new THREE.LineBasicMaterial({
        color: "white"
      }));
      scene.add(orbit);
    };

    createPlanet("Mercury", 1, 10, 5, '../src/assets/img/mercury.jpeg', 1408,
      {
        'dayLength': '4226 hours',
        'gravity': '3.7 m/s²',
        'diameter': '4879 km',
        'fact': 'Mercury is the smallest planet in our solar system – only slightly larger than Earth\'s Moon.'
      }
    );
    createPlanet("Venus", 1.5, 20, 3, '../src/assets/img/venus.jpeg', 5832,
      {
        'dayLength': '2802 hours',
        'gravity': '8.9 m/s²',
        'diameter': '12,104 km',
        'fact': 'Venus rotates very slowly on its axis – one day on Venus lasts 243 Earth days. The planet orbits the Sun faster than Earth, however, so one year on Venus takes only about 225 Earth days, making a Venusian day longer than its year!'
      }
    );
    createPlanet("Earth", 2, 30, 4, '../src/assets/img/earth.jpg', 24,
      {
        'dayLength': '24 hours',
        'gravity': '9.8 m/s²',
        'diameter': '12,756 km',
        'fact': 'Earth\'s atmosphere is 78 percent nitrogen, 21 percent oxygen and 1 percent other ingredients—the perfect balance to breathe and live.'
      }
    );
    createPlanet("Mars", 1.8, 40, 2, '../src/assets/img/mars.jpeg', 25,
      {
        'dayLength': '24.7 hours',
        'gravity': '3.7 m/s²',
        'diameter': '6792 km',
        'fact': 'Mars is known as the Red Planet because iron minerals in the Martian soil oxidize, or rust, causing the soil and atmosphere to look red.'
      }
    );
    createPlanet("Jupiter", 3, 60, 0.8, '../src/assets/img/jupiter.jpeg', 10,
      {
        'dayLength': '9.9 hours',
        'gravity': '23.1 m/s²',
        'diameter': '142,984 km',
        'fact': 'Eleven Earths could fit across Jupiter\'s equator. If Earth were the size of a grape, Jupiter would be the size of a basketball.'
      }
    );
    createPlanet("Saturn", 2.5, 70, 0.5, '../src/assets/img/saturn.jpeg', 11,
      {
        'dayLength': '10.7 hours',
        'gravity': '9 m/s²',
        'diameter': '120,536 km',
        'fact': 'Saturn is a gas-giant planet and therefore does not have a solid surface like Earth\'s. But it might have a solid core somewhere in there.'
      }
    );
    createPlanet("Uranus", 1.75, 80, 0.4, '../src/assets/img/uranus.jpeg', 17,
      {
        'dayLength': '17.2 hours',
        'gravity': '8.7 m/s²',
        'diameter': '51,118 km',
        'fact': 'Uranus has 27 known moons, and they are named after characters from the works of William Shakespeare and Alexander Pope.'
      }
    );
    createPlanet("Neptune", 0.8, 90, 0.2, '../src/assets/img/neptune.jpeg', 16,
      {
        'dayLength': '16.1 hours',
        'gravity': '11 m/s²',
        'diameter': '49,528 km',
        'fact': 'Neptune is an ice giant. Most of its mass is a hot, dense fluid of "icy" materials – water, methane and ammonia – above a small rocky core.'
      }
    );

    // Text
    const p = document.createElement('p');
    p.textContent = sphere.name;
    const cPointLabel = new CSS2DObject(p);
    //scene.add(cPointLabel);

    // const div = document.createElement('div');
    // div.appendChild(p);
    // const divContainer = new CSS2DObject(div);
    // scene.add(divContainer);

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

  const handleCloseWelcome = () => {
    setWelcome(false);
  };

  const handleOpenOverlay = () => {
    setShowOverlay(true);
  };

  return (
    <div className='App'>
      <canvas id='myThreeJsCanvas' />
      {welcome && <Welcome onClose={handleCloseWelcome} />}
      {selectedPlanet && <PlanetOverlay planet={selectedPlanet} image={selectedPlanet.material.uniforms.globeTexture.value.source.data.currentSrc} onClose={handleCloseOverlay} />}
    </div>
  )
}

export default App
