const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);
const scene = createScene();
let socket;

socket = new WebSocket("ws://localhost:3000/ws");

socket.onopen = () => {
	console.log("WebSocket bağlantısı açıldı");
}

socket.onmessage = (event) => {
	console.log("📨 Gelen mesaj:", event.data);
};

socket.onclose = () => {
	console.log("Bağlantı kapandı");
};

socket.onerror = (e) => console.error('WebSocket hata:', e);

function createScene() {
	const scene = new BABYLON.Scene(engine);

	// Kamera - daha iyi açı
	const camera = new BABYLON.ArcRotateCamera("camera",
		-Math.PI / 2, Math.PI / 2.5, 10,
		new BABYLON.Vector3(0, 0, 0),
		scene);

	camera.attachControl(canvas, true);

	// Işıklandırma - daha iyi görünüm için
	const light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
	light1.intensity = 0.7;

	const light2 = new BABYLON.DirectionalLight("light2", new BABYLON.Vector3(-1, -1, -1), scene);
	light2.intensity = 0.5;

	// Test küpü - model yüklenmezse en azından bunu görelim
	const box = BABYLON.MeshBuilder.CreateBox("testBox", {size: 2}, scene);
	box.position.y = 1;

	// Test materyali
	const material = new BABYLON.StandardMaterial("testMaterial", scene);
	material.diffuseColor = new BABYLON.Color3(1, 0.5, 0);
	box.material = material;

	return scene;
}

engine.runRenderLoop(() => {
	if (scene) {
		scene.render();
	}
});

setTimeout(() => {
	console.log("Model yükleme başlıyor...");

	BABYLON.SceneLoader.ImportMesh("", "../models/ArcadeMachine/", "Arcade-machine.obj", scene,
		function (meshes) {
			console.log("✅ Arcade makinesi modeli yüklendi!");
			console.log("Yüklenen mesh sayısı:", meshes.length);

			// Test küpünü kaldır
			const testBox = scene.getMeshByName("testBox");
			if (testBox) {
				testBox.dispose();
			}

			// Modeli ayarla ve büyüt
			meshes.forEach((mesh, index) => {
				console.log(`Mesh ${index}:`, mesh.name);
				mesh.position = new BABYLON.Vector3(0, 0, 0);

				// Modeli büyüt
				mesh.scaling = new BABYLON.Vector3(2, 2, 2);

				// Tekstür ve materyal ekle
				if (!mesh.material) {
					const material = new BABYLON.StandardMaterial(`material_${index}`, scene);

					// Mesh ismine göre farklı renkler/tekstürler
					if (mesh.name.toLowerCase().includes('screen')) {
						// Ekran için siyah materyal
						material.diffuseColor = new BABYLON.Color3(0.05, 0.05, 0.05);
						material.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.2);
						mesh.arcadeScreen = true; // Ekran olarak işaretle
					} else if (mesh.name.toLowerCase().includes('button')) {
						// Butonlar için renkli materyal
						material.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.2);
						material.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
					} else {
						// Genel gövde için
						material.diffuseColor = new BABYLON.Color3(0.6, 0.4, 0.2);
						material.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
					}

					mesh.material = material;
				}
			});

			// Ekran mesh'ini bul ve çizim için hazırla
			const screenMesh = meshes.find(mesh =>
				mesh.name.toLowerCase().includes('screen') || mesh.arcadeScreen
			);

			if (screenMesh) {
				setupArcadeScreen(screenMesh, scene);
			} else {
				// Ekran bulunamazsa elle bir tane oluştur
				createArcadeScreen(scene);
			}

			// Kamerayı modele odakla
			if (meshes.length > 0) {
				const center = new BABYLON.Vector3(0, 1, 0);
				scene.activeCamera.setTarget(center);
				scene.activeCamera.radius = 8;
			}
		},
		function (progress) {
			console.log("📥 Yükleme:", Math.round(progress.loaded / progress.total * 100) + "%");
		},
		function (error) {
			console.error("❌ Model yükleme hatası:", error);
		}
	);
}, 1000); // 1 saniye bekle

// Arcade ekranını ayarlayan fonksiyon
function setupArcadeScreen(screenMesh, scene) {
	console.log("🖥️ Arcade ekranı ayarlanıyor...");

	// Dynamic texture oluştur (çizim için)
	const dynamicTexture = new BABYLON.DynamicTexture("screenTexture",
		{width: 512, height: 384}, scene, false);

	// Materyal oluştur
	const screenMaterial = new BABYLON.StandardMaterial("screenMaterial", scene);
	screenMaterial.diffuseTexture = dynamicTexture;
	screenMaterial.emissiveTexture = dynamicTexture;
	screenMaterial.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.3);

	screenMesh.material = screenMaterial;

	// Canvas context'i al
	const ctx = dynamicTexture.getContext();

	// Başlangıç ekranı çiz
	drawStartScreen(ctx, dynamicTexture);

	// Global referans (diğer fonksiyonlardan erişmek için)
	window.arcadeScreen = {
		texture: dynamicTexture,
		context: ctx,
		mesh: screenMesh
	};
}

