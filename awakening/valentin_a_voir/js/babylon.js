document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("renderCanvas");
    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.53, 0.81, 0.98, 1); // Ciel bleu pastel

    // Configuration de la caméra (positionnée pour observer la zone de chute)
    const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 20, -30), scene);
    camera.setTarget(new BABYLON.Vector3(0, 20, 0));
    camera.attachControl(canvas, true);
    // Note : On ne lie pas la caméra au joueur afin que les obstacles restent fixes dans la scène.

    // Lumière plus douce
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;
    light.groundColor = new BABYLON.Color3(1, 0.8, 0.9);

    // Nuage plus réaliste
    const createCloud = () => {
        const cloud = new BABYLON.MeshBuilder.CreateSphere("cloud", {diameter: 8, segments: 16}, scene);
        cloud.position.y = 10;
        
        const cloudMat = new BABYLON.StandardMaterial("cloudMat", scene);
        cloudMat.diffuseColor = new BABYLON.Color3(0.95, 0.95, 1);
        cloudMat.specularColor = new BABYLON.Color3(0, 0, 0);
        cloud.material = cloudMat;
        
        // Variations pour un nuage plus naturel
        for (let i = 0; i < 5; i++) {
            const cloudPart = new BABYLON.MeshBuilder.CreateSphere("cloudPart", {diameter: 4 + Math.random() * 3}, scene);
            cloudPart.position = new BABYLON.Vector3(
                (Math.random() - 0.5) * 6,
                (Math.random() - 0.5) * 2 + 10,
                (Math.random() - 0.5) * 6
            );
            cloudPart.material = cloudMat;
        }
        
        return cloud;
    };

    createCloud();

    // Joueur (personnage stylisé) positionné en haut pour la chute
    const player = BABYLON.MeshBuilder.CreateSphere("player", {diameter: 1.5}, scene);
    player.position = new BABYLON.Vector3(0, 50, 0); // Position initiale haute
    const playerMat = new BABYLON.StandardMaterial("playerMat", scene);
    playerMat.diffuseColor = new BABYLON.Color3(0.2, 0.4, 0.8);
    player.material = playerMat;

    // Ajouter des yeux au joueur
    const createEye = (xOffset) => {
        const eye = BABYLON.MeshBuilder.CreateSphere("eye", {diameter: 0.3}, scene);
        eye.position = new BABYLON.Vector3(player.position.x + xOffset, player.position.y + 0.2, player.position.z - 0.7);
        eye.material = new BABYLON.StandardMaterial("eyeMat", scene);
        eye.material.diffuseColor = new BABYLON.Color3(1, 1, 1);
        eye.parent = player;
        
        const pupil = BABYLON.MeshBuilder.CreateSphere("pupil", {diameter: 0.15}, scene);
        pupil.position = new BABYLON.Vector3(0, 0, -0.2);
        pupil.material = new BABYLON.StandardMaterial("pupilMat", scene);
        pupil.material.diffuseColor = new BABYLON.Color3(0, 0, 0);
        pupil.parent = eye;
    };

    createEye(-0.3);
    createEye(0.3);

    // Message stylisé
    const message = document.createElement("div");
    message.innerHTML = `
        <div style="font-family: 'Comic Sans MS', cursive, sans-serif; text-align: center;">
            <div style="font-size: 18px; color: #333; margin-bottom: 5px;">"Ce rêve est vraiment ennuyeux, je veux changer de rêve !"</div>
            <div style="font-size: 16px; color: #555;">Évite les obstacles en te déplaçant de gauche à droite</div>
            <div style="margin-top: 10px; font-size: 14px; color: #777;">Utilise les flèches ← et → pour te déplacer</div>
        </div>
    `;
    message.style.position = "absolute";
    message.style.top = "20px";
    message.style.left = "50%";
    message.style.transform = "translateX(-50%)";
    message.style.padding = "15px";
    message.style.backgroundColor = "rgba(255, 255, 255, 0.85)";
    message.style.borderRadius = "15px";
    message.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
    message.style.border = "2px solid #ffb6e6";
    document.body.appendChild(message);

    let collisions = 0;
    const maxCollisions = 5;

    // Compteur d'objets touchés
    const collisionCounter = document.createElement("div");
    collisionCounter.style.position = "absolute";
    collisionCounter.style.bottom = "20px";
    collisionCounter.style.left = "50%";
    collisionCounter.style.transform = "translateX(-50%)";
    collisionCounter.style.padding = "10px 20px";
    collisionCounter.style.backgroundColor = "rgba(255, 255, 255, 0.7)";
    collisionCounter.style.borderRadius = "10px";
    collisionCounter.style.fontFamily = "'Comic Sans MS', cursive, sans-serif";
    collisionCounter.style.fontSize = "16px";
    collisionCounter.style.color = "#ff66b2";
    collisionCounter.style.border = "2px dashed #ff66b2";
    collisionCounter.textContent = `Objets touchés: ${collisions}/${maxCollisions}`;
    document.body.appendChild(collisionCounter);

    // Création d'obstacles fixes
    const obstacles = [];
    const obstacleTypes = [
        { name: "licorne", color: new BABYLON.Color3(1, 0.6, 0.9), size: 1.5 },
        { name: "bonbon", color: new BABYLON.Color3(0.9, 0.2, 0.2), size: 1 },
        { name: "manette", color: new BABYLON.Color3(0.3, 0.3, 0.8), size: 1.2 },
        { name: "nuage", color: new BABYLON.Color3(0.95, 0.95, 1), size: 1.3 },
        { name: "étoile", color: new BABYLON.Color3(1, 0.9, 0.2), size: 1 }
    ];

    function spawnObstacles() {
        // On répartit les obstacles sur toute la hauteur de la scène
        for (let i = 0; i < 30; i++) {
            const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
            let obstacle;
            
            if (type.name === "licorne") {
                // Licorne simplifiée (sphère + cône pour la corne)
                obstacle = BABYLON.MeshBuilder.CreateSphere("obstacle", { diameter: type.size }, scene);
                const horn = BABYLON.MeshBuilder.CreateCylinder("horn", { 
                    diameterTop: 0, 
                    diameterBottom: 0.3, 
                    height: 0.8 
                }, scene);
                horn.rotation.x = Math.PI / 2;
                horn.position.y = type.size / 2;
                horn.parent = obstacle;
                horn.material = new BABYLON.StandardMaterial("hornMat", scene);
                horn.material.diffuseColor = new BABYLON.Color3(1, 0.9, 0.6);
            } 
            else if (type.name === "bonbon") {
                // Bonbon rayé
                obstacle = BABYLON.MeshBuilder.CreateSphere("obstacle", { diameter: type.size }, scene);
                const stripes = BABYLON.MeshBuilder.CreateCylinder("stripes", {
                    diameter: type.size * 1.1,
                    height: 0.1
                }, scene);
                stripes.rotation.x = Math.PI / 2;
                stripes.parent = obstacle;
                stripes.material = new BABYLON.StandardMaterial("stripesMat", scene);
                stripes.material.diffuseColor = new BABYLON.Color3(1, 1, 1);
            }
            else {
                obstacle = BABYLON.MeshBuilder.CreateSphere("obstacle", { diameter: type.size }, scene);
            }
            
            // Les obstacles sont placés de manière fixe sur l'axe vertical (du haut vers le bas)
            obstacle.position = new BABYLON.Vector3(
                (Math.random() - 0.5) * 20,
                50 - i * 4,  // On descend progressivement
                (Math.random() - 0.5) * 20
            );
            
            obstacle.material = new BABYLON.StandardMaterial("obstacleMat", scene);
            obstacle.material.diffuseColor = type.color;
            obstacle.material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
            
            // Rotation aléatoire pour un effet plus dynamique
            obstacle.rotation = new BABYLON.Vector3(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );
            
            obstacles.push(obstacle);
        }
    }
    spawnObstacles();

    // Contrôles : déplacement horizontal uniquement
    document.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") {
            player.position.x -= 0.5;
        } else if (event.key === "ArrowRight") {
            player.position.x += 0.5;
        }
    });

    // La chute libre démarre dès le début (falling = true)
    let falling = true;

    // Animation de chute
    scene.onBeforeRenderObservable.add(() => {
        if (falling) {
            // Le joueur descend continuellement (chute libre)
            player.position.y -= 0.15;
            
            // Optionnel : rotation pour l'effet de chute
            player.rotation.z += 0.02;
            
            // Vérifier les collisions avec les obstacles fixes
            obstacles.forEach((obstacle) => {
                if (player.intersectsMesh(obstacle, false)) {
                    collisions++;
                    collisionCounter.textContent = `Objets touchés: ${collisions}/${maxCollisions}`;
                    obstacle.dispose();
                    
                    // Effet visuel lors d'une collision
                    const hitEffect = BABYLON.MeshBuilder.CreateSphere("hit", {diameter: 2}, scene);
                    hitEffect.position = obstacle.position.clone();
                    hitEffect.material = new BABYLON.StandardMaterial("hitMat", scene);
                    hitEffect.material.diffuseColor = new BABYLON.Color3(1, 0.2, 0.2);
                    hitEffect.material.alpha = 0.6;
                    
                    scene.onAfterRenderObservable.addOnce(() => {
                        hitEffect.dispose();
                    });
                }
            });
            
            // Fin de la chute (succès) quand le joueur atteint un certain bas de la scène
            if (player.position.y < -100) {
                const successDiv = document.createElement("div");
                successDiv.innerHTML = `
                    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                                background: rgba(173, 216, 230, 0.8); display: flex; 
                                justify-content: center; align-items: center; z-index: 1000;">
                        <div style="background: white; padding: 30px; border-radius: 20px; 
                                    text-align: center; box-shadow: 0 0 20px rgba(0,0,0,0.2);
                                    border: 3px solid #ffb6e6;">
                            <h2 style="color: #ff66b2; font-family: 'Comic Sans MS', cursive;">
                                Nouveau rêve atteint !
                            </h2>
                            <p style="font-size: 18px;">Tu as réussi à changer de rêve !</p>
                            <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px;
                                        background: #ffb6e6; border: none; border-radius: 10px;
                                        font-family: 'Comic Sans MS', cursive; cursor: pointer;">
                                Recommencer
                            </button>
                        </div>
                    </div>
                `;
                document.body.appendChild(successDiv);
                falling = false;
            }
            
           
        }
    });

    engine.runRenderLoop(() => {
        scene.render();
    });

    window.addEventListener("resize", () => {
        engine.resize();
    });
});
