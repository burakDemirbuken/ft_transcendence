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
	constructor(id, scene)
	{
        this.id = id;
        this.scene = scene;
        this.position = null;
        this.meshs = null;
        this.body = null;
        this.gameScreen = null;
        this.screenMaterial = null;
        this.isActive = false;
        this.screenSize = SCREEN_SIZE;
		console.log(`ArcadeMachine initialized with screen size: ${this.screenSize.width}x${this.screenSize.height}`);
    }

    async load(arcadeSettings)
	{
        try
		{
			const result = await BABYLON.SceneLoader.ImportMeshAsync("", "./src/assets/models/arcade/", "arcade.obj", this.scene);
			this.meshs = result.meshes;
			this.position = arcadeSettings.position || { x: 0, y: 0, z: 0 };

			this.body = this.meshs[0];

            if (this.body)
			{
                const parentMesh = new BABYLON.TransformNode(`arcadeMachine_${this.id}`, this.scene);

                this.meshs.forEach(
					mesh =>
					{
                    	mesh.parent = parentMesh;
					});

                parentMesh.position = new BABYLON.Vector3(this.position.x, this.position.y, this.position.z);
                parentMesh.scaling = new BABYLON.Vector3(1, 1, 1);

                this.body = parentMesh;
            }
        }
		catch (error)
		{
            console.error("Error loading arcade machine:", error);
            return;
        }

		const light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(this.position.x, this.position.y + 1, this.position.z), this.scene);
		light1.intensity = 0.7;

		const light2 = new BABYLON.DirectionalLight("light2", new BABYLON.Vector3(this.position.x -1, this.position.y -1, this.position.z -1), this.scene);
		light2.intensity = 0.5;

        this.createGameScreen();

        return this;
    }

	createGameScreen()
	{
        this.gameScreen = new BABYLON.DynamicTexture(`gameScreen_${this.id}`, this.screenSize, this.scene);

		this.gameScreen.hasAlpha = false;
		this.gameScreen.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
		this.gameScreen.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;

		this.gameScreen.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);

        this.screenMaterial = new BABYLON.StandardMaterial(`screenMaterial_${this.id}`, this.scene);
        this.screenMaterial.diffuseTexture = this.gameScreen;
        this.screenMaterial.emissiveTexture = this.gameScreen;

        let screenMesh = this.meshs.find(m => m.name.toLowerCase().includes("screen"));
        if (screenMesh)
		{
            screenMesh.material = this.screenMaterial;
            this.#fixUVMapping(screenMesh);
            this.#createEnhancedDebugInfo(screenMesh);
        }
		else
		{
            console.warn(`Screen mesh not found. Available meshes: ${this.meshs.map(m => m.name).join(', ')}`);
        }
    }

	#fixUVMapping(mesh)
	{
		const uvs = mesh.getVerticesData(BABYLON.VertexBuffer.UVKind);

		if (uvs)
		{
			if (uvs.length === 8)
			{
				uvs[0] = 1; uvs[1] = 1;
				uvs[2] = 0; uvs[3] = 1;
				uvs[4] = 0; uvs[5] = 0;
				uvs[6] = 1; uvs[7] = 0;
			}
			mesh.setVerticesData(BABYLON.VertexBuffer.UVKind, uvs);
		}
	}

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

		let çarpan = 1;
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
				});
    }
}

export default ArcadeMachine;
