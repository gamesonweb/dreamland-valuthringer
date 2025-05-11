import {
  Scene,
  Engine,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  CubeTexture,
  KeyboardEventTypes,
  Mesh,
  PBRMaterial,
  ArcRotateCamera,
  Ray,
  RayHelper,
  Color3
} from "@babylonjs/core";

export class BasicScene {
  scene: Scene;
  engine: Engine;
  player!: Mesh;
  inputMap: { [key: string]: boolean } = {};
  camera!: ArcRotateCamera;

  dangerousMeshes: Mesh[] = [];
  spawnPlatform!: Mesh;
  initialPlayerPosition = new Vector3(0, 1, 0);

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.scene = this.CreateScene();
    this.engine.runRenderLoop(() => {
      this.updatePlayerMovement();
      this.checkCollisionWithDangerousAssets();
      this.camera.target = this.player.position;
      this.scene.render();
    });
  }

  CreateScene(): Scene {
    const scene = new Scene(this.engine);
    scene.collisionsEnabled = true;
    const hemiLight = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), scene);
    hemiLight.intensity = 0.5;

    // Sol principal (plateforme de départ)
    this.spawnPlatform = MeshBuilder.CreateGround("ground", { width: 20, height: 10 }, scene);
    this.spawnPlatform.checkCollisions = true;

    // Ciel (environnement)
    const envTex = CubeTexture.CreateFromPrefilteredData("./environment/sky.env", scene);
    scene.environmentTexture = envTex;
    scene.createDefaultSkybox(envTex, true);

    // Joueur (cylindre avec repère avant)
    this.player = MeshBuilder.CreateCylinder("player", { height: 2, diameter: 1 }, scene);
    this.player.position = this.initialPlayerPosition.clone();
    this.player.checkCollisions = true;

    // Matériau avec réflexion pour un meilleur rendu
    const playerMaterial = new PBRMaterial("playerMaterial", scene);
    playerMaterial.environmentBRDFTexture = envTex;
    playerMaterial.metallic = 0.5;
    playerMaterial.roughness = 0.4;
    this.player.material = playerMaterial;

    // Caméra à la 3ème personne
    this.camera = new ArcRotateCamera(
      "ArcCam",
      Math.PI / -2,   // alpha (horizontal angle)
      Math.PI / 4,   // beta (vertical angle)
      10,            // radius (distance fixe)
      this.player.position, // point que l'on regarde
      scene
    );
    this.camera.attachControl(this.canvas, true);
    // On empêche de zoomer/dézoomer
    this.camera.lowerRadiusLimit = 10;
    this.camera.upperRadiusLimit = 15;

    // Gestion des inputs clavier
    scene.onKeyboardObservable.add((kbInfo) => {
      const key = kbInfo.event.key.toLowerCase();
      if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
        this.inputMap[key] = true;
      } else if (kbInfo.type === KeyboardEventTypes.KEYUP) {
        this.inputMap[key] = false;
      }
    });

    // Génération des obstacles
    this.generateDropperLayers(25, -10, 10, 5, 25, 20, 40, 5, 10);

    return scene;
  }

  // Vitesse de déplacement
  private initialSpeed = 0.075;
  private reducedSpeed = 0.035;
  private speed = this.initialSpeed;
  private hasLeftSpawnPlatform = false;

  // Vérification que le joueur soit en pleine chute
  private isPlayerOnSpawnPlatform(): boolean {
    const ray = new Ray(this.player.position, new Vector3(0, -1, 0), 1.1);
    const pickInfo = ray.intersectsMesh(this.spawnPlatform, false);
    return pickInfo.hit || false;
  }  

  private updatePlayerMovement() {
    if (!this.player) return;
    
    // Vérifie si le joueur a quitté la plateforme de spawn
    if (!this.hasLeftSpawnPlatform && !this.isPlayerOnSpawnPlatform()) {
      this.hasLeftSpawnPlatform = true;
      this.speed = this.reducedSpeed;
    }

    const movement = new Vector3(0, 0, 0);
    if (this.inputMap["arrowleft"] || this.inputMap["q"]) {
      movement.x -= this.speed;
    }
    if (this.inputMap["arrowright"] || this.inputMap["d"]) {
      movement.x += this.speed;
    }
    if (this.inputMap["arrowup"] || this.inputMap["z"]) {
      movement.z += this.speed;
    }
    if (this.inputMap["arrowdown"] || this.inputMap["s"]) {
      movement.z -= this.speed;
    }
    this.player.moveWithCollisions(movement);
    // Simule la chute automatique
    this.player.moveWithCollisions(new Vector3(0, -0.15, 0)); // Vitesse de chute en Y.
  }

  private checkCollisionWithDangerousAssets() {
    const downOrigin = this.player.position.clone();
    downOrigin.y -= this.player.scaling.y; // Face inférieure du joueur
  
    const radius = this.player.scaling.x / 2; // Rayon du cylindre
    const numSteps = 5; // Résolution de la grille (plus grand = plus précis)
    const step = (radius * 2) / (numSteps - 1); // Distance entre les points
  
    for (let i = 0; i < numSteps; i++) {
      for (let j = 0; j < numSteps; j++) {
        const offsetX = -radius + i * step;
        const offsetZ = -radius + j * step;
  
        // Vérifie si le point est dans le disque (Pythagore)
        if (offsetX * offsetX + offsetZ * offsetZ <= radius * radius) {
          const rayOrigin = downOrigin.clone().add(new Vector3(offsetX, 0, offsetZ));
          const ray = new Ray(rayOrigin, new Vector3(0, -1, 0), 0.2);
  
          // Affiche le rayon pour visualisation (optionnel)
          /*const rayHelper = new RayHelper(ray);
          rayHelper.show(this.scene, new Color3(0, 1, 0)); // vert*/
  
          for (const mesh of this.dangerousMeshes) {
            const pickInfo = ray.intersectsMesh(mesh, false);
            if (pickInfo.hit) {
              this.player.position = this.initialPlayerPosition.clone();
              return; // Collision détectée
            }
          }
        }
      }
    }
  }
  
  
  
  // Types d'obstacles
  private shapes = [
    () => MeshBuilder.CreateBox("box", { size: 1 }, this.scene),
    () => MeshBuilder.CreateSphere("sphere", { diameter: 1 }, this.scene),
    () => MeshBuilder.CreateCylinder("cylinder", { height: 1, diameter: 1 }, this.scene),
    () => MeshBuilder.CreatePolyhedron("pyramid", { type: 0, size: 1 }, this.scene),
  ];

  // Génère des couches d'obstacles aléatoires dans une zone donnée
  private generateDropperLayers(
    layerCount: number,
    minX = -5, maxX = 5,
    minZ = -5, maxZ = 5,
    minObj = 10, maxObj = 20,
    minSpacing = 5, maxSpacing = 10
  ) {
    let currentY = 0;
    const startY = 0;
    const endY = -Array.from({ length: layerCount }, (_, i) =>
      maxSpacing - (i / (layerCount - 1)) * (maxSpacing - minSpacing)
    ).reduce((a, b) => a + b, 0);
  
    const wallHeight = Math.abs(endY - startY) + 10; // Marge en plus
    const wallCenterY = endY / 2 - 5; // Centré verticalement sur la hauteur du dropper
  
    // Mur de Gauche
    const leftWall = MeshBuilder.CreateBox("leftWall", { width: 1, height: wallHeight, depth: maxZ - minZ }, this.scene);
    leftWall.position = new Vector3(minX - 0.5, wallCenterY, (minZ + maxZ) / 2);
    leftWall.checkCollisions = true;
    leftWall.isVisible = false;
  
    // Mur de Droite
    const rightWall = MeshBuilder.CreateBox("rightWall", { width: 1, height: wallHeight, depth: maxZ - minZ }, this.scene);
    rightWall.position = new Vector3(maxX + 0.5, wallCenterY, (minZ + maxZ) / 2);
    rightWall.checkCollisions = true;
    rightWall.isVisible = false;
  
    // Mur de Devant
    const frontWall = MeshBuilder.CreateBox("frontWall", { width: maxX - minX, height: wallHeight, depth: 1 }, this.scene);
    frontWall.position = new Vector3((minX + maxX) / 2, wallCenterY, minZ - 0.5);
    frontWall.checkCollisions = true;
    frontWall.isVisible = false;
  
    // Mur de Derrière
    const backWall = MeshBuilder.CreateBox("backWall", { width: maxX - minX, height: wallHeight, depth: 1 }, this.scene);
    backWall.position = new Vector3((minX + maxX) / 2, wallCenterY, maxZ + 0.5);
    backWall.checkCollisions = true;
    backWall.isVisible = false;
  
    // Génération des couches d'obstacles
    for (let i = 0; i < layerCount; i++) {
      const t = i / (layerCount - 1);
      const layerSpacing = maxSpacing - t * (maxSpacing - minSpacing);
      currentY -= layerSpacing;
      const objectCount = Math.floor(minObj + ((maxObj - minObj) * i) / (layerCount - 1));
  
      for (let j = 0; j < objectCount; j++) {
        const shapeFunc = this.shapes[Math.floor(Math.random() * this.shapes.length)];
        const mesh = shapeFunc();
        mesh.checkCollisions = true;
        const scale = 0.5 + Math.random() * 1.5;
        mesh.scaling = new Vector3(scale, scale, scale);
        const x = minX + 0.5 + Math.random() * (maxX - minX - 1);
        const z = minZ + 0.5 + Math.random() * (maxZ - minZ - 1);
        mesh.position = new Vector3(x, currentY, z);
        mesh.rotation = new Vector3(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );

        // Ajout uniquement des vrais obstacles dans la liste
        this.dangerousMeshes.push(mesh);
      }
    }
  }
}
