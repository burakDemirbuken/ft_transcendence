class ArcadeMachine
{
	constructor(scene)
	{
		this.DynamicTexture = null;
		// Arrow function kullanarak 'this' context'ini koru
		BABYLON.SceneLoader.ImportMesh("", "../models/arcade/", "arcade.obj", scene, // ✅ this.scene
			(meshes) => // ✅ arrow function
			{
				let screenMesh = meshes.find(m => m.name.toLowerCase().includes("screen"));
				this.#setupArcadeScreen(screenMesh, this.scene); // ✅ this.scene
			},
			function (progress)
			{
				console.log("📥 Model loading: ", Math.round(progress.loaded / progress.total * 100) + "%");
			},
			function (error)
			{
				console.error("❌ Model loading error:", error);
			}
		);
	}

	#setupArcadeScreen(screenMesh, scene)
	{
		const textureSize = 512; // Daha küçük boyut dene
		this.dynamicTexture = new BABYLON.DynamicTexture("screenTexture",
			{width: textureSize, height: textureSize}, scene, false);

		this.dynamicTexture.hasAlpha = false;
		this.dynamicTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
		this.dynamicTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;

		this.dynamicTexture.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);

		const screenMaterial = new BABYLON.StandardMaterial("screenMaterial", scene);

		screenMaterial.diffuseTexture = this.dynamicTexture;
		screenMaterial.emissiveTexture = this.dynamicTexture;
		screenMaterial.emissiveColor = new BABYLON.Color3(0.8, 0.8, 0.8);
		screenMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
		screenMaterial.ambientColor = new BABYLON.Color3(0.2, 0.2, 0.2);

		screenMaterial.backFaceCulling = false;

		screenMesh.material = screenMaterial;
		screenMesh.isVisible = true;
		screenMesh.visibility = 1;

		this.#fixUVMapping(screenMesh);

		// Canvas context'i al
		const ctx = this.dynamicTexture.getContext();

		// Global referansları sakla
		window.arcadeScreen = {
			texture: this.dynamicTexture,
			context: ctx,
			mesh: screenMesh,
			material: screenMaterial
		};

		// Debug bilgileri
		this.#createEnhancedDebugInfo(this.dynamicTexture, screenMesh);

	}

	getDynamicTexture()
	{
		return this.dynamicTexture;
	}


	// Geliştirilmiş UV mapping düzeltmesi
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

	// Geliştirilmiş debug sistemi
	#createEnhancedDebugInfo(dynamicTexture, screenMesh)
	{
		// Eski debug div'i kaldır
		const oldDebug = document.getElementById('debug-texture');
		if (oldDebug) oldDebug.remove();

		// Yeni debug container
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
			max-width: 300px;
		`;

		// Başlık
		const title = document.createElement('div');
		title.textContent = 'Arcade Screen Debug';
		title.style.cssText = 'font-weight: bold; margin-bottom: 10px; color: #00ff88;';
		debugDiv.appendChild(title);

		// Mesh bilgileri
		const meshInfo = document.createElement('div');
		meshInfo.innerHTML = `
			<strong>Mesh:</strong> ${screenMesh.name}<br>
			<strong>Vertices:</strong> ${screenMesh.getTotalVertices()}<br>
			<strong>Material:</strong> ${screenMesh.material ? screenMesh.material.name : 'None'}<br>
			<strong>Texture Size:</strong> ${dynamicTexture.getSize().width}x${dynamicTexture.getSize().height}
		`;
		meshInfo.style.marginBottom = '10px';
		debugDiv.appendChild(meshInfo);

		// Texture preview
		const canvas = document.createElement('canvas');
		canvas.width = 150;
		canvas.height = 150;
		canvas.style.border = '1px solid #00ff88';
		canvas.style.display = 'block';

		const ctx = canvas.getContext('2d');

		function updatePreview() {
			const sourceCanvas = dynamicTexture.getContext().canvas;
			ctx.clearRect(0, 0, 150, 150);
			ctx.drawImage(sourceCanvas, 0, 0, 150, 150);
		}

		updatePreview();
		debugDiv.appendChild(canvas);

		// Test butonları
		const buttonContainer = document.createElement('div');
		buttonContainer.style.marginTop = '10px';

		const testButton = document.createElement('button');
		testButton.textContent = 'Test Pattern';
		testButton.style.cssText = 'margin: 2px; padding: 5px; background: #333; color: white; border: 1px solid #666;';
		testButton.onclick = () => {
			updatePreview();
		};

		const refreshButton = document.createElement('button');
		refreshButton.textContent = 'Refresh';
		refreshButton.style.cssText = 'margin: 2px; padding: 5px; background: #333; color: white; border: 1px solid #666;';
		refreshButton.onclick =
		() =>
		{
			updatePreview();
		};

		buttonContainer.appendChild(testButton);
		buttonContainer.appendChild(refreshButton);
		debugDiv.appendChild(buttonContainer);

		document.body.appendChild(debugDiv);

		// Global güncelleme fonksiyonu
		window.updateDebugCanvas = updatePreview;
	}

}

// Export the ArcadeMachine class
export default ArcadeMachine;
