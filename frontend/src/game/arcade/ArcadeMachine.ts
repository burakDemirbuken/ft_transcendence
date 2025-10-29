/// <reference types="babylonjs" />

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

	async load(position?: Position, angle?: number): Promise<ArcadeMachine>
	{
		try
		{
			console.log("🎮 Loading arcade machine model from: /assets/models/arcade/arcade.glb");

			// First check if BABYLON is available
			if (typeof BABYLON === 'undefined') {
				throw new Error('BABYLON.js is not available');
			}

			console.log("📦 Model loaded, processing meshes...");
			const result = await BABYLON?.SceneLoader?.ImportMeshAsync("", "./assets/models/arcade/", "arcade.glb", this.scene);
			console.log("🔍 Model import result:", result);
			this.meshs = result.meshes;
			this.position = position || { x: 0, y: 0, z: 0 };
			this.angle = angle || 0;

			console.log(`✅ Successfully loaded ${this.meshs.length} meshes`);

			const parentMesh = this.meshs.find(mesh => mesh.parent === null) || this.meshs[0];
			if (parentMesh)
			{
				parentMesh.position = new BABYLON.Vector3(this.position.x, this.position.y, this.position.z);
				parentMesh.rotation = new BABYLON.Vector3(0, this.angle, 0);
				console.log(`📍 Positioned arcade machine at (${this.position.x}, ${this.position.y}, ${this.position.z})`);
			}
			else
				console.warn("Parent mesh not found. Using default position and rotation.");
        }
		catch (error)
		{
            console.error("❌ Error loading arcade machine:", error);
            // Try to provide more specific error information
            if (error instanceof Error) {
                console.error("Error message:", error.message);
                console.error("Error stack:", error.stack);
            }
            // Don't return undefined, return this instance even if loading failed
            console.log("🔄 Continuing without 3D model, creating fallback...");

            // Set position and angle even when model loading fails
            this.position = position || { x: 0, y: 0, z: 0 };
            this.angle = angle || 0;

            // Create a simple fallback box mesh
            this.createFallbackMesh();
        }

        // Only create light if position is set
        if (this.position) {
            const light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(this.position.x, this.position.y + 1, this.position.z), this.scene);
            light1.intensity = 0.2; // Daha düşük ışık yoğunluğu
        }

        this.createGameScreen();
		this.setActive(true);
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
		const ctx = this.gameScreen.getContext();

		ctx.fillStyle = "#000000";
		ctx.fillRect(0, 0, this.screenSize.width, this.screenSize.height);
		this.gameScreen.update();
    }

	joystickMove(number: number, direction: string): void
	{
		if (!this.meshs) return;

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
			console.log("🔧 Creating fallback mesh...");
			// Create a simple box as fallback
			const box = BABYLON.MeshBuilder.CreateBox("arcadeFallback", {size: 2}, this.scene);
			box.position = new BABYLON.Vector3(this.position.x, this.position.y + 1, this.position.z);
			box.rotation = new BABYLON.Vector3(0, this.angle, 0);

			// Create a simple material
			const material = new BABYLON.StandardMaterial("arcadeFallbackMaterial", this.scene);
			material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.8);
			box.material = material;

			this.meshs = [box];
			console.log("✅ Fallback mesh created successfully");
		} catch (error) {
			console.error("❌ Failed to create fallback mesh:", error);
			this.meshs = [];
		}
	}
}

export default ArcadeMachine;
