const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);
const scene = createScene();
loadArcadeMachine();
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

	// First Person Kamera - kafa gibi hareket
	const camera = new BABYLON.UniversalCamera("camera",
		new BABYLON.Vector3(0, 2, -10), // Kameranın pozisyonu (x, y, z)
		scene);

	// Kamera kontrollerini etkinleştir
	camera.attachControl(canvas, true);

	// Hareket hızlarını ayarla (çok yavaş yap)
	camera.angularSensibility = 5000;  // Mouse hassasiyeti (yüksek = yavaş)
	camera.speed = 0;                  // Hareket hızı (0 = hareket edemez)

	// Sadece mouse ile bakış açısı değişimi, WASD hareketi yok
	camera.keysUp = [];        // W tuşunu devre dışı bırak
	camera.keysDown = [];      // S tuşunu devre dışı bırak
	camera.keysLeft = [];      // A tuşunu devre dışı bırak
	camera.keysRight = [];     // D tuşunu devre dışı bırak
	camera.lowerRadiusLimit = camera.radius;               // Mevcut mesafeyi koru
	camera.upperRadiusLimit = camera.radius;               // Mevcut mesafeyi koru

	// Işıklandırma - daha iyi görünüm için
	const light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
	light1.intensity = 0.7;

	const light2 = new BABYLON.DirectionalLight("light2", new BABYLON.Vector3(-1, -1, -1), scene);
	light2.intensity = 0.5;

	return scene;
}

engine.runRenderLoop(() => {
	if (scene) {
		scene.render();
	}
});

function loadArcadeMachine()
{
	console.log("Model yükleme başlıyor...");

	BABYLON.SceneLoader.ImportMesh("", "../models/ArcadeMachine/", "Arcade-machine.obj", scene,
		function (meshes)
		{
			console.log("✅ Arcade makinesi modeli yüklendi!");
			console.log("Yüklenen mesh sayısı:", meshes.length);

			// Modeli ayarla ve büyüt
			meshes.forEach((mesh, index) => {
				console.log(`Mesh ${index}:`, mesh.name);
				mesh.position = new BABYLON.Vector3(0, 0, 0);

				// Tekstür ve materyal ekle
				if (!mesh.material) {
					const material = new BABYLON.StandardMaterial(`material_${index}`, scene);

					// Mesh ismine göre farklı renkler/tekstürler
					if (mesh.name.toLowerCase().includes('screen'))
					{
						// Ekran için siyah materyal
						material.diffuseColor = new BABYLON.Color3(0.05, 0.05, 0.05);
						material.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.2);
						mesh.arcadeScreen = true; // Ekran olarak işaretle
					}
					else
					{
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

			setupArcadeScreen(screenMesh, scene);

			// Kamerayı modele odakla
			if (meshes.length > 0)
			{

			}
		},
		function (progress) {
			console.log("📥 Yükleme:", Math.round(progress.loaded / progress.total * 100) + "%");
		},
		function (error) {
			console.error("❌ Model yükleme hatası:", error);
		}
	);
}

// Arcade ekranını ayarlayan fonksiyon
function setupArcadeScreen(screenMesh, scene)
{
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

// Pencere boyutu değiştiğinde canvas'ı yeniden boyutlandır
window.addEventListener("resize", function () {
	engine.resize();
});
