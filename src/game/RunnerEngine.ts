import * as THREE from 'three';
import { Lane, ObstacleType, PowerupType, CameraViewMode, GameStats, ActivePowerups } from '../types';
import { sound } from './SoundEngine';

export class RunnerEngine {
  public container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private animFrameId: number | null = null;

  // Track & Lane setup
  public readonly LANE_WIDTH = 3.4;
  public currentLane: Lane = 0;
  public targetLane: Lane = 0;
  public laneProgress = 1; // 0 to 1 transition
  public playerX = 0;
  public playerY = 0;
  public playerZ = 0;
  public playerVelocityY = 0;
  public isJumping = false;
  public isSliding = false;
  public slideTimer = 0;
  public jumpDuration = 0.65;
  public jumpTime = 0;

  // Speeds & Gameplay
  public baseSpeed = 42;
  public currentSpeed = 42;
  public speedMultiplier = 1;
  public distanceTraveled = 0;
  public isPlaying = false;
  public isPaused = false;
  public isGameOver = false;

  // Power-ups
  public activePowerups: ActivePowerups = {
    nitro: 0,
    magnet: 0,
    shield: false,
  };

  // Upgrades
  public upgrades = {
    nitroDuration: 1,
    magnetDuration: 1,
    coinMultiplier: 1,
  };

  // Stats
  public stats: GameStats = {
    score: 0,
    highScore: 0,
    coins: 0,
    totalCoins: 0,
    distance: 0,
    multiplier: 10,
    nearMisses: 0,
    rickshawsDodged: 0,
    busesDodged: 0,
    nitroUsed: 0,
  };

  // 3D Objects
  private playerGroup: THREE.Group;
  private carBodyMesh: THREE.Mesh | null = null;
  private carAccentMesh: THREE.Mesh | null = null;
  private wheels: THREE.Mesh[] = [];
  private nitroFlames: THREE.Group;
  private shieldBubble: THREE.Mesh | null = null;
  private magnetAura: THREE.Group;
  private roadChunks: THREE.Group[] = [];
  private sceneryChunks: THREE.Group[] = [];
  private obstacles: { group: THREE.Group; type: ObstacleType; lane: Lane; z: number; width: number; height: number; depth: number; passed: boolean; hit: boolean; wobbleOffset: number }[] = [];
  private coins: { mesh: THREE.Group; lane: Lane; z: number; y: number; collected: boolean; angle: number }[] = [];
  private powerupItems: { group: THREE.Group; type: PowerupType; lane: Lane; z: number; y: number; collected: boolean }[] = [];
  private particles: { mesh: THREE.Mesh; vx: number; vy: number; vz: number; life: number; maxLife: number }[] = [];
  private speedLines: THREE.LineSegments | null = null;

  // Camera settings
  public cameraMode: CameraViewMode = 'low-angle';
  private cameraBaseY = 2.2;
  private cameraBaseZ = -7.5;
  private cameraLookY = 1.6;
  private cameraShake = 0;

  // Spawning controls
  private nextObstacleZ = 50;
  private nextCoinGroupZ = 30;
  private nextPowerupZ = 90;
  private clock = new THREE.Clock();

  // Callbacks for UI updates
  public onStatsUpdate?: (stats: GameStats, powerups: ActivePowerups) => void;
  public onGameOver?: (stats: GameStats) => void;
  public onPowerupCollect?: (type: PowerupType) => void;
  public onNearMiss?: () => void;

  constructor(container: HTMLElement) {
    this.container = container;

    // Create Three.js Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x38bdf8); // Sunny vibrant blue
    this.scene.fog = new THREE.FogExp2(0x7dd3fc, 0.0075);

    // Camera setup - Dynamic low-angle perspective Subway Surfers style
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 400);

    // WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    container.appendChild(this.renderer.domElement);

    // Lights
    this.setupLighting();

    // Player Car
    this.playerGroup = new THREE.Group();
    this.nitroFlames = new THREE.Group();
    this.magnetAura = new THREE.Group();
    this.buildPlayerCar();
    this.scene.add(this.playerGroup);

    // Environment & Tracks
    this.setupEnvironment();
    this.setupSpeedLines();

    // Window resize handler
    window.addEventListener('resize', this.handleResize);