// Ekran bulunamazsa yeni bir ekran oluştur
function createArcadeScreen(scene) {
	console.log("🖥️ Yeni arcade ekranı oluşturuluyor...");

	// Ekran mesh'i oluştur
	const screen = BABYLON.MeshBuilder.CreatePlane("arcadeScreen", {
		width: 3,
		height: 2.25
	}, scene);

	screen.position = new BABYLON.Vector3(0, 2, 1.5);
	screen.rotation.x = -Math.PI / 8; // Hafif eğik

	setupArcadeScreen(screen, scene);
}

// Başlangıç ekranını çizen fonksiyon
function drawStartScreen(ctx, texture) {
	// Ekranı temizle
	ctx.fillStyle = '#000015';
	ctx.fillRect(0, 0, 512, 384);

	// Retro grid çiz
	ctx.strokeStyle = '#0066ff';
	ctx.lineWidth = 1;
	for (let i = 0; i < 512; i += 32) {
		ctx.beginPath();
		ctx.moveTo(i, 0);
		ctx.lineTo(i, 384);
		ctx.stroke();
	}
	for (let i = 0; i < 384; i += 32) {
		ctx.beginPath();
		ctx.moveTo(0, i);
		ctx.lineTo(512, i);
		ctx.stroke();
	}

	// Başlık
	ctx.fillStyle = '#00ffff';
	ctx.font = 'bold 32px monospace';
	ctx.textAlign = 'center';
	ctx.fillText('🎮 ARCADE MACHINE', 256, 80);

	// Alt yazı
	ctx.fillStyle = '#ffffff';
	ctx.font = '16px monospace';
	ctx.fillText('Çizim için mouse kullanın', 256, 120);

	// Çizim alanı çerçevesi
	ctx.strokeStyle = '#ffffff';
	ctx.lineWidth = 2;
	ctx.strokeRect(50, 150, 412, 180);

	texture.update();
}

// Mouse ile çizim fonksiyonları
let isDrawing = false;
let lastX = 0;
let lastY = 0;

function startDrawing() {
	if (!window.arcadeScreen) return;

	isDrawing = true;

	// Mouse koordinatlarını ekran koordinatlarına çevir
	canvas.addEventListener('mousemove', draw);
	canvas.addEventListener('mouseup', stopDrawing);
}

function draw(e) {
	if (!isDrawing || !window.arcadeScreen) return;

	const rect = canvas.getBoundingClientRect();
	const x = ((e.clientX - rect.left) / rect.width) * 512;
	const y = ((e.clientY - rect.top) / rect.height) * 384;

	const ctx = window.arcadeScreen.context;

	// Çizim alanı sınırları içinde mi kontrol et
	if (x >= 50 && x <= 462 && y >= 150 && y <= 330) {
		ctx.strokeStyle = '#00ff00';
		ctx.lineWidth = 3;
		ctx.lineCap = 'round';

		if (lastX !== 0 && lastY !== 0) {
			ctx.beginPath();
			ctx.moveTo(lastX, lastY);
			ctx.lineTo(x, y);
			ctx.stroke();
		}

		window.arcadeScreen.texture.update();
	}

	lastX = x;
	lastY = y;
}

function stopDrawing() {
	isDrawing = false;
	lastX = 0;
	lastY = 0;
	canvas.removeEventListener('mousemove', draw);
	canvas.removeEventListener('mouseup', stopDrawing);
}

// Ekranı temizleme fonksiyonu
function clearScreen() {
	if (!window.arcadeScreen) return;

	drawStartScreen(window.arcadeScreen.context, window.arcadeScreen.texture);
}

function drawRandomLine() {
	if (!window.arcadeScreen) return;

	const ctx = window.arcadeScreen.context;
	const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];

	ctx.strokeStyle = colors[Math.floor(Math.random() * colors.length)];
	ctx.lineWidth = Math.random() * 5 + 1;
	ctx.lineCap = 'round';

	const x1 = 50 + Math.random() * 412;
	const y1 = 150 + Math.random() * 180;
	const x2 = 50 + Math.random() * 412;
	const y2 = 150 + Math.random() * 180;

	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();

	window.arcadeScreen.texture.update();
}

// Pencere boyutu değiştiğinde canvas'ı yeniden boyutlandır
window.addEventListener("resize", function () {
	engine.resize();
});
