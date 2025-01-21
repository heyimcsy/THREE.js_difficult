import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { convertLatLngToPos, getGradientCanvas } from './utils.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

export default function () {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
  });

  renderer.outputEncoding = THREE.sRGBEncoding;

  const effectComposer = new EffectComposer(
    renderer
  )
  const textureLoader = new THREE.TextureLoader();
  const cubeTextLoader = new THREE.CubeTextureLoader();
  const environmentMap = cubeTextLoader.load([
    'assets/environments/px.png',
    'assets/environments/nx.png',
    'assets/environments/py.png',
    'assets/environments/ny.png',
    'assets/environments/pz.png',
    'assets/environments/nz.png',
  ]);

  environmentMap.encoding = THREE.sRGBEncoding;

  const container = document.querySelector('#container');

  container.appendChild(renderer.domElement);

  const canvasSize = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  const scene = new THREE.Scene();
  scene.background = environmentMap;
  scene.environment = environmentMap;

  const camera = new THREE.PerspectiveCamera(
    75,
    canvasSize.width / canvasSize.height,
    0.1,
    100
  );
  camera.position.set(0, 0, 3);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;

  const addLight = () => {
    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(2.65, 2.13, 1.02)
    scene.add(light)
  }

  const addPostEffects = () => {
    const renderPass = new RenderPass(scene, camera);
    effectComposer.addPass(renderPass);

    //노이즈 효과를 넣어 주는데 0~1 사이로 넣어 주면 된다.
    const filmPass = new FilmPass(1, 1, 4096, false);
    //직접 속성에 접근해서 value 값을 적용해줄 수 있다.
    // filmPass.uniforms.nIntensity.value = 1;
    // filmPass.uniforms.sIntensity.value = 0.7;
    // filmPass.uniforms.sCount.value = 1000;
    // filmPass.uniforms.grayscale.value = true;
    effectComposer.addPass(filmPass);

    const shaderPass = new ShaderPass(GammaCorrectionShader);
    effectComposer.addPass(shaderPass);
  }

  const createEarth1 = () => {
    // MeshBasicMaterial     or MeshStandardMaterial 조명이 필요하다
    const material = new THREE.MeshStandardMaterial({
      map: textureLoader.load('assets/earth-night-map.jpg'),
      side: THREE.FrontSide,
      opacity: 0.6,
      transparent: true,
    })

    //sphere geometry 는 동그란 물체를 형성할 때 제일 많이 사용한다.
    const geometry = new THREE.SphereGeometry(1.3, 50, 50)

    const mesh = new THREE.Mesh(geometry, material)
    mesh.rotation.y = - Math.PI / 2;

    return mesh
  };

  const createEarth2 = () => {
    const material = new THREE.MeshStandardMaterial({
      map: textureLoader.load('assets/earth-night-map.jpg'),
      opacity: 0.9,
      transparent: true,
      side: THREE.BackSide,
    })
// side는 mesh의 어느 방면을 렌더링 할 것인지 결정하는 옵션 FrontSide, BackSide
    const geometry = new THREE.SphereGeometry(1.5, 50,50)

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.y = - Math.PI / 2;

    return mesh
  }

  const createStar = (count ) => {
    const positions = new Float32Array(count * 3);
    for(let i = 0; i <= count; i++){
      positions[i] = (Math.random() - 0.5) * 5;
      positions[i + 1] =(Math.random() - 0.5) * 5;
      positions[i + 2] = (Math.random() - 0.5) * 5;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.01,
      transparent: true,
      map: textureLoader.load('assets/particle.png'),
      alphaMap: textureLoader.load('assets/particle.png'),
      depthWrite: false,
      color: 0xbcc6c6
    })

    const star = new THREE.Points(particleGeometry, particleMaterial);

    return star
  }

  const createPoint1 = () => {
    //좌표값을 라디안으로 변경해주어야 한다.
    const point = {
      lat: 37.56668 * (Math.PI / 180),
      lng: 126.97841 * (Math.PI / 180)
    }

    const position = convertLatLngToPos(point, 1.3);

    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.02, 0.002,20, 20),
      new THREE.MeshBasicMaterial({color: 0x263d64})
    );
    mesh.position.set(position.x, position.y, position.z)
    mesh.rotation.set(0.9, 2.46, 1)

    return mesh
  }

  const createPoint2 = () => {
    //좌표값을 라디안으로 변경해주어야 한다.
    const point = {
      lat: 5.55363 * (Math.PI / 180),
      lng: -0.196481 * (Math.PI / 180)
    }

    const position = convertLatLngToPos(point, 1.3);

    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.02, 0.002,20, 20),
      new THREE.MeshBasicMaterial({color: 0x263d64})
    );
    mesh.position.set(position.x, position.y, position.z)

    return mesh
  }

  const createCurve = (pos1, pos2) => {
    const points = [];
    for(let i = 0;  i <= 100; i++){
      const pos = new THREE.Vector3().lerpVectors(pos1, pos2, i/100);
      pos.normalize();
      const wave = Math.sin((Math.PI * i) / 100);

      pos. multiplyScalar(1.3 + 0.4 * wave)
      points.push(pos);
    }
    // tube geometry 사용할 것이다.
    const curve =  new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.TubeGeometry(
      curve,
      20,
      0.003,
    )

    const gradientCanvas = getGradientCanvas('#757F94', '#263D74')
    const texture =  new THREE.CanvasTexture(gradientCanvas);

    const material = new THREE.MeshBasicMaterial({
      // color: 0x263d64
      map: texture
    })
    const mesh = new THREE.Mesh(geometry, material);

    return mesh
  }

  const create = () => {
    const earthGroup = new THREE.Group();
    const earth1 = createEarth1();
    const earth2 = createEarth2();
    const star = createStar(1000);
    const point1 = createPoint1();
    const point2 = createPoint2();
    const curve = createCurve(point1.position, point2.position);

    earthGroup.add(earth1, earth2, point1, point2, curve);
    scene.add(star,earthGroup);

    return{
      earthGroup,
      star
    }
  }

  const resize = () => {
    canvasSize.width = window.innerWidth;
    canvasSize.height = window.innerHeight;

    camera.aspect = canvasSize.width / canvasSize.height;
    camera.updateProjectionMatrix();

    renderer.setSize(canvasSize.width, canvasSize.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    effectComposer.setSize(canvasSize.width, canvasSize.height);
  };

  const addEvent = () => {
    window.addEventListener('resize', resize);
  };

  const draw = (obj) => {
    const {earthGroup,  star} = obj;
    earthGroup.rotation.x += 0.0005;
    earthGroup.rotation.y += 0.0005;

    star.rotation.x += 0.001;
    star.rotation.y += 0.001;

    controls.update();
    effectComposer.render();

    // renderer.render(scene, camera);
    requestAnimationFrame(() => {
      draw(obj);
    });
  };

  const initialize = () => {
    const obj = create();
    addLight();
    addPostEffects();
    addEvent();
    resize();
    draw(obj);
  };

  initialize();
}
