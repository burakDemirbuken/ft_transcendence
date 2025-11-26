// Using global BABYLON from CDN (loaded via script tag in index.html)
declare const BABYLON: any;

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

interface Position {
	x: number;
	y: number;
	z: number;
}

class ArcadeMachine
{
	private scene: BABYLON.Scene;
	public position: Position | null;
	private angle: number;
	private meshs: BABYLON.AbstractMesh[] | null;
	private body: BABYLON.Mesh | null;
	private gameScreen: BABYLON.DynamicTexture | null;
	private screenMaterial: BABYLON.StandardMaterial | null;
	private isActive: boolean;
	private screenSize: { width: number; height: number };
	private joystick1: BABYLON.Mesh | null;
	private debugCanvas: HTMLCanvasElement | null;
	private debugCtx: CanvasRenderingContext2D | null;

	constructor(scene: BABYLON.Scene)
	{
        this.scene = scene;
        this.position = null;
        this.angle = 0;
        this.meshs = null;
        this.body = null;
        this.gameScreen = null;
        this.screenMaterial = null;
        this.isActive = false;
        this.screenSize = SCREEN_SIZE;
		this.joystick1 = null;
		this.debugCanvas = null;
		this.debugCtx = null;
	}

  async load(position?: Position, angle?: number) {
        // gameContainer içindeki loading elementi kullan
	  const gameContainer = document.getElementById("gameContainer");
	  const loadingScreen = gameContainer ? gameContainer.querySelector("#loadingScreen") as HTMLElement | null : null;
	  const loadingText = loadingScreen ? loadingScreen.querySelector(".game-loading-text") as HTMLElement | null : null;
	  const loadingProgress = loadingScreen ? loadingScreen.querySelector("#loadingProgress") as HTMLElement | null : null;

        try {
            // 1. Loading ekranını göster
			if (loadingScreen) {
				loadingScreen.classList.remove("hidden");
				if (loadingText) loadingText.textContent = "Loading... 0%";
				if (loadingProgress) (loadingProgress as HTMLElement).style.width = "0%";
			}

            // 2. Modeli yükle (ilerleme takibi)
            const result = await BABYLON.SceneLoader.ImportMeshAsync(
                "",
                "/assets/models/arcade/",
                "arcade.glb",
                this.scene,
                (evt) => {
					if (evt.lengthComputable) {
						const progress = evt.loaded / evt.total;
						if (loadingText) loadingText.textContent = `Loading... ${Math.round(progress * 100)}%`;
						if (loadingProgress) (loadingProgress as HTMLElement).style.width = `${progress * 100}%`;
					}
                }
            );

            this.meshs = result.meshes;
            this.position = position || { x: 0, y: 0, z: 0 };
            this.angle = angle || 0;

            const parentMesh = this.meshs.find(mesh => mesh.parent === null) || this.meshs[0];
            if (parentMesh)
			{
                parentMesh.position = new BABYLON.Vector3(this.position.x, this.position.y, this.position.z);
                parentMesh.rotation = new BABYLON.Vector3(0, this.angle, 0);
            }
			else
                console.warn("Parent mesh not found. Using default position and rotation.");

            const light1 = new BABYLON.HemisphericLight(
                "light1",
                new BABYLON.Vector3(this.position.x, this.position.y + 1, this.position.z),
                this.scene
            );
            light1.intensity = 0.4;

            this.createGameScreen();
            this.setActive(true);

        }
		catch (error)
		{
            console.error("❌ Error loading arcade machine:", error);
            throw error;
        }
		finally
		{
			if (loadingScreen) {
				setTimeout(() => { loadingScreen.classList.add("hidden"); }, 500);
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
            console.warn(`Screen mesh not found. Available meshes: ${this.meshs.map(m => m.name).join(', ')}`);
		const ctx = this.gameScreen.getContext();

		ctx.fillStyle = "#000000";
		ctx.fillRect(0, 0, this.screenSize.width, this.screenSize.height);
		this.gameScreen.update();
    }

	joystickMove(number: number, direction: string): void
	{
		if (!this.meshs) return;

		if (number !== 1 && number !== 2) return;
		const joystickParts = this.meshs.filter(m => {
			const name = m.name.toLowerCase();
			return name.startsWith(`joystick${number}`) &&
				   (name.includes('primitive'));
		});

		if (joystickParts.length === 0) {
			console.warn(`Joystick${number} parts not found. Available meshes:`, this.meshs.map(m => m.name));
			return;
		}

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
		else if (direction === 'reset' || direction === 'neutral')
			targetRotation = new BABYLON.Vector3(0, 0, 0);


		joystickParts.forEach(part => {
			this.smoothRotateJoystick(part, targetRotation);
		});
	}

	private smoothRotateJoystick(mesh: BABYLON.AbstractMesh, targetRotation: BABYLON.Vector3): void
	{
		const lerpSpeed = 0.30;

		mesh.rotation.x = BABYLON.Scalar.Lerp(mesh.rotation.x, targetRotation.x, lerpSpeed);
		mesh.rotation.y = BABYLON.Scalar.Lerp(mesh.rotation.y, targetRotation.y, lerpSpeed);
		mesh.rotation.z = BABYLON.Scalar.Lerp(mesh.rotation.z, targetRotation.z, lerpSpeed);
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

	private createFallbackMesh(): void
	{
		try {
			// Create a simple box as fallback
			const box = BABYLON.MeshBuilder.CreateBox("arcadeFallback", {size: 2}, this.scene);
			box.position = new BABYLON.Vector3(this.position.x, this.position.y + 1, this.position.z);
			box.rotation = new BABYLON.Vector3(0, this.angle, 0);

			// Create a simple material
			const material = new BABYLON.StandardMaterial("arcadeFallbackMaterial", this.scene);
			material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.8);
			box.material = material;

			this.meshs = [box];
		} catch (error) {
			console.error("❌ Failed to create fallback mesh:", error);
			this.meshs = [];
		}
	}
}

export default ArcadeMachine;
