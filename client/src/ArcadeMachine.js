class ArcadeMachine
{
	constructor(id, scene, position = { x: 0, y: 0, z: 0 })
	{
        this.id = id;
        this.scene = scene;
        this.position = position;
        this.meshs = null;
        this.gameScreen = null;
        this.screenMaterial = null;
        this.isActive = false;
    }

    async load()
	{

        const result = await BABYLON.SceneLoader.ImportMeshAsync("", "./models/", "ArcadeMachine.obj", this.scene);
		this.meshs = result.meshes;
		let body = this.meshs.find(m => m.name === "body");

        this.body.position = new BABYLON.Vector3(this.position.x, this.position.y, this.position.z);
		this.body.scaling = new BABYLON.Vector3(1, 1, 1);

        this.createGameScreen();

        return this;
    }


	createGameScreen()
	{
        const screenWidth = 512;
        const screenHeight = 512;

        this.gameScreen = new BABYLON.DynamicTexture(`gameScreen_${this.id}`, {
            width: screenWidth,
            height: screenHeight
        }, this.scene);

		this.gameScreen.hasAlpha = false;
		this.gameScreen.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
		this.gameScreen.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;

		this.gameScreen.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);

        // Ekran materyali
        this.screenMaterial = new BABYLON.StandardMaterial(`screenMaterial_${this.id}`, this.scene);
        this.screenMaterial.diffuseTexture = this.gameScreen;
        this.screenMaterial.emissiveTexture = this.gameScreen;

        const screenMesh = this.meshs.find(m => m.name === `screen`);
        if (screenMesh)
		{
            screenMesh.material = this.screenMaterial;
			this.#fixUVMapping(screenMesh);
			this.#createEnhancedDebugInfo(this.gameScreen, screenMesh);
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

	#createEnhancedDebugInfo(dynamicTexture, screenMesh)
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
			<strong>Texture Size:</strong> ${dynamicTexture.getSize().width}x${dynamicTexture.getSize().height}
		`;
		meshInfo.style.marginBottom = '10px';
		debugDiv.appendChild(meshInfo);

		let çarpan = 1;
		let width = dynamicTexture.getContext().canvas.width * çarpan;
		let height = dynamicTexture.getContext().canvas.height * çarpan;

		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		canvas.style.border = '1px solid #00ff88';
		canvas.style.display = 'block';

		const ctx = canvas.getContext('2d');

		function updatePreview()
		{
			const sourceCanvas = dynamicTexture.getContext().canvas;
			ctx.clearRect(0, 0, width, height);
			ctx.drawImage(sourceCanvas, 0, 0, width, height);
		}

		updatePreview();
		debugDiv.appendChild(canvas);

		const buttonContainer = document.createElement('div');
		buttonContainer.style.marginTop = '10px';

		debugDiv.appendChild(buttonContainer);

		document.body.appendChild(debugDiv);

		window.updateDebugCanvas = updatePreview;
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
        // Aktif olmayan makineleri solgun göster
        if (this.screenMaterial)
		{
            this.screenMaterial.alpha = active ? 1.0 : 0.5;
        }
    }

    dispose()
	{
        if (this.gameScreen)
		{
            this.gameScreen.dispose();
        }
        if (this.screenMaterial)
		{
            this.screenMaterial.dispose();
        }
        if (this.mesh)
		{
            this.mesh.dispose();
        }
    }
}

export default ArcadeMachine;
