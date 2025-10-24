/*
const exampleArcadeSettings =
{
	arcade:
	{
		position:
		{
			x: 0,
			y: 0,
			z: 0
		},
		machine:
		{
			path: "../models/arcade/classic/",
			model: "arcade.obj",
			colors:
			{
				body: "#FF0000",
				sides: "#00FF00",
				joystick: "#0000FF",
				buttons: "#FFFF00"
			}
		}
	},
};
*/

import { SCREEN_SIZE } from "../utils/constants.js";

class ArcadeMachine
{
	constructor(scene)
	{
        this.scene = scene;
        this.position = null;
        this.meshs = null;
        this.body = null;
        this.gameScreen = null;
        this.screenMaterial = null;
        this.isActive = false;
        this.screenSize = SCREEN_SIZE;
		this.joystick1 = null;
    }

    async load(position, angle) {
        // gameContainer içindeki loading elementi kullan
        const gameContainer = document.getElementById("gameContainer");
        const loadingScreen = gameContainer ? gameContainer.querySelector("#loadingScreen") : null;
        const loadingText = loadingScreen ? loadingScreen.querySelector(".game-loading-text") : null;
        const loadingProgress = loadingScreen ? loadingScreen.querySelector("#loadingProgress") : null;

        try {
            // 1. Loading ekranını göster
            if (loadingScreen) {
                loadingScreen.classList.remove("hidden");
                if (loadingText) loadingText.textContent = "Loading... 0%";
                if (loadingProgress) loadingProgress.style.width = "0%";
            }

            console.log("🎮 Loading arcade model from: ./assets/models/arcade/arcade.glb");

            // 2. Modeli yükle (ilerleme takibi)
            const result = await BABYLON.SceneLoader.ImportMeshAsync(
                "",
                "./assets/models/arcade/",
                "arcade.glb",
                this.scene,
                (evt) => {
                    if (evt.lengthComputable) {
                        const progress = evt.loaded / evt.total;
                        if (loadingText) loadingText.textContent = `Loading... ${Math.round(progress * 100)}%`;
                        if (loadingProgress) loadingProgress.style.width = `${progress * 100}%`;
                    }
                }
            );

            this.meshs = result.meshes;
            this.position = position || { x: 0, y: 0, z: 0 };
            this.angle = angle || 0;

            const parentMesh = this.meshs.find(mesh => mesh.parent === null) || this.meshs[0];
            if (parentMesh) {
                parentMesh.position = new BABYLON.Vector3(this.position.x, this.position.y, this.position.z);
                parentMesh.rotation = new BABYLON.Vector3(0, this.angle, 0);
            } else {
                console.warn("Parent mesh not found. Using default position and rotation.");
            }

            const light1 = new BABYLON.HemisphericLight(
                "light1",
                new BABYLON.Vector3(this.position.x, this.position.y + 1, this.position.z),
                this.scene
            );
            light1.intensity = 0.4;

            this.createGameScreen();
            this.setActive(true);

            console.log("✅ Arcade machine loaded successfully");
        } catch (error) {
            console.error("❌ Error loading arcade machine:", error);
            throw error; // Hatayı yukarı fırlat
        } finally {
            // 3. Yükleme tamamlandıktan sonra loading ekranını kapat
            if (loadingScreen) {
                setTimeout(() => {
                    loadingScreen.classList.add("hidden");
                }, 500);
            }
        }

        return this;
    }

	createGameScreen()
	{
        this.gameScreen = new BABYLON.DynamicTexture(`gameScreen`, this.screenSize, this.scene);

		this.gameScreen.hasAlpha = false;
		this.gameScreen.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
		this.gameScreen.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;

		this.gameScreen.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);

        this.screenMaterial = new BABYLON.StandardMaterial(`screenMaterial`, this.scene);
        this.screenMaterial.diffuseTexture = this.gameScreen;
        this.screenMaterial.emissiveTexture = this.gameScreen;

