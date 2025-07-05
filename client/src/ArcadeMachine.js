class ArcadeMachine
{
	constructor(scene)
	{
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
		console.log("🖥️ Arcade ekranı ayarlanıyor...");

		const textureSize = 512; // Daha küçük boyut dene
		const dynamicTexture = new BABYLON.DynamicTexture("screenTexture",
			{width: textureSize, height: textureSize}, scene, false);

		dynamicTexture.hasAlpha = false;
		dynamicTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
		dynamicTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;

		dynamicTexture.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);

		const screenMaterial = new BABYLON.StandardMaterial("screenMaterial", scene);

		screenMaterial.diffuseTexture = dynamicTexture;
		screenMaterial.emissiveTexture = dynamicTexture;
		screenMaterial.emissiveColor = new BABYLON.Color3(0.8, 0.8, 0.8);
		screenMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
		screenMaterial.ambientColor = new BABYLON.Color3(0.2, 0.2, 0.2);

		screenMaterial.backFaceCulling = false;

		screenMesh.material = screenMaterial;
		screenMesh.isVisible = true;
		screenMesh.visibility = 1;

		this.#fixUVMapping(screenMesh);

		// Canvas context'i al
		const ctx = dynamicTexture.getContext();

		// Başlangıç ekranı çiz
		this.#drawImprovedStartScreen(ctx, dynamicTexture);

		// Global referansları sakla
		window.arcadeScreen = {
			texture: dynamicTexture,
			context: ctx,
			mesh: screenMesh,
			material: screenMaterial
		};

		// Debug bilgileri
		this.#createEnhancedDebugInfo(dynamicTexture, screenMesh);

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

	// Geliştirilmiş başlangıç ekranı
	#drawImprovedStartScreen(ctx, texture)
	{
		const size = texture.getSize();
		const width = size.width;
		const height = size.height;

		console.log(`🎨 Geliştirilmiş ekran çiziliyor: ${width}x${height}`);

		// Canvas'ı temizle
		ctx.clearRect(0, 0, width, height);

		// Arka plan gradyanı
		const gradient = ctx.createLinearGradient(0, 0, 0, height);
		gradient.addColorStop(0, '#0f3460');
		gradient.addColorStop(1, '#16213e');
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, width, height);

		// Çerçeve
		ctx.strokeStyle = '#00ff88';
		ctx.lineWidth = 4;
		ctx.strokeRect(20, 20, width-40, height-40);

		// Ana başlık
		ctx.fillStyle = '#00ff88';
		ctx.font = `bold ${Math.floor(height/10)}px 'Courier New', monospace`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('PONG', width/2, height/3);

		// Alt başlık
		ctx.fillStyle = '#ffffff';
		ctx.font = `${Math.floor(height/16)}px 'Courier New', monospace`;
		ctx.fillText('ARCADE', width/2, height/3 + height/12);

		// Talimat
		ctx.fillStyle = '#ffff00';
		ctx.font = `${Math.floor(height/20)}px Arial`;
		ctx.fillText('Press SPACE to Start', width/2, height*2.2/3);

		// Animasyonlu noktalar
		const time = Date.now() * 0.001;
		for (let i = 0; i < 3; i++) {
			const alpha = Math.sin(time * 2 + i * 0.5) * 0.5 + 0.5;
			ctx.globalAlpha = alpha;
			ctx.fillStyle = '#00ffff';
			ctx.beginPath();
			ctx.arc(width/2 + (i-1) * 20, height*3/4, 5, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.globalAlpha = 1;

		// Test köşeleri - debug için
		ctx.fillStyle = '#ff0000';
		ctx.fillRect(0, 0, 20, 20); // Sol üst
		ctx.fillStyle = '#00ff00';
		ctx.fillRect(width-20, 0, 20, 20); // Sağ üst
		ctx.fillStyle = '#0000ff';
		ctx.fillRect(0, height-20, 20, 20); // Sol alt
		ctx.fillStyle = '#ffff00';
		ctx.fillRect(width-20, height-20, 20, 20); // Sağ alt

		// Texture'ı güncelle
		texture.update();
		console.log('🎨 Geliştirilmiş texture çizildi');
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
			this.#drawTestPattern(dynamicTexture.getContext(), dynamicTexture);
			updatePreview();
		};

		const refreshButton = document.createElement('button');
		refreshButton.textContent = 'Refresh';
		refreshButton.style.cssText = 'margin: 2px; padding: 5px; background: #333; color: white; border: 1px solid #666;';
		refreshButton.onclick =
		() =>
		{
			this.#drawImprovedStartScreen(dynamicTexture.getContext(), dynamicTexture);
			updatePreview();
		};

		buttonContainer.appendChild(testButton);
		buttonContainer.appendChild(refreshButton);
		debugDiv.appendChild(buttonContainer);

		document.body.appendChild(debugDiv);

		// Global güncelleme fonksiyonu
		window.updateDebugCanvas = updatePreview;

		console.log('🔍 Geliştirilmiş debug sistemi aktif!');
	}

	// Test pattern çizme fonksiyonu
	#drawTestPattern(ctx, texture) {
		const size = texture.getSize();
		const width = size.width;
		const height = size.height;

		// Şachmat pattern
		ctx.clearRect(0, 0, width, height);

		const squareSize = 32;
		for (let x = 0; x < width; x += squareSize) {
			for (let y = 0; y < height; y += squareSize) {
				const isEven = ((x / squareSize) + (y / squareSize)) % 2 === 0;
				ctx.fillStyle = isEven ? '#ffffff' : '#000000';
				ctx.fillRect(x, y, squareSize, squareSize);
			}
		}

		// Merkeze kırmızı daire
		ctx.fillStyle = '#ff0000';
		ctx.beginPath();
		ctx.arc(width/2, height/2, 50, 0, Math.PI * 2);
		ctx.fill();

		texture.update();
	}
}

// Export the ArcadeMachine class
export default ArcadeMachine;
