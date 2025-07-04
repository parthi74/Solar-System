const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 10, 100);
camera.lookAt(0, 0, 0);


const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
const pointLight = new THREE.PointLight(0xffffff, 1.2);
scene.add(ambientLight, pointLight);

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(10, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xffff00 })
);
scene.add(sun);

const stars = new THREE.Points(
  new THREE.BufferGeometry().setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      Array.from({ length: 3000 }, () => (Math.random() - 0.5) * 2000),
      3
    )
  ),
  new THREE.PointsMaterial({ color: 0xffffff, size: 1 })
);
scene.add(stars);

const planetData = [
  { name: "Mercury", color: 0xaaaaaa, size: 1, distance: 15, speed: 0.02 },
  { name: "Venus", color: 0xffcc00, size: 1.5, distance: 20, speed: 0.015 },
  { name: "Earth", color: 0x0033ff, size: 2, distance: 25, speed: 0.01 },
  { name: "Mars", color: 0xff3300, size: 1.2, distance: 30, speed: 0.008 },
  { name: "Jupiter", color: 0xff9900, size: 4, distance: 40, speed: 0.006 },
  { name: "Saturn", color: 0xffcc66, size: 3.5, distance: 50, speed: 0.005 },
  { name: "Uranus", color: 0x66ccff, size: 2.5, distance: 60, speed: 0.004 },
  { name: "Neptune", color: 0x3366ff, size: 2.5, distance: 70, speed: 0.003 }
];

const planets = [], pivots = [], speeds = {};
const controls = document.getElementById('controls');

planetData.forEach(data => {
  const geometry = new THREE.SphereGeometry(data.size, 32, 32);
  const material = new THREE.MeshStandardMaterial({ color: data.color });
  const mesh = new THREE.Mesh(geometry, material);
  const pivot = new THREE.Object3D();
  pivot.add(mesh);
  mesh.position.x = data.distance;
  scene.add(pivot);
  planets.push(mesh);
  pivots.push(pivot);
  speeds[data.name] = data.speed;

  if (data.name === "Saturn" || data.name === "Uranus") {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(data.size + 0.5, data.size + 1.5, 64),
      new THREE.MeshBasicMaterial({ color: data.color, side: THREE.DoubleSide })
    );
    ring.rotation.x = Math.PI / 2;
    mesh.add(ring);
  }

  const orbit = new THREE.Mesh(
    new THREE.RingGeometry(data.distance - 0.05, data.distance + 0.05, 64),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.2 })
  );
  orbit.rotation.x = Math.PI / 2;
  scene.add(orbit);

  if (data.name === "Earth" || data.name === "Jupiter") {
    const moonPivot = new THREE.Object3D();
    mesh.add(moonPivot);
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(data.name === "Earth" ? 0.3 : 0.6, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xaaaaaa })
    );
    moon.position.x = data.name === "Earth" ? 3 : 5;
    moonPivot.add(moon);
    mesh.userData.moonPivot = moonPivot;
  }

  const label = document.createElement('label');
  label.textContent = `${data.name} Speed`;
  const input = document.createElement('input');
  input.type = 'range';
  input.min = '0';
  input.max = '0.05';
  input.step = '0.001';
  input.value = data.speed;
  input.oninput = e => speeds[data.name] = parseFloat(e.target.value);
  controls.appendChild(label);
  controls.appendChild(input);
});

let paused = false;
document.getElementById('pauseBtn').onclick = () => {
  paused = !paused;
  document.getElementById('pauseBtn').textContent = paused ? "Resume" : "Pause";
};

const raycaster = new THREE.Raycaster(), mouse = new THREE.Vector2();
const tooltip = document.getElementById('tooltip');

window.addEventListener('mousemove', e => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(planets);
  if (hits.length > 0) {
    const p = hits[0].object;
    const match = planetData.find(d => d.color === p.material.color.getHex());
    if (match) {
      tooltip.textContent = match.name;
      tooltip.style.left = e.clientX + 10 + 'px';
      tooltip.style.top = e.clientY + 10 + 'px';
      tooltip.style.display = 'block';
    }
  } else {
    tooltip.style.display = 'none';
  }
});

function animate() {
  requestAnimationFrame(animate);
  if (!paused) {
    planetData.forEach((d, i) => {
      pivots[i].rotation.y += speeds[d.name];
    });

    planets.forEach(p => {
      if (p.userData.moonPivot) {
        p.userData.moonPivot.rotation.y += 0.05;
      }
    });
  }
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