        let screenMesh = this.meshs.find(m => m.name.toLowerCase().includes("screen"));
        if (screenMesh)
		{
            screenMesh.material = this.screenMaterial;
        }
		else
		{
            console.warn(`Screen mesh not found. Available meshes: ${this.meshs.map(m => m.name).join(', ')}`);
        }
    }

	joystickMove(number, direction)
	{
		// Find all joystick parts (primitive0, primitive1, base)
		const joystickParts = this.meshs.filter(m => {
			const name = m.name.toLowerCase();
			return name.startsWith(`joystick${number}`) &&
				   (name.includes('primitive'));
		});

		if (joystickParts.length === 0) {
			console.warn(`Joystick${number} parts not found. Available meshes:`, this.meshs.map(m => m.name));
			return;
		}

		console.log(`🕹️ Moving joystick${number} parts:`, joystickParts.map(p => p.name));

		const tiltAngle = 0.3;
		let targetRotation = new BABYLON.Vector3(0, 0, 0);

		if (direction === 'up')
			targetRotation = new BABYLON.Vector3(-tiltAngle, 0, 0);
		else if (direction === 'down')
			targetRotation = new BABYLON.Vector3(tiltAngle, 0, 0);
		else if (direction === 'left')
			targetRotation = new BABYLON.Vector3(0, -tiltAngle, 0);
		else if (direction === 'right')
			targetRotation = new BABYLON.Vector3(0, tiltAngle, 0);
		else if (direction === 'reset')
			targetRotation = new BABYLON.Vector3(0, 0, 0);

		// TODO: joystick hareketi düzeltilecek

		// Animate each joystick part
		joystickParts.forEach(part => {
			this.#animateJoystickRotation(part, targetRotation);
		});
	}

	#animateJoystickRotation(mesh, targetRotation)
	{
		// Stop any existing animations on this mesh
		this.scene.stopAnimation(mesh);

		const animationDuration = 15; // frames (at 60fps = ~0.25 seconds)

		// Create animation for each axis
		const animationX = new BABYLON.Animation(
			"joystickRotationX",
			"rotation.x",
			60, // 60 FPS
			BABYLON.Animation.ANIMATIONTYPE_FLOAT,
			BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
		);

		const animationY = new BABYLON.Animation(
			"joystickRotationY",
			"rotation.y",
			60,
			BABYLON.Animation.ANIMATIONTYPE_FLOAT,
			BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
		);

		// Define keyframes
		const keysX = [
			{ frame: 0, value: mesh.rotation.x },
			{ frame: animationDuration, value: targetRotation.x }
		];

		const keysY = [
			{ frame: 0, value: mesh.rotation.y },
			{ frame: animationDuration, value: targetRotation.y }
		];

		animationX.setKeys(keysX);
		animationY.setKeys(keysY);

		// Add easing for smoother feel
		const easingFunction = new BABYLON.CubicEase();
		easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
		animationX.setEasingFunction(easingFunction);
		animationY.setEasingFunction(easingFunction);

		// Start animations
		this.scene.beginAnimation(mesh, 0, animationDuration, false, 1.0, () => {
			// Animation completed callback (optional)
		});

		// Apply animations to mesh
		mesh.animations = [animationX, animationY];
	}

		//!! SİLİNECEK
	#createEnhancedDebugInfo(screenMesh)
	{
		const oldDebug = document.getElementById('debug-texture');
		if (oldDebug) oldDebug.remove();

		const debugDiv = document.createElement('div');
		debugDiv.id = 'debug-texture';
		debugDiv.style.cssText = `
			position: fixed;
			top: 10px;
			right: 10px;
			background: rgba(0,0,0,0.9);
			color: white;
			padding: 15px;
			border-radius: 8px;
			font-family: monospace;
			font-size: 12px;
			z-index: 1000;
			width: auto;
			height: auto;
		`;

		const title = document.createElement('div');
		title.textContent = 'Arcade Screen Debug';
		title.style.cssText = 'font-weight: bold; margin-bottom: 10px; color: #00ff88;';
		debugDiv.appendChild(title);

		const meshInfo = document.createElement('div');
		meshInfo.innerHTML = `
			<strong>Mesh:</strong> ${screenMesh.name}<br>
			<strong>Vertices:</strong> ${screenMesh.getTotalVertices()}<br>
			<strong>Material:</strong> ${screenMesh.material ? screenMesh.material.name : 'None'}<br>
			<strong>Texture Size:</strong> ${this.gameScreen.getSize().width}x${this.gameScreen.getSize().height}
		`;
		meshInfo.style.marginBottom = '10px';
		debugDiv.appendChild(meshInfo);

		let çarpan = 0.25;
		let width = this.screenSize.width * çarpan;
		let height = this.screenSize.height * çarpan;

		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		canvas.style.border = '1px solid #00ff88';
		canvas.style.display = 'block';

		const ctx = canvas.getContext('2d');

		// Canvas'ı instance değişkeni olarak sakla
		this.debugCanvas = canvas;
		this.debugCtx = ctx;

		// İlk preview'ı oluştur
		this.updatePreview();
		debugDiv.appendChild(canvas);

		const buttonContainer = document.createElement('div');
		buttonContainer.style.marginTop = '10px';

		debugDiv.appendChild(buttonContainer);

		document.body.appendChild(debugDiv);

		// Global fonksiyonu da tanımla
		window.updateDebugCanvas = () => this.updatePreview();
	}

	updatePreview()
	{
		if (!this.debugCanvas || !this.debugCtx || !this.gameScreen) {
			return;
		}

		const sourceCanvas = this.gameScreen.getContext().canvas;
		this.debugCtx.clearRect(0, 0, this.debugCanvas.width, this.debugCanvas.height);
		this.debugCtx.drawImage(sourceCanvas, 0, 0, this.debugCanvas.width, this.debugCanvas.height);
	}

    getScreenContext()
	{
        return this.gameScreen.getContext();
    }

    updateScreen()
	{
        this.gameScreen.update();
    }

    setActive(active)
	{
        this.isActive = active;
        if (this.screenMaterial)
            this.screenMaterial.alpha = active ? 1.0 : 0.5;
    }

    dispose()
	{
        if (this.gameScreen)
            this.gameScreen.dispose();
        if (this.screenMaterial)
            this.screenMaterial.dispose();
        if (this.meshs)
			this.meshs.forEach(
				mesh =>
				{
					if (mesh) mesh.dispose();
				}
			);
    }
}

export default ArcadeMachine;
