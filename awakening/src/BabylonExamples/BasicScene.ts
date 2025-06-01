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
  Color3,
  SceneLoader,
  Space,
  StandardMaterial,
  DirectionalLight,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { kaykitAssets } from '@/assets/list/kaykit-assets';
import * as GUI from "@babylonjs/gui";

export class BasicScene {
  scene: Scene;
  engine: Engine;
  player!: Mesh;
  inputMap: { [key: string]: boolean } = {};
  camera!: ArcRotateCamera;
  winBlocks: Mesh[] = [];
  gameWon = false; // Nouvel état pour suivre la victoire
  deathCount = 0;
  assetPack: string | null = null;
  loadedMeshes: Mesh[] = [];


  dangerousMeshes: Mesh[] = [];
  spawnPlatform!: Mesh;
  spawnWalls: Mesh[] = [];
  initialPlayerPosition = new Vector3(0, 1, 0);
  initialCameraAlpha = Math.PI / -2; // Angle initial horizontal de la caméra
  initialCameraBeta = Math.PI / 4;   // Angle initial vertical de la caméra
  initialCameraRadius = 10;          // Distance initiale de la caméra

  // Vitesses
  private initialSpeed = 0.075;
  private reducedSpeed = 0.035;
  private speed = this.initialSpeed;
  private fallSpeed = 0.15;
  private hasLeftSpawnPlatform = false;

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(this.canvas, true);
    this.scene = this.CreateScene();