    // Initial Camera Pos
    this.updateCameraPosition(0);
  }

  private setupLighting() {
    // Warm cartoon sunlight
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0xfef08a, 0.7);
    this.scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.6);
    sunLight.position.set(25, 45, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 150;
    sunLight.shadow.camera.left = -25;
    sunLight.shadow.camera.right = 25;
    sunLight.shadow.camera.top = 40;
    sunLight.shadow.camera.bottom = -15;
    sunLight.shadow.bias = -0.0005;
    this.scene.add(sunLight);

    // Secondary fill light for vibrant colors
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.5);
    fillLight.position.set(-20, 20, -10);
    this.scene.add(fillLight);
  }

  private buildPlayerCar(colorHex = 0xfacc15, accentHex = 0xf97316) {
    // Clear existing
    while (this.playerGroup.children.length > 0) {
      this.playerGroup.remove(this.playerGroup.children[0]);
    }
    this.wheels = [];

    const car = new THREE.Group();

    // 1. Lower Chassis
    const chassisGeo = new THREE.BoxGeometry(2.0, 0.45, 4.4);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.5,
      metalness: 0.8,
    });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.y = 0.45;
    chassis.castShadow = true;
    car.add(chassis);

    // 2. Aerodynamic Sports Car Main Body
    const bodyGeo = new THREE.BoxGeometry(1.9, 0.55, 3.8);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.2,
      metalness: 0.6,
    });
    this.carBodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.carBodyMesh.position.set(0, 0.75, -0.1);
    this.carBodyMesh.castShadow = true;
    car.add(this.carBodyMesh);

    // Sloped Front Hood Wedge
    const hoodGeo = new THREE.BoxGeometry(1.85, 0.35, 1.4);
    const hood = new THREE.Mesh(hoodGeo, bodyMat);
    hood.position.set(0, 0.62, 1.8);
    hood.rotation.x = -0.15;
    hood.castShadow = true;
    car.add(hood);

    // Racing Stripe / Accent Line
    const stripeGeo = new THREE.BoxGeometry(0.5, 0.04, 3.9);
    const stripeMat = new THREE.MeshStandardMaterial({
      color: accentHex,
      roughness: 0.3,
      metalness: 0.4,
    });
    this.carAccentMesh = new THREE.Mesh(stripeGeo, stripeMat);
    this.carAccentMesh.position.set(0, 1.04, -0.1);
    car.add(this.carAccentMesh);

    // 3. Cabin / Cockpit Roof & Tinted Glass
    const cabinGeo = new THREE.BoxGeometry(1.45, 0.52, 2.0);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.1,
      metalness: 0.9,
    });
    const cabin = new THREE.Mesh(cabinGeo, glassMat);
    cabin.position.set(0, 1.15, -0.4);
    cabin.castShadow = true;
    car.add(cabin);

    // Front Windshield Slant
    const windshieldGeo = new THREE.BoxGeometry(1.4, 0.48, 0.8);
    const windshield = new THREE.Mesh(windshieldGeo, glassMat);
    windshield.position.set(0, 1.05, 0.7);
    windshield.rotation.x = -0.6;
    car.add(windshield);

    // 4. Aggressive Rear Spoiler
    const spoilerWingGeo = new THREE.BoxGeometry(2.1, 0.08, 0.5);
    const spoilerMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });
    const spoilerWing = new THREE.Mesh(spoilerWingGeo, spoilerMat);
    spoilerWing.position.set(0, 1.45, -2.0);
    car.add(spoilerWing);

    const strutGeo = new THREE.BoxGeometry(0.08, 0.4, 0.1);
    const strutL = new THREE.Mesh(strutGeo, spoilerMat);
    strutL.position.set(-0.7, 1.25, -2.0);
    const strutR = new THREE.Mesh(strutGeo, spoilerMat);
    strutR.position.set(0.7, 1.25, -2.0);
    car.add(strutL, strutR);

    // 5. Dual Front Headlights (Vibrant Glow)
    const headlightGeo = new THREE.BoxGeometry(0.35, 0.15, 0.1);
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const headL = new THREE.Mesh(headlightGeo, headlightMat);
    headL.position.set(-0.65, 0.65, 2.45);
    const headR = new THREE.Mesh(headlightGeo, headlightMat);
    headR.position.set(0.65, 0.65, 2.45);
    car.add(headL, headR);

    // Headlight Spotlights shining ahead
    const lightL = new THREE.SpotLight(0xbae6fd, 2.5, 30, Math.PI / 6, 0.5);
    lightL.position.set(-0.65, 0.7, 2.5);
    lightL.target.position.set(-0.65, 0, 15);
    car.add(lightL);
    car.add(lightL.target);

    const lightR = new THREE.SpotLight(0xbae6fd, 2.5, 30, Math.PI / 6, 0.5);
    lightR.position.set(0.65, 0.7, 2.5);
    lightR.target.position.set(0.65, 0, 15);
    car.add(lightR);
    car.add(lightR.target);

    // 6. Rear Neon Taillights
    const tailLightGeo = new THREE.BoxGeometry(0.45, 0.1, 0.08);
    const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const tailL = new THREE.Mesh(tailLightGeo, tailLightMat);
    tailL.position.set(-0.65, 0.75, -2.25);
    const tailR = new THREE.Mesh(tailLightGeo, tailLightMat);
    tailR.position.set(0.65, 0.75, -2.25);
    car.add(tailL, tailR);

    // Center brake LED strip
    const brakeStripGeo = new THREE.BoxGeometry(0.8, 0.05, 0.05);
    const brakeStrip = new THREE.Mesh(brakeStripGeo, tailLightMat);
    brakeStrip.position.set(0, 0.9, -2.25);
    car.add(brakeStrip);

    // 7. Chrome Wheels with Rubber Tires and Yellow Calipers
    const wheelPositions = [
      [-1.0, 0.42, 1.3],  // Front Left
      [1.0, 0.42, 1.3],   // Front Right
      [-1.0, 0.42, -1.3], // Rear Left
      [1.0, 0.42, -1.3],  // Rear Right
    ];

    wheelPositions.forEach(([x, y, z]) => {
      const wheelGroup = new THREE.Mesh();
      const tireGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.34, 16);
      tireGeo.rotateZ(Math.PI / 2);
      const tireMat = new THREE.MeshStandardMaterial({ color: 0x171717, roughness: 0.8 });
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.castShadow = true;

      const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.36, 8);
      rimGeo.rotateZ(Math.PI / 2);
      const rimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
      const rim = new THREE.Mesh(rimGeo, rimMat);

      wheelGroup.add(tire);
      wheelGroup.add(rim);
      wheelGroup.position.set(x, y, z);
      car.add(wheelGroup);
      this.wheels.push(wheelGroup);
    });

    // 8. Nitro Exhaust Pipes & Flames
    const exhaustL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.25, 8),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9 })
    );
    exhaustL.rotation.x = Math.PI / 2;
    exhaustL.position.set(-0.4, 0.42, -2.3);
    const exhaustR = exhaustL.clone();
    exhaustR.position.x = 0.4;
    car.add(exhaustL, exhaustR);

    // Blazing Nitro Thrusters
    this.nitroFlames = new THREE.Group();
    const flameGeo = new THREE.ConeGeometry(0.18, 1.2, 8);
    flameGeo.rotateX(-Math.PI / 2);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 });
    const flameL = new THREE.Mesh(flameGeo, flameMat);
    flameL.position.set(-0.4, 0.42, -2.8);
    const flameR = flameL.clone();
    flameR.position.x = 0.4;
    this.nitroFlames.add(flameL, flameR);
    this.nitroFlames.visible = false;
    car.add(this.nitroFlames);

    // 9. Forcefield Shield Bubble
    const shieldGeo = new THREE.SphereGeometry(2.4, 24, 24);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.1,
      emissive: 0x9333ea,
      emissiveIntensity: 0.5,
    });
    this.shieldBubble = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldBubble.position.set(0, 0.8, 0);
    this.shieldBubble.visible = false;
    car.add(this.shieldBubble);

    // 10. Magnet Aura Ring
    this.magnetAura = new THREE.Group();
    const ringGeo = new THREE.TorusGeometry(2.2, 0.08, 8, 32);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.6 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    this.magnetAura.add(ring);
    this.magnetAura.position.set(0, 0.4, 0);
    this.magnetAura.visible = false;
    car.add(this.magnetAura);

    this.playerGroup.add(car);
  }

  public setCarColor(bodyHex: string, accentHex: string) {
    if (this.carBodyMesh) {
      (this.carBodyMesh.material as THREE.MeshStandardMaterial).color.set(bodyHex);
    }
    if (this.carAccentMesh) {
      (this.carAccentMesh.material as THREE.MeshStandardMaterial).color.set(accentHex);
    }
  }

  // -------------------------------------------------------------
  // Track & City Environment
  // -------------------------------------------------------------
  private setupEnvironment() {
    // Generate 6 modular road chunks that endlessly tile ahead
    const chunkLength = 60;
    for (let i = 0; i < 6; i++) {
      const roadChunk = this.createRoadChunk(chunkLength);
      roadChunk.position.z = i * chunkLength - 30;
      this.scene.add(roadChunk);
      this.roadChunks.push(roadChunk);

      const sceneryChunk = this.createSceneryChunk(chunkLength);
      sceneryChunk.position.z = i * chunkLength - 30;
      this.scene.add(sceneryChunk);
      this.sceneryChunks.push(sceneryChunk);
    }

    // Fluffy procedural clouds in sky
    this.createClouds();
  }

  private createRoadChunk(length: number): THREE.Group {
    const chunk = new THREE.Group();
    const roadWidth = this.LANE_WIDTH * 3 + 2.0;

    // Asphalt road surface
    const roadGeo = new THREE.PlaneGeometry(roadWidth, length);
    roadGeo.rotateX(-Math.PI / 2);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x27272a, // dark sleek asphalt
      roughness: 0.7,
      metalness: 0.1,
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.receiveShadow = true;
    chunk.add(road);

    // Yellow Dashed Lane Dividers
    const dashLength = 3.5;
    const dashGap = 3.5;
    const numDashes = Math.floor(length / (dashLength + dashGap));

    const lineGeo = new THREE.PlaneGeometry(0.2, dashLength);
    lineGeo.rotateX(-Math.PI / 2);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

    const dividerXOffsets = [-this.LANE_WIDTH / 2, this.LANE_WIDTH / 2];

    dividerXOffsets.forEach(x => {
      for (let d = 0; d < numDashes; d++) {
        const dash = new THREE.Mesh(lineGeo, lineMat);
        dash.position.set(x, 0.02, -length / 2 + d * (dashLength + dashGap) + dashLength / 2);
        chunk.add(dash);
      }
    });

    // Outer Solid White Road Shoulder Lines
    const edgeGeo = new THREE.PlaneGeometry(0.35, length);
    edgeGeo.rotateX(-Math.PI / 2);
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });

    const edgeL = new THREE.Mesh(edgeGeo, edgeMat);
    edgeL.position.set(-roadWidth / 2 + 0.3, 0.02, 0);
    const edgeR = new THREE.Mesh(edgeGeo, edgeMat);
    edgeR.position.set(roadWidth / 2 - 0.3, 0.02, 0);
    chunk.add(edgeL, edgeR);

    // Red & White Striped Curbs
    const curbWidth = 0.8;
    const curbGeo = new THREE.BoxGeometry(curbWidth, 0.35, length);
    const curbMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 });
    const curbL = new THREE.Mesh(curbGeo, curbMat);
    curbL.position.set(-roadWidth / 2 - curbWidth / 2, 0.17, 0);
    curbL.receiveShadow = true;
    const curbR = new THREE.Mesh(curbGeo, curbMat);
    curbR.position.set(roadWidth / 2 + curbWidth / 2, 0.17, 0);
    curbR.receiveShadow = true;
    chunk.add(curbL, curbR);

    // Sidewalk
    const sidewalkGeo = new THREE.BoxGeometry(10, 0.3, length);
    const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9 });
    const walkL = new THREE.Mesh(sidewalkGeo, sidewalkMat);
    walkL.position.set(-roadWidth / 2 - curbWidth - 5, 0.15, 0);
    walkL.receiveShadow = true;
    const walkR = new THREE.Mesh(sidewalkGeo, sidewalkMat);
    walkR.position.set(roadWidth / 2 + curbWidth + 5, 0.15, 0);
    walkR.receiveShadow = true;
    chunk.add(walkL, walkR);

    return chunk;
  }

  private createSceneryChunk(length: number): THREE.Group {
    const chunk = new THREE.Group();
    const buildingColors = [0x38bdf8, 0xf43f5e, 0x10b981, 0x8b5cf6, 0xf59e0b, 0x06b6d4, 0x64748b];

    // Buildings on Left & Right Sides (Stylized Cartoon Low-Poly Skyscrapers)
    const sides = [-1, 1];
    sides.forEach(side => {
      const numBuildings = 5;
      for (let b = 0; b < numBuildings; b++) {
        const height = 20 + Math.random() * 35;
        const width = 8 + Math.random() * 6;
        const depth = 8 + Math.random() * 5;
        const color = buildingColors[Math.floor(Math.random() * buildingColors.length)];

        const bGeo = new THREE.BoxGeometry(width, height, depth);
        const bMat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.1 });
        const building = new THREE.Mesh(bGeo, bMat);

        const posX = side * (14 + width / 2 + Math.random() * 6);
        const posZ = -length / 2 + (b * length) / numBuildings + depth / 2;
        building.position.set(posX, height / 2, posZ);
        building.castShadow = true;
        building.receiveShadow = true;
        chunk.add(building);

        // Windows (Stylized Grid Panels)
        const windowGeo = new THREE.BoxGeometry(0.6, 0.8, 0.05);
        const windowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a }); // glowing warm windows
        const cols = Math.floor(width / 2.2);
        const rows = Math.floor(height / 4);

        for (let r = 1; r < Math.min(rows, 8); r++) {
          for (let c = 0; c < cols; c++) {
            if (Math.random() > 0.3) {
              const win = new THREE.Mesh(windowGeo, windowMat);
              win.position.set(
                posX + (side > 0 ? -width / 2 - 0.04 : width / 2 + 0.04),
                r * 3.5 + 4,
                posZ - width / 3 + c * 1.8
              );
              win.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
              chunk.add(win);
            }
          }
        }
      }

      // Palm Trees & Streetlights along sidewalk
      for (let p = 0; p < 3; p++) {
        const palm = this.createPalmTree();
        palm.position.set(side * 8.5, 0.3, -length / 2 + p * 20 + 8);
        chunk.add(palm);

        // Streetlight
        const lightPole = this.createStreetlight(side > 0);
        lightPole.position.set(side * 7.5, 0.3, -length / 2 + p * 20 + 15);
        chunk.add(lightPole);
      }
    });

    // Overhead Highway Sign Gantry (on every other chunk)
    if (Math.random() > 0.4) {
      const gantry = this.createOverheadGantry();
      gantry.position.set(0, 0, 0);
      chunk.add(gantry);
    }

    return chunk;
  }

  private createPalmTree(): THREE.Group {
    const palm = new THREE.Group();
    // Curved trunk
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 4.5, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 2.25;
    trunk.rotation.z = (Math.random() - 0.5) * 0.15;
    palm.add(trunk);

    // Leaves crown
    const leafGeo = new THREE.ConeGeometry(1.6, 0.3, 5);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.5 });
    for (let i = 0; i < 6; i++) {
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(0, 4.5, 0);
      leaf.rotation.y = (i * Math.PI) / 3;
      leaf.rotation.z = 0.65;
      palm.add(leaf);
    }
    return palm;
  }

  private createStreetlight(isRightSide: boolean): THREE.Group {
    const pole = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7 });
    const upright = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 6, 8), mat);
    upright.position.y = 3;
    pole.add(upright);

    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8), mat);
    arm.rotation.z = isRightSide ? -Math.PI / 3 : Math.PI / 3;
    arm.position.set(isRightSide ? -0.8 : 0.8, 5.8, 0);
    pole.add(arm);

    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    bulb.position.set(isRightSide ? -1.6 : 1.6, 5.5, 0);
    pole.add(bulb);

    return pole;
  }

  private createOverheadGantry(): THREE.Group {
    const gantry = new THREE.Group();
    const trussMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6 });

    // Pillars Left & Right
    const pL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 7, 0.4), trussMat);
    pL.position.set(-8, 3.5, 0);
    const pR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 7, 0.4), trussMat);
    pR.position.set(8, 3.5, 0);
    gantry.add(pL, pR);

    // Cross beam
    const beam = new THREE.Mesh(new THREE.BoxGeometry(16.5, 0.5, 0.5), trussMat);
    beam.position.set(0, 6.8, 0);
    gantry.add(beam);

    // Overhead Sign Boards
    const signGeo = new THREE.BoxGeometry(3.6, 1.4, 0.15);
    const signMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 }); // Highway cyan-blue
    const sign1 = new THREE.Mesh(signGeo, signMat);
    sign1.position.set(-3.2, 5.8, 0);
    const sign2 = new THREE.Mesh(signGeo, signMat);
    sign2.position.set(3.2, 5.8, 0);
    gantry.add(sign1, sign2);

    return gantry;
  }

  private createClouds() {
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1.0, transparent: true, opacity: 0.9 });
    for (let c = 0; c < 14; c++) {
      const cloud = new THREE.Group();
      const numPuffs = 4 + Math.floor(Math.random() * 4);
      for (let p = 0; p < numPuffs; p++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(3 + Math.random() * 3, 7, 7), cloudMat);
        puff.position.set((p - numPuffs / 2) * 2.8, Math.random() * 1.5, Math.random() * 2);
        cloud.add(puff);
      }
      cloud.position.set(
        (Math.random() - 0.5) * 120,
        35 + Math.random() * 20,
        c * 25 - 50
      );
      this.scene.add(cloud);
    }
  }

  private setupSpeedLines() {
    const lineCount = 80;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(lineCount * 6);

    for (let i = 0; i < lineCount; i++) {
      const x = (Math.random() - 0.5) * 16;
      const y = 0.5 + Math.random() * 7;
      const z = Math.random() * 50;
      const len = 3 + Math.random() * 5;

      positions[i * 6 + 0] = x;
      positions[i * 6 + 1] = y;
      positions[i * 6 + 2] = z;

      positions[i * 6 + 3] = x;
      positions[i * 6 + 4] = y;
      positions[i * 6 + 5] = z + len;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.4,
    });
    this.speedLines = new THREE.LineSegments(geometry, material);
    this.speedLines.visible = false;
    this.scene.add(this.speedLines);
  }

  // -------------------------------------------------------------
  // Obstacle Creation (Auto-Rickshaw, City Bus, Barrier, Ramp)
  // -------------------------------------------------------------
  private spawnObstacle(lane: Lane, z: number, type?: ObstacleType) {
    const types: ObstacleType[] = ['rickshaw', 'bus', 'barrier', 'ramp'];
    const chosenType = type || (Math.random() < 0.38 ? 'rickshaw' : Math.random() < 0.65 ? 'bus' : Math.random() < 0.85 ? 'barrier' : 'ramp');

    let group: THREE.Group;
    let width = 2.0;
    let height = 2.0;
    let depth = 3.5;

    if (chosenType === 'rickshaw') {
      group = this.createRickshawModel();
      width = 2.1;
      height = 2.2;
      depth = 3.2;
    } else if (chosenType === 'bus') {
      group = this.createBusModel();
      width = 2.6;
      height = 3.6;
      depth = 7.5;
    } else if (chosenType === 'barrier') {
      group = this.createBarrierModel();
      width = 2.4;
      height = 1.3;
      depth = 1.0;
    } else {
      group = this.createRampModel();
      width = 2.4;
      height = 1.2;
      depth = 4.5;
    }

    group.position.set(lane * this.LANE_WIDTH, 0, z);
    this.scene.add(group);

    this.obstacles.push({
      group,
      type: chosenType,
      lane,
      z,
      width,
      height,
      depth,
      passed: false,
      hit: false,
      wobbleOffset: Math.random() * 10,
    });
  }

  // 1. Stylized 3-Wheeled Auto-Rickshaw (Tuk-Tuk)
  private createRickshawModel(): THREE.Group {
    const rickshaw = new THREE.Group();

    // Vibrant green lower body
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.4, metalness: 0.2 });
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 2.6), bodyMat);
    lowerBody.position.y = 0.7;
    lowerBody.castShadow = true;
    rickshaw.add(lowerBody);

    // Front tapered nose
    const nose = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.9), bodyMat);
    nose.position.set(0, 0.65, 1.4);
    nose.rotation.x = 0.2;
    nose.castShadow = true;
    rickshaw.add(nose);

    // Distinctive Yellow Canopy / Roof
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.3 });
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.25, 2.7), roofMat);
    roof.position.set(0, 2.1, -0.1);
    roof.castShadow = true;
    rickshaw.add(roof);

    // Support pillars
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2), pillarMat);
    p1.position.set(-0.8, 1.5, 0.9);
    const p2 = p1.clone();
    p2.position.x = 0.8;
    const p3 = p1.clone();
    p3.position.set(-0.8, 1.5, -1.1);
    const p4 = p1.clone();
    p4.position.set(0.8, 1.5, -1.1);
    rickshaw.add(p1, p2, p3, p4);

    // Black passenger interior seat
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.4, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x18181b })
    );
    seat.position.set(0, 0.9, -0.6);
    rickshaw.add(seat);

    // Single Round Front Headlight
    const headlight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.15, 12),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    headlight.rotation.x = Math.PI / 2;
    headlight.position.set(0, 0.75, 1.9);
    rickshaw.add(headlight);

    // Wheels: 1 front center, 2 rear
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    const tireGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 12);
    tireGeo.rotateZ(Math.PI / 2);

    const frontWheel = new THREE.Mesh(tireGeo, tireMat);
    frontWheel.position.set(0, 0.35, 1.3);
    const rearWheelL = new THREE.Mesh(tireGeo, tireMat);
    rearWheelL.position.set(-0.95, 0.35, -0.6);
    const rearWheelR = new THREE.Mesh(tireGeo, tireMat);
    rearWheelR.position.set(0.95, 0.35, -0.6);
    rickshaw.add(frontWheel, rearWheelL, rearWheelR);

    // Face player
    rickshaw.rotation.y = Math.PI;
    return rickshaw;
  }

  // 2. Big Stylized City Transit Bus
  private createBusModel(): THREE.Group {
    const bus = new THREE.Group();

    // Red & Cream Livery Main Body
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
    const mainBody = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3.2, 7.2), bodyMat);
    mainBody.position.y = 1.9;
    mainBody.castShadow = true;
    bus.add(mainBody);

    // Cream roof
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.3, 7.0), roofMat);
    roof.position.set(0, 3.55, 0);
    bus.add(roof);

    // Glowing LED Destination Board
    const destBoard = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 0.4, 0.1),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 }) // Cyan glowing "EXPRESS 99"
    );
    destBoard.position.set(0, 3.0, 3.62);
    bus.add(destBoard);

    // Tinted Front Windshield & Windows
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.8 });
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.4, 0.1), glassMat);
    windshield.position.set(0, 2.0, 3.62);
    bus.add(windshield);

    // Side Windows
    const sideWinGeo = new THREE.BoxGeometry(0.08, 0.9, 5.8);
    const sideWinL = new THREE.Mesh(sideWinGeo, glassMat);
    sideWinL.position.set(-1.26, 2.2, -0.3);
    const sideWinR = new THREE.Mesh(sideWinGeo, glassMat);
    sideWinR.position.set(1.26, 2.2, -0.3);
    bus.add(sideWinL, sideWinR);

    // Chrome front bumper
    const bumper = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.4, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 })
    );
    bumper.position.set(0, 0.5, 3.6);
    bus.add(bumper);

    // Bright Headlights
    const headL = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.25, 0.1),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    headL.position.set(-0.85, 0.9, 3.63);
    const headR = headL.clone();
    headR.position.x = 0.85;
    bus.add(headL, headR);

    // Wheels: 4 large bus wheels
    const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.35, 14);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x171717, roughness: 0.9 });

    const wFL = new THREE.Mesh(wheelGeo, wheelMat);
    wFL.position.set(-1.25, 0.5, 2.2);
    const wFR = new THREE.Mesh(wheelGeo, wheelMat);
    wFR.position.set(1.25, 0.5, 2.2);
    const wRL = new THREE.Mesh(wheelGeo, wheelMat);
    wRL.position.set(-1.25, 0.5, -2.2);
    const wRR = new THREE.Mesh(wheelGeo, wheelMat);
    wRR.position.set(1.25, 0.5, -2.2);
    bus.add(wFL, wFR, wRL, wRR);

    // Face oncoming direction
    bus.rotation.y = Math.PI;
    return bus;
  }

  // 3. Striped Road Construction Barrier & Warning Cones
  private createBarrierModel(): THREE.Group {
    const barrier = new THREE.Group();

    // Red/White Striped Board
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.7, 0.12),
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 })
    );
    board.position.y = 0.9;
    board.castShadow = true;
    barrier.add(board);

    // White stripes
    for (let s = -1; s <= 1; s += 2) {
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.72, 0.14),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      stripe.position.set(s * 0.6, 0.9, 0);
      barrier.add(stripe);
    }

    // Legs
    const legMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5 });
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.2, 0.6), legMat);
    legL.position.set(-1.0, 0.6, 0);
    const legR = legL.clone();
    legR.position.x = 1.0;
    barrier.add(legL, legR);

    // Amber Flashing Hazard Beacons
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const beaconL = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), beaconMat);
    beaconL.position.set(-1.0, 1.35, 0);
    const beaconR = beaconL.clone();
    beaconR.position.x = 1.0;
    barrier.add(beaconL, beaconR);

    // Adjacent Traffic Cone
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.24, 0.7, 8),
      new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.3 })
    );
    cone.position.set(1.4, 0.35, 0.3);
    barrier.add(cone);

    return barrier;
  }

  // 4. Stunt Launch Ramp
  private createRampModel(): THREE.Group {
    const ramp = new THREE.Group();
    // Wedge shape
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(4.2, 0);
    shape.lineTo(4.2, 1.3);
    shape.closePath();

    const extrudeSettings = { depth: 2.3, bevelEnabled: false };
    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.rotateY(-Math.PI / 2);
    geom.translate(1.15, 0, -2.1);

    const rampMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.4 });
    const mesh = new THREE.Mesh(geom, rampMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    ramp.add(mesh);

    // Glowing launch chevron arrow
    const chevron = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.05, 0.6),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    chevron.position.set(0, 0.6, 0);
    chevron.rotation.x = -0.3;
    ramp.add(chevron);

    return ramp;
  }

  // -------------------------------------------------------------
  // Floating Gold Coins & Power-ups
  // -------------------------------------------------------------
  private spawnCoinRow(lane: Lane, startZ: number, count: number, arched = false) {
    for (let i = 0; i < count; i++) {
      const z = startZ + i * 2.8;
      let y = 1.1;
      if (arched) {
        // High parabolic arc over obstacles!
        const t = (i / (count - 1)) * 2 - 1; // -1 to 1
        y = 1.2 + (1 - t * t) * 3.5;
      }
      this.createCoin(lane, z, y);
    }
  }

  private createCoin(lane: Lane, z: number, y: number) {
    const coinGroup = new THREE.Group();

    // 3D Hexagonal Gold Coin with Bevel
    const coinGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.12, 12);
    coinGeo.rotateX(Math.PI / 2);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0xd97706,
      emissiveIntensity: 0.25,
    });
    const coinMesh = new THREE.Mesh(coinGeo, coinMat);
    coinGroup.add(coinMesh);

    // Star / Inner Emboss
    const starMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const star = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.14), starMat);
    coinGroup.add(star);

    coinGroup.position.set(lane * this.LANE_WIDTH, y, z);
    this.scene.add(coinGroup);

    this.coins.push({
      mesh: coinGroup,
      lane,
      z,
      y,
      collected: false,
      angle: Math.random() * Math.PI * 2,
    });
  }

  private spawnPowerup(lane: Lane, z: number, type?: PowerupType) {
    const types: PowerupType[] = ['nitro', 'magnet', 'shield'];
    const chosenType = type || types[Math.floor(Math.random() * types.length)];

    const pGroup = new THREE.Group();

    if (chosenType === 'nitro') {
      // Glowing Speed Boost Nitro Rocket Flask
      const bottle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 0.9, 12),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.2 })
      );
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 0.3, 12),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 })
      );
      cap.position.y = 0.55;
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(0.65, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.4 })
      );
      pGroup.add(bottle, cap, glow);
    } else if (chosenType === 'magnet') {
      // Red & Silver Horseshoe Magnet
      const magnetMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
      const arch = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.12, 8, 16, Math.PI), magnetMat);
      arch.rotation.z = Math.PI;

      const tipMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 });
      const tipL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.2, 0.24), tipMat);
      tipL.position.set(-0.4, 0.2, 0);
      const tipR = tipL.clone();
      tipR.position.x = 0.4;

      const aura = new THREE.Mesh(
        new THREE.SphereGeometry(0.65, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.35 })
      );

      pGroup.add(arch, tipL, tipR, aura);
    } else {
      // Glowing Forcefield Shield Orb
      const core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.45, 1),
        new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x7e22ce, emissiveIntensity: 0.6 })
      );
      const aura = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xc084fc, transparent: true, opacity: 0.4 })
      );
      pGroup.add(core, aura);
    }

    const y = 1.3;
    pGroup.position.set(lane * this.LANE_WIDTH, y, z);
    this.scene.add(pGroup);

    this.powerupItems.push({
      group: pGroup,
      type: chosenType,
      lane,
      z,
      y,
      collected: false,
    });
  }

  // -------------------------------------------------------------
  // Particle Systems
  // -------------------------------------------------------------
  private spawnCoinSparkles(x: number, y: number, z: number) {
    const colors = [0xfacc15, 0xfef08a, 0xffffff];
    for (let i = 0; i < 12; i++) {
      const geo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
      const mat = new THREE.MeshBasicMaterial({ color: colors[i % colors.length] });
      const p = new THREE.Mesh(geo, mat);
      p.position.set(x, y, z);
      this.scene.add(p);

      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 6;
      this.particles.push({
        mesh: p,
        vx: Math.cos(angle) * speed,
        vy: 2 + Math.random() * 5,
        vz: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.2,
      });
    }
  }

  private spawnCrashExplosion(x: number, y: number, z: number) {
    const colors = [0xef4444, 0xf97316, 0xfacc15, 0x18181b];
    for (let i = 0; i < 28; i++) {
      const size = 0.2 + Math.random() * 0.35;
      const geo = new THREE.BoxGeometry(size, size, size);
      const mat = new THREE.MeshBasicMaterial({ color: colors[i % colors.length] });
      const p = new THREE.Mesh(geo, mat);
      p.position.set(x, y, z);
      this.scene.add(p);

      this.particles.push({
        mesh: p,
        vx: (Math.random() - 0.5) * 14,
        vy: 4 + Math.random() * 10,
        vz: (Math.random() - 0.5) * 14,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.4,
      });
    }
  }

  // -------------------------------------------------------------
  // Player Controls (Subway Surfers Lane Switching, Jump, Slide)
  // -------------------------------------------------------------
  public moveLeft() {
    if (this.isGameOver || this.isPaused) return;
    if (this.targetLane > -1) {
      this.targetLane = (this.targetLane - 1) as Lane;
      this.laneProgress = 0;
      sound.playLaneSwitch();
    }
  }

  public moveRight() {
    if (this.isGameOver || this.isPaused) return;
    if (this.targetLane < 1) {
      this.targetLane = (this.targetLane + 1) as Lane;
      this.laneProgress = 0;
      sound.playLaneSwitch();
    }
  }

  public jump() {
    if (this.isGameOver || this.isPaused) return;
    if (!this.isJumping) {
      this.isJumping = true;
      this.jumpTime = 0;
      this.playerVelocityY = 13.5;
      this.isSliding = false;
      sound.playJump();
    }
  }

  public slide() {
    if (this.isGameOver || this.isPaused) return;
    if (this.isJumping) {
      // Quick slam down to ground (Subway Surfers mechanic)
      this.playerVelocityY = -22;
    } else {
      this.isSliding = true;
      this.slideTimer = 0.75;
      sound.playLaneSwitch();
    }
  }

  public activateNitroManual() {
    if (this.isGameOver || this.isPaused) return;
    this.activatePowerup('nitro');
  }

  public activatePowerup(type: PowerupType) {
    if (type === 'nitro') {
      const baseDuration = 4.5 + this.upgrades.nitroDuration * 1.5;
      this.activePowerups.nitro = baseDuration;
      this.stats.nitroUsed++;
      this.cameraShake = 0.5;
      sound.playNitro();
    } else if (type === 'magnet') {
      const baseDuration = 6.0 + this.upgrades.magnetDuration * 2.0;
      this.activePowerups.magnet = baseDuration;
      sound.playPowerup();
    } else if (type === 'shield') {
      this.activePowerups.shield = true;
      sound.playPowerup();
    }
    this.onPowerupCollect?.(type);
  }

  // -------------------------------------------------------------
  // Game Loop & Physics
  // -------------------------------------------------------------
  public start() {
    this.isPlaying = true;
    this.isPaused = false;
    this.isGameOver = false;
    this.clock.start();
    sound.startEngine();
    sound.startBGM();
    this.animate();
  }

  public pause() {
    this.isPaused = true;
    sound.stopEngine();
  }

  public resume() {
    this.isPaused = false;
    this.clock.start();
    sound.startEngine();
    sound.startBGM();
  }

  public restart() {
    this.resetState();
    this.start();
  }

  public resetState() {
    // Clear dynamic elements
    this.obstacles.forEach(o => this.scene.remove(o.group));
    this.obstacles = [];
    this.coins.forEach(c => this.scene.remove(c.mesh));
    this.coins = [];
    this.powerupItems.forEach(p => this.scene.remove(p.group));
    this.powerupItems = [];
    this.particles.forEach(p => this.scene.remove(p.mesh));
    this.particles = [];

    // Reset player position & state
    this.currentLane = 0;
    this.targetLane = 0;
    this.laneProgress = 1;
    this.playerX = 0;
    this.playerY = 0;
    this.playerZ = 0;
    this.playerVelocityY = 0;
    this.isJumping = false;
    this.isSliding = false;
    this.distanceTraveled = 0;
    this.currentSpeed = this.baseSpeed;
    this.nextObstacleZ = 45;
    this.nextCoinGroupZ = 25;
    this.nextPowerupZ = 85;

    this.activePowerups = { nitro: 0, magnet: 0, shield: false };
    this.stats.score = 0;
    this.stats.coins = 0;
    this.stats.distance = 0;
    this.stats.nearMisses = 0;
    this.stats.rickshawsDodged = 0;
    this.stats.busesDodged = 0;

    this.isGameOver = false;
    this.isPaused = false;
    this.playerGroup.rotation.set(0, 0, 0);
    this.playerGroup.position.set(0, 0, 0);
  }

  public revive() {
    this.isGameOver = false;
    this.isPaused = false;
    this.activePowerups.shield = true;
    this.activePowerups.nitro = 3.0; // short invincibility burst!

    // Clear obstacles nearby so player doesn't instantly die
    this.obstacles.forEach(o => {
      if (Math.abs(o.z - this.playerZ) < 30) {
        this.scene.remove(o.group);
        o.hit = true;
      }
    });
    this.obstacles = this.obstacles.filter(o => !o.hit);

    this.clock.start();
    sound.startEngine();
    sound.startBGM();
    this.animate();
  }

  private animate = () => {
    if (!this.isPlaying) return;

    this.animFrameId = requestAnimationFrame(this.animate);

    if (this.isPaused) return;

    const delta = Math.min(this.clock.getDelta(), 0.08);

    this.updateGame(delta);
    this.renderer.render(this.scene, this.camera);
  };

  private updateGame(delta: number) {
    // 1. Calculate Speeds & Power-up Timers
    const isBoosting = this.activePowerups.nitro > 0;
    if (isBoosting) {
      this.activePowerups.nitro = Math.max(0, this.activePowerups.nitro - delta);
      this.currentSpeed = this.baseSpeed * 1.85;
      this.nitroFlames.visible = true;
      if (this.speedLines) this.speedLines.visible = true;
    } else {
      this.currentSpeed = Math.min(78, this.baseSpeed + (this.distanceTraveled / 450) * 4);
      this.nitroFlames.visible = false;
      if (this.speedLines) this.speedLines.visible = false;
    }

    if (this.activePowerups.magnet > 0) {
      this.activePowerups.magnet = Math.max(0, this.activePowerups.magnet - delta);
      this.magnetAura.visible = true;
      this.magnetAura.rotation.y += delta * 4;
    } else {
      this.magnetAura.visible = false;
    }

    if (this.shieldBubble) {
      this.shieldBubble.visible = this.activePowerups.shield;
      if (this.activePowerups.shield) {
        this.shieldBubble.rotation.y += delta * 2;
      }
    }

    // Update sound engine pitch
    sound.updateEnginePitch(this.currentSpeed / this.baseSpeed, isBoosting);

    // 2. Advance World Distance
    const moveZ = this.currentSpeed * delta;
    this.distanceTraveled += moveZ;
    this.playerZ += moveZ;
    this.stats.distance = Math.floor(this.distanceTraveled);

    // Multiplier & Score calculation
    const currentMult = (this.stats.multiplier + (this.upgrades.coinMultiplier - 1) * 3) * (isBoosting ? 2 : 1);
    this.stats.score += Math.floor(moveZ * currentMult * 0.4);

    // 3. Smooth Lane Transition & Sports Car Tilt/Roll
    const targetX = this.targetLane * this.LANE_WIDTH;
    const diffX = targetX - this.playerX;
    this.playerX += diffX * Math.min(1, delta * 15);

    // Car banking rotation (tilt into the turn like a true race car)
    const turnTilt = -diffX * 0.12;
    this.playerGroup.rotation.z = THREE.MathUtils.lerp(this.playerGroup.rotation.z, turnTilt, delta * 12);
    this.playerGroup.rotation.y = THREE.MathUtils.lerp(this.playerGroup.rotation.y, diffX * 0.05, delta * 10);

    // 4. Jumping & Gravity Physics
    if (this.isJumping) {
      this.playerVelocityY -= 32 * delta; // Gravity
      this.playerY += this.playerVelocityY * delta;

      // Slight nose up while rising, nose down while falling
      this.playerGroup.rotation.x = THREE.MathUtils.lerp(
        this.playerGroup.rotation.x,
        this.playerVelocityY > 0 ? -0.15 : 0.18,
        delta * 10
      );

      if (this.playerY <= 0) {
        this.playerY = 0;
        this.playerVelocityY = 0;
        this.isJumping = false;
        this.playerGroup.rotation.x = 0;
        this.cameraShake = 0.2;
        sound.playLand();
      }
    } else if (this.isSliding) {
      // Slipstream duck/crouch
      this.slideTimer -= delta;
      this.playerGroup.rotation.x = THREE.MathUtils.lerp(this.playerGroup.rotation.x, 0.25, delta * 14);
      this.playerGroup.scale.set(1.1, 0.65, 1.1); // Flatten for duck

      if (this.slideTimer <= 0) {
        this.isSliding = false;
        this.playerGroup.rotation.x = 0;
        this.playerGroup.scale.set(1, 1, 1);
      }
    } else {
      // Natural sports car suspension road bounce
      const bounce = Math.sin(this.distanceTraveled * 1.5) * 0.03;
      this.playerY = Math.max(0, bounce);
      this.playerGroup.scale.set(1, 1, 1);
    }

    // Set final player group position
    this.playerGroup.position.set(this.playerX, this.playerY, this.playerZ);

    // Rotate spinning wheels
    const wheelRotSpeed = (this.currentSpeed * delta) / 0.42;
    this.wheels.forEach(w => {
      w.rotation.x += wheelRotSpeed;
    });

    // 5. Infinite Track Chunk Recycling
    this.updateTrackChunks();

    // 6. Spawn & Update Obstacles
    this.updateObstacles(delta, isBoosting);

    // 7. Spawn & Update Coins (Magnet Attraction & Rotation)
    this.updateCoins(delta);

    // 8. Spawn & Update Power-ups
    this.updatePowerupItems(delta);

    // 9. Particles
    this.updateParticles(delta);

    // 10. Update Camera
    this.updateCameraPosition(delta);

    // 11. Inform UI
    this.onStatsUpdate?.(this.stats, this.activePowerups);
  }

  private updateTrackChunks() {
    const chunkLength = 60;
    // When player gets near end of chunks, move behind chunks to front
    this.roadChunks.forEach(chunk => {
      if (chunk.position.z < this.playerZ - chunkLength * 1.5) {
        chunk.position.z += chunkLength * this.roadChunks.length;
      }
    });

    this.sceneryChunks.forEach(chunk => {
      if (chunk.position.z < this.playerZ - chunkLength * 1.5) {
        chunk.position.z += chunkLength * this.sceneryChunks.length;
      }
    });
  }

  private updateObstacles(delta: number, isBoosting: boolean) {
    // Spawning ahead
    if (this.nextObstacleZ < this.playerZ + 160) {
      const lane = ([-1, 0, 1] as Lane[])[Math.floor(Math.random() * 3)];
      this.spawnObstacle(lane, this.nextObstacleZ);

      // Sometimes spawn double obstacle (leave 1 lane free for Subway Surfers puzzle dodging!)
      if (Math.random() < 0.45 && this.distanceTraveled > 120) {
        const availableLanes = ([-1, 0, 1] as Lane[]).filter(l => l !== lane);
        const secondLane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
        this.spawnObstacle(secondLane, this.nextObstacleZ + 1.5);
      }

      const minGap = Math.max(28, 48 - (this.distanceTraveled / 600) * 12);
      this.nextObstacleZ += minGap + Math.random() * 15;
    }

    // Moving & Collision Check
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];

      // Rickshaws and buses drive towards the player!
      if (obs.type === 'rickshaw') {
        obs.z -= 9 * delta; // Oncoming traffic speed
        obs.group.position.z = obs.z;
        // Animated suspension wobble
        obs.group.rotation.z = Math.sin(this.distanceTraveled * 0.8 + obs.wobbleOffset) * 0.06;
      } else if (obs.type === 'bus') {
        obs.z -= 14 * delta;
        obs.group.position.z = obs.z;
      }

      // Check Near Miss (Subway Surfers style close dodge bonus!)
      const dz = obs.z - this.playerZ;
      if (!obs.passed && dz < -1.5) {
        obs.passed = true;
        const dx = Math.abs(obs.lane * this.LANE_WIDTH - this.playerX);
        if (dx < this.LANE_WIDTH * 1.2 && !obs.hit) {
          // Near miss!
          this.stats.nearMisses++;
          this.stats.score += 250;
          if (obs.type === 'rickshaw') this.stats.rickshawsDodged++;
          if (obs.type === 'bus') this.stats.busesDodged++;
          this.onNearMiss?.();
        }
      }

      // Stunt launch ramp interaction
      if (obs.type === 'ramp') {
        const rampDist = Math.abs(obs.z - this.playerZ);
        const rampLaneDist = Math.abs(obs.lane * this.LANE_WIDTH - this.playerX);
        if (rampDist < 2.0 && rampLaneDist < 1.4 && !this.isJumping) {
          // Launch into air!
          this.isJumping = true;
          this.playerVelocityY = 19;
          this.cameraShake = 0.35;
          sound.playJump();
        }
      }

      // Collision Detection Box
      const collisionZ = Math.abs(dz) < (obs.depth / 2 + 1.8);
      const collisionX = Math.abs(obs.lane * this.LANE_WIDTH - this.playerX) < (obs.width / 2 + 0.7);
      const collisionY = this.playerY < (obs.height - 0.4);

      if (collisionZ && collisionX && collisionY && !obs.hit) {
        if (isBoosting) {
          // Super Boost obliterates obstacles!
          obs.hit = true;
          this.spawnCrashExplosion(obs.group.position.x, 1.5, obs.z);
          this.scene.remove(obs.group);
          this.cameraShake = 0.4;
          sound.playCrash();
        } else if (this.activePowerups.shield) {
          // Shield absorbs collision
          obs.hit = true;
          this.activePowerups.shield = false;
          this.spawnCrashExplosion(obs.group.position.x, 1.5, obs.z);
          this.scene.remove(obs.group);
          this.cameraShake = 0.6;
          sound.playCrash();
        } else {
          // Player Crashed!
          this.triggerGameOver();
          return;
        }
      }

      // Cleanup passed obstacles
      if (obs.z < this.playerZ - 40 || obs.hit) {
        this.scene.remove(obs.group);
        this.obstacles.splice(i, 1);
      }
    }
  }

  private updateCoins(delta: number) {
    // Spawn Coin Groups (Straight rows or high arcs)
    if (this.nextCoinGroupZ < this.playerZ + 140) {
      const lane = ([-1, 0, 1] as Lane[])[Math.floor(Math.random() * 3)];
      const arched = Math.random() < 0.4;
      this.spawnCoinRow(lane, this.nextCoinGroupZ, arched ? 8 : 5, arched);
      this.nextCoinGroupZ += arched ? 35 : 24;
    }

    const hasMagnet = this.activePowerups.magnet > 0;

    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];

      // Rotate coin on Y axis
      coin.angle += delta * 5;
      coin.mesh.rotation.y = coin.angle;

      const dz = coin.z - this.playerZ;
      const dx = coin.mesh.position.x - this.playerX;
      const dy = coin.mesh.position.y - this.playerY;
      const dist = Math.sqrt(dx * dx + dz * dz + dy * dy);

      // Magnet attraction pull
      if (hasMagnet && dist < 22 && !coin.collected) {
        coin.mesh.position.x += (this.playerX - coin.mesh.position.x) * delta * 12;
        coin.mesh.position.y += (this.playerY + 0.8 - coin.mesh.position.y) * delta * 12;
        coin.mesh.position.z += (this.playerZ - coin.mesh.position.z) * delta * 12;
      }

      // Coin collection check
      if (dist < 1.8 && !coin.collected) {
        coin.collected = true;
        this.stats.coins++;
        this.stats.totalCoins++;
        this.stats.score += 100 * this.upgrades.coinMultiplier;
        this.spawnCoinSparkles(coin.mesh.position.x, coin.mesh.position.y, coin.mesh.position.z);
        sound.playCoin(this.stats.coins);
      }

      // Cleanup
      if (coin.z < this.playerZ - 20 || coin.collected) {
        this.scene.remove(coin.mesh);
        this.coins.splice(i, 1);
      }
    }
  }

  private updatePowerupItems(delta: number) {
    // Spawn Power-ups
    if (this.nextPowerupZ < this.playerZ + 180) {
      const lane = ([-1, 0, 1] as Lane[])[Math.floor(Math.random() * 3)];
      this.spawnPowerup(lane, this.nextPowerupZ);
      this.nextPowerupZ += 80 + Math.random() * 40;
    }

    for (let i = this.powerupItems.length - 1; i >= 0; i--) {
      const p = this.powerupItems[i];
      p.group.rotation.y += delta * 3;
      p.group.position.y = p.y + Math.sin(this.distanceTraveled * 0.1 + p.z) * 0.25;

      const dz = p.z - this.playerZ;
      const dx = p.group.position.x - this.playerX;
      const dy = p.group.position.y - this.playerY;
      const dist = Math.sqrt(dx * dx + dz * dz + dy * dy);

      if (dist < 2.0 && !p.collected) {
        p.collected = true;
        this.activatePowerup(p.type);
        this.spawnCoinSparkles(p.group.position.x, p.group.position.y, p.group.position.z);
      }

      if (p.z < this.playerZ - 20 || p.collected) {
        this.scene.remove(p.group);
        this.powerupItems.splice(i, 1);
      }
    }
  }

  private updateParticles(delta: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;
      p.mesh.position.x += p.vx * delta;
      p.mesh.position.y += p.vy * delta;
      p.mesh.position.z += p.vz * delta;
      p.vy -= 9.8 * delta; // Gravity

      const scale = 1 - p.life / p.maxLife;
      p.mesh.scale.set(scale, scale, scale);

      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
  }

  // -------------------------------------------------------------
  // Camera System: Dynamic Low-Angle Subway Surfers Shot
  // -------------------------------------------------------------
  public setCameraMode(mode: CameraViewMode) {
    this.cameraMode = mode;
  }

  private updateCameraPosition(delta: number) {
    let targetY = 2.4;
    let targetZ = -6.8;
    let lookOffsetY = 1.4;
    let lookOffsetZ = 12.0;

    if (this.cameraMode === 'low-angle') {
      // THE REQUESTED DYNAMIC LOW-ANGLE SHOT:
      // Positioned low behind the car, close to the asphalt, tilted upwards toward the horizon!
      targetY = 1.85 + this.playerY * 0.4;
      targetZ = -6.2;
      lookOffsetY = 1.65;
      lookOffsetZ = 14.0;
    } else if (this.cameraMode === 'chase') {
      targetY = 3.6 + this.playerY * 0.6;
      targetZ = -8.5;
      lookOffsetY = 1.4;
      lookOffsetZ = 10.0;
    } else if (this.cameraMode === 'top-down') {
      targetY = 9.5;
      targetZ = -10.0;
      lookOffsetY = 0.5;
      lookOffsetZ = 8.0;
    } else if (this.cameraMode === 'cinematic') {
      targetY = 1.6;
      targetZ = -5.0;
      lookOffsetY = 2.0;
      lookOffsetZ = 20.0;
    }

    // Camera shake calculation
    let shakeX = 0;
    let shakeY = 0;
    if (this.cameraShake > 0) {
      shakeX = (Math.random() - 0.5) * this.cameraShake;
      shakeY = (Math.random() - 0.5) * this.cameraShake;
      this.cameraShake = Math.max(0, this.cameraShake - delta * 2.0);
    }

    // Dynamic FOV widening during Nitro Boost (sense of high-speed warp)
    const targetFOV = this.activePowerups.nitro > 0 ? 78 : 65;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFOV, delta * 5);
    this.camera.updateProjectionMatrix();

    // Smooth position interpolation
    const desiredX = this.playerX * 0.65 + shakeX;
    const desiredY = targetY + shakeY;
    const desiredZ = this.playerZ + targetZ;

    this.camera.position.x = desiredX;
    this.camera.position.y = desiredY;
    this.camera.position.z = desiredZ;

    const lookTarget = new THREE.Vector3(
      this.playerX * 0.8,
      this.playerY * 0.5 + lookOffsetY,
      this.playerZ + lookOffsetZ
    );
    this.camera.lookAt(lookTarget);
  }

  // -------------------------------------------------------------
  // Game Over
  // -------------------------------------------------------------
  private triggerGameOver() {
    this.isGameOver = true;
    this.isPlaying = false;
    sound.stopEngine();
    sound.playCrash();

    // Spin out car
    this.playerGroup.rotation.y = Math.PI * 0.4;
    this.playerGroup.rotation.z = -0.3;
    this.spawnCrashExplosion(this.playerX, 1.0, this.playerZ);

    if (this.stats.score > this.stats.highScore) {
      this.stats.highScore = this.stats.score;
    }

    this.onGameOver?.(this.stats);
  }

  public handleResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public destroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    sound.stopEngine();
    sound.stopBGM();
    window.removeEventListener('resize', this.handleResize);
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