    this.init().then(() => {
      this.engine.runRenderLoop(() => {
        if (!this.gameWon) {
          this.updatePlayerMovement();
          this.checkCollisionWithDangerousAssets();
        }
        this.checkWinCondition();
        this.camera.target = this.player.position;
        this.scene.render();
      });
    });
  }

  private async init() {
    this.assetPack = "kaykit-variety";
    await this.loadKaykitAssets();
    this.generateDropperLayers(20, -10, 10, 5, 25, 0, 5, 5, 10);
  }


  CreateScene(): Scene {
    const scene = new Scene(this.engine);
    scene.collisionsEnabled = true;
    const hemiLight = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), scene);
    hemiLight.intensity = 0.5;

    // Ajouter une lumière directionnelle
    const dirLight = new DirectionalLight("dirLight", new Vector3(0.5, -1, 0.5), scene);
    dirLight.intensity = 0.7;
    dirLight.diffuse = new Color3(1, 1, 1);
    dirLight.specular = new Color3(1, 1, 1);


    // Sol principal (plateforme de départ)
    this.spawnPlatform = MeshBuilder.CreateGround("ground", { width: 20, height: 10 }, scene);
    this.spawnPlatform.checkCollisions = true;

    // Création des murs invisibles autour de la plateforme de départ
    this.createInvisibleWalls();

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
      Math.PI / -2,
      Math.PI / 4,
      10,
      this.player.position,
      scene
    );
    this.camera.attachControl(this.canvas, true);
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

    return scene;
  }

  CreateMeshes(): void{
    SceneLoader.ImportMesh(
      "",
      "./models/",
      "chicken.vox.glb",
      this.scene,
      (meshes,) => {
        console.log("meshes", meshes);
      }
    )
  }

  public async loadKaykitAssets(): Promise<void> {
  const importPromises = kaykitAssets.map(name =>
    SceneLoader.ImportMeshAsync(
      "",
      "./models/kaykit-varietypack-assets/",
      name,
      this.scene
    ).then(result => {
      result.meshes.forEach(mesh => {
        if (mesh instanceof Mesh && mesh.name !== "__root__") {
          mesh.setEnabled(false);
          
          // Forcer l'opacité des matériaux
          if (mesh.material) {
            if (mesh.material instanceof PBRMaterial) {
              mesh.material.alpha = 1; // Force l'opacité totale
              mesh.material.transparencyMode = PBRMaterial.PBRMATERIAL_OPAQUE;
            } else if (mesh.material instanceof StandardMaterial) {
              mesh.material.alpha = 1;
            }
          }
          
          this.loadedMeshes.push(mesh);
        }
      });
    })
  );

  await Promise.all(importPromises);
}

  // Crée des murs invisibles autour de la plateforme de départ
  private createInvisibleWalls() {
    const platformWidth = 20;
    const platformHeight = 10;
    const wallHeight = 5; // Hauteur des murs
    
    // Mur arrière (empêche de reculer)
    const backWall = MeshBuilder.CreateBox("backWall", {
      width: platformWidth,
      height: wallHeight,
      depth: 1
    }, this.scene);
    backWall.position = new Vector3(0, wallHeight/2, -platformHeight/2);
    backWall.checkCollisions = true;
    backWall.isVisible = false;
    this.spawnWalls.push(backWall);

    // Murs latéraux (empêchent de sortir sur les côtés)
    const sideWallWidth = 1;
    const leftWall = MeshBuilder.CreateBox("leftWall", {
      width: sideWallWidth,
      height: wallHeight,
      depth: platformHeight
    }, this.scene);
    leftWall.position = new Vector3(-platformWidth/2, wallHeight/2, 0);
    leftWall.checkCollisions = true;
    leftWall.isVisible = false;
    this.spawnWalls.push(leftWall);

    const rightWall = MeshBuilder.CreateBox("rightWall", {
      width: sideWallWidth,
      height: wallHeight,
      depth: platformHeight
    }, this.scene);
    rightWall.position = new Vector3(platformWidth/2, wallHeight/2, 0);
    rightWall.checkCollisions = true;
    rightWall.isVisible = false;
    this.spawnWalls.push(rightWall);

    // Note: Pas de mur avant pour permettre au joueur de sauter
  }

  private isPlayerOnSpawnPlatform(): boolean {
    const ray = new Ray(this.player.position, new Vector3(0, -1, 0), 1.1);
    const pickInfo = ray.intersectsMesh(this.spawnPlatform, false);
    return pickInfo.hit || false;
  }  

  private resetPlayer() {
    this.deathCount++;
    console.log(`💀 Mort #${this.deathCount}`);

    this.player.position = this.initialPlayerPosition.clone();
    this.speed = this.initialSpeed;
    this.hasLeftSpawnPlatform = false;
    this.gameWon = false; // Réinitialise l'état de victoire
    
    // Réinitialise la position de la caméra
    this.camera.alpha = this.initialCameraAlpha;
    this.camera.beta = this.initialCameraBeta;
    this.camera.radius = this.initialCameraRadius;
    this.camera.target = this.player.position;
  }

  private updatePlayerMovement() {
    if (!this.player) return;
    
    const isOnPlatform = this.isPlayerOnSpawnPlatform();
    
    if (!this.hasLeftSpawnPlatform && !isOnPlatform) {
      this.hasLeftSpawnPlatform = true;
      this.speed = this.reducedSpeed;
    }
    
    if (isOnPlatform && this.hasLeftSpawnPlatform) {
      this.speed = this.initialSpeed;
      this.hasLeftSpawnPlatform = false;
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
    
    this.player.moveWithCollisions(new Vector3(0, -this.fallSpeed, 0));
  }

  private checkCollisionWithDangerousAssets() {
    const downOrigin = this.player.position.clone();
    downOrigin.y -= this.player.scaling.y;
  
    const radius = this.player.scaling.x / 2;
    const numSteps = 5;
    const step = (radius * 2) / (numSteps - 1);
  
    for (let i = 0; i < numSteps; i++) {
      for (let j = 0; j < numSteps; j++) {
        const offsetX = -radius + i * step;
        const offsetZ = -radius + j * step;
  
        if (offsetX * offsetX + offsetZ * offsetZ <= radius * radius) {
          const rayOrigin = downOrigin.clone().add(new Vector3(offsetX, 0, offsetZ));
          const ray = new Ray(rayOrigin, new Vector3(0, -1, 0), 0.2);
  
          for (const mesh of this.dangerousMeshes) {
            const pickInfo = ray.intersectsMesh(mesh, false);
            if (pickInfo.hit) {
              this.resetPlayer();
              return;
            }
          }
        }
      }
    }
  }
  
  private checkWinCondition() {
    if (this.gameWon || this.winBlocks.length === 0) return;

    const playerBottom = this.player.position.y - this.player.scaling.y / 2;
    const playerX = this.player.position.x;
    const playerZ = this.player.position.z;

    for (const block of this.winBlocks) {
      const blockTop = block.position.y + block.scaling.y / 2;
      if (playerBottom <= blockTop) {
        const blockX = block.position.x;
        const blockZ = block.position.z;
        const blockWidth = block.scaling.x * block.getBoundingInfo().boundingBox.extendSize.x * 2;
        const blockDepth = block.scaling.z * block.getBoundingInfo().boundingBox.extendSize.z * 2;

        if (
          Math.abs(playerX - blockX) < blockWidth / 2 &&
          Math.abs(playerZ - blockZ) < blockDepth / 2
        ) {
          this.handleWin();
          break;
        }
      }
    }
  }


  private handleWin() {
    console.log("🏆 Victoire !");
    this.gameWon = true;
    
    // Positionne le joueur précisément sur la plateforme de victoire
    this.player.position = new Vector3(
      this.winBlocks[0].position.x,
      this.winBlocks[0].position.y + this.winBlocks[0].scaling.y/2 + this.player.scaling.y/2,
      this.winBlocks[0].position.z
    );
    
    this.showWinMenu();
  }

  private showWinMenu() {
    const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
  
    // Conteneur principal
    const panel = new GUI.StackPanel();
    panel.width = "400px";
    panel.top = "100px";
    panel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    panel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    panel.isVertical = true;
    advancedTexture.addControl(panel);
  
    // Titre
    const title = new GUI.TextBlock();
    title.text = "🏆 Bravo, vous avez gagné !";
    title.color = "white";
    title.fontSize = 28;
    title.height = "60px";
    panel.addControl(title);
  
    // Compteur de morts
    const deathCounter = new GUI.TextBlock();
    deathCounter.text = `💀 Morts : ${this.deathCount}`;
    deathCounter.color = "white";
    deathCounter.fontSize = 24;
    deathCounter.height = "40px";
    panel.addControl(deathCounter);
  
    // Bouton Recommencer
    const restartButton = GUI.Button.CreateSimpleButton("restart", "🔁 Recommencer");
    restartButton.width = "200px";
    restartButton.height = "50px";
    // restartButton.paddingBottom = "10px";
    restartButton.color = "white";
    restartButton.background = "#3498db";
    restartButton.cornerRadius = 10;
    restartButton.fontSize = 20;
    restartButton.onPointerClickObservable.add(() => {
      advancedTexture.dispose();
      this.resetPlayer();
    });
    panel.addControl(restartButton);

    panel.spacing = 10;
  
    // Bouton Quitter
    const quitButton = GUI.Button.CreateSimpleButton("quit", "❌ Quitter");
    quitButton.width = "200px";
    quitButton.height = "50px";
    quitButton.color = "white";
    quitButton.background = "#e74c3c";
    quitButton.cornerRadius = 10;
    quitButton.fontSize = 20;
    quitButton.onPointerClickObservable.add(() => {
      window.location.href = "./";
    });
    panel.addControl(quitButton);
  }
  
  
  private shapes = [
    () => MeshBuilder.CreateBox("box", { size: 1 }, this.scene),
    () => MeshBuilder.CreateSphere("sphere", { diameter: 1 }, this.scene),
    () => MeshBuilder.CreateCylinder("cylinder", { height: 1, diameter: 1 }, this.scene),
    () => MeshBuilder.CreatePolyhedron("pyramid", { type: 0, size: 1 }, this.scene),
  ];

  public generateDropperLayers(
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

    const wallHeight = Math.abs(endY - startY) + 10;
    const wallCenterY = endY / 2 - 5;

    const leftWall = MeshBuilder.CreateBox("leftWall", { width: 1, height: wallHeight, depth: maxZ - minZ }, this.scene);
    leftWall.position = new Vector3(minX - 0.5, wallCenterY, (minZ + maxZ) / 2);
    leftWall.checkCollisions = true;
    leftWall.isVisible = false;

    const rightWall = MeshBuilder.CreateBox("rightWall", { width: 1, height: wallHeight, depth: maxZ - minZ }, this.scene);
    rightWall.position = new Vector3(maxX + 0.5, wallCenterY, (minZ + maxZ) / 2);
    rightWall.checkCollisions = true;
    rightWall.isVisible = false;

    const frontWall = MeshBuilder.CreateBox("frontWall", { width: maxX - minX, height: wallHeight, depth: 1 }, this.scene);
    frontWall.position = new Vector3((minX + maxX) / 2, wallCenterY, minZ - 0.5);
    frontWall.checkCollisions = true;
    frontWall.isVisible = false;

    const backWall = MeshBuilder.CreateBox("backWall", { width: maxX - minX, height: wallHeight, depth: 1 }, this.scene);
    backWall.position = new Vector3((minX + maxX) / 2, wallCenterY, maxZ + 0.5);
    backWall.checkCollisions = true;
    backWall.isVisible = false;

    for (let i = 0; i < layerCount; i++) {
      const t = i / (layerCount - 1);
      const layerSpacing = maxSpacing - t * (maxSpacing - minSpacing);
      currentY -= layerSpacing;
      const objectCount = Math.floor(minObj + ((maxObj - minObj) * i) / (layerCount - 1));

      for (let j = 0; j < objectCount; j++) {
        let mesh: Mesh;
        if (this.assetPack === "kaykit-variety" && this.loadedMeshes.length > 0) {
          const original = this.loadedMeshes[Math.floor(Math.random() * this.loadedMeshes.length)];
          mesh = original.clone("clone")!;
          
          // Corriger le matériau du clone
          if (mesh.material) {
            if (mesh.material instanceof PBRMaterial) {
              mesh.material.alpha = 1;
              mesh.material.transparencyMode = PBRMaterial.PBRMATERIAL_OPAQUE;
            } else if (mesh.material instanceof StandardMaterial) {
              mesh.material.alpha = 1;
            }
            
            // Forcer le rendu en mode solide (pas de transparence)
            mesh.material.backFaceCulling = false;
            mesh.material.disableDepthWrite = false;
          }
          
          mesh.setEnabled(true);
        } else {
          const shapeFunc = this.shapes[Math.floor(Math.random() * this.shapes.length)];
          mesh = shapeFunc();
        }

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
        this.dangerousMeshes.push(mesh);
      }
    }

    // === Bloc rose de victoire ===
    const winBlockHeight = 1;
    const winBlock = MeshBuilder.CreateBox("winBlock", {
      width: maxX - minX,
      depth: maxZ - minZ,
      height: winBlockHeight,
    }, this.scene);

    winBlock.position = new Vector3(
      (minX + maxX) / 2,
      endY - maxSpacing,
      (minZ + maxZ) / 2
    );

    const winMaterial = new PBRMaterial("winMaterial", this.scene);
    winMaterial.albedoColor = new Color3(1, 0.4, 0.7);
    winBlock.material = winMaterial;

    winBlock.checkCollisions = false;
    this.winBlocks.push(winBlock);


    // === Bed model above the win block ===
    SceneLoader.ImportMesh(
      "",
      "./models/",
      "bed.glb",
      this.scene,
      (meshes) => {
        const bedMesh = meshes[0] as Mesh;
        bedMesh.position = winBlock.position.add(new Vector3(0, winBlockHeight / 2 + 0.5, 0));
        bedMesh.scaling = new Vector3(1, 1, 1);
        bedMesh.checkCollisions = false;

        // Pour que le lit soit aussi une plateforme de victoire
        this.winBlocks.push(bedMesh);

      }
    );


  }

}