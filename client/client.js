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

	const camera = new BABYLON.UniversalCamera("camera",
		new BABYLON.Vector3(0, 4.5, 3.5), // Kameranın pozisyonu (x, y, z)
		scene);

		// kameranın bakış açısını ayarla
	camera.setTarget(new BABYLON.Vector3(0, 3.75, 0)); // Modelin merkezine odaklan

	camera.attachControl(canvas, true);

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


// Pencere boyutu değiştiğinde canvas'ı yeniden boyutlandır
window.addEventListener("resize", function () {
	engine.resize();
});

// Geliştirilmiş arcade ekran sistemi
function loadArcadeMachine() {
    console.log("Model yükleme başlıyor...");

    BABYLON.SceneLoader.ImportMesh("", "../models/arcade/", "arcade.obj", scene,
        function (meshes) {
            console.log("✅ Arcade makinesi modeli yüklendi!");
            console.log("Yüklenen mesh sayısı:", meshes.length);

            // TÜM mesh'leri listele ve detaylarını göster
            meshes.forEach((mesh, index) => {
                const boundingInfo = mesh.getBoundingInfo();
                const size = boundingInfo.boundingBox.extendSize;
                console.log(`Mesh ${index}: ${mesh.name}`);
                console.log(`  - Material: ${mesh.material ? mesh.material.name : 'Yok'}`);
                console.log(`  - Vertices: ${mesh.getTotalVertices()}`);
                console.log(`  - Size: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`);
                console.log(`  - Position: ${mesh.position.x.toFixed(2)}, ${mesh.position.y.toFixed(2)}, ${mesh.position.z.toFixed(2)}`);
            });

            // Ekran mesh'ini farklı yöntemlerle bul
            let screenMesh = findScreenMesh(meshes);

            if (screenMesh) {
                console.log("🎯 Seçilen ekran mesh:", screenMesh.name);
                setupArcadeScreen(screenMesh, scene);
            } else {
                console.error("❌ Ekran mesh'i bulunamadı!");
                // Alternatif: Tüm mesh'lere materyal uygula (test için)
                applyToAllMeshes(meshes);
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

// Ekran mesh'ini bulmak için gelişmiş algoritma
function findScreenMesh(meshes) {
    // 1. İsme göre arama (çeşitli varyasyonlar)
    const screenKeywords = ['screen', 'ekran', 'monitor', 'display', 'lcd', 'crt'];

    for (let keyword of screenKeywords) {
        let mesh = meshes.find(m => m.name.toLowerCase().includes(keyword));
        if (mesh) {
            console.log(`✅ İsme göre bulundu: ${mesh.name} (keyword: ${keyword})`);
            return mesh;
        }
    }

    // 2. Pozisyona göre arama (ekran genellikle üstte ve merkeze yakın)
    let screenCandidates = meshes.filter(mesh => {
        const pos = mesh.position;
        const bounds = mesh.getBoundingInfo().boundingBox;

        // Ekran özellikleri:
        // - Y pozisyonu yüksek (makinanın üst kısmında)
        // - X pozisyonu merkeze yakın
        // - Belirli bir boyut aralığında
        return pos.y > 2 &&
               Math.abs(pos.x) < 2 &&
               bounds.extendSize.x > 0.5 &&
               bounds.extendSize.y > 0.3;
    });

    if (screenCandidates.length > 0) {
        // En yüksek pozisyondakini seç
        let highestMesh = screenCandidates.reduce((prev, current) =>
            current.position.y > prev.position.y ? current : prev
        );
        console.log(`✅ Pozisyona göre bulundu: ${highestMesh.name}`);
        return highestMesh;
    }

    // 3. Boyuta göre arama (orta büyüklükteki mesh'ler)
    let mediumSizedMeshes = meshes.filter(mesh => {
        const size = mesh.getBoundingInfo().boundingBox.extendSize;
        const volume = size.x * size.y * size.z;
        return volume > 0.5 && volume < 10; // Çok küçük veya çok büyük değil
    });

    if (mediumSizedMeshes.length > 0) {
        console.log(`✅ Boyuta göre bulundu: ${mediumSizedMeshes[0].name}`);
        return mediumSizedMeshes[0];
    }

    // 4. Son çare: En çok vertex'e sahip mesh
    if (meshes.length > 0) {
        let complexMesh = meshes.reduce((prev, current) =>
            current.getTotalVertices() > prev.getTotalVertices() ? current : prev
        );
        console.log(`⚠️ Son çare: ${complexMesh.name}`);
        return complexMesh;
    }

    return null;
}

// Geliştirilmiş arcade ekran kurulumu
function setupArcadeScreen(screenMesh, scene) {
    console.log("🖥️ Arcade ekranı ayarlanıyor...");

    // Mesh detaylarını logla
    logMeshDetails(screenMesh);

    // Yüksek kaliteli dynamic texture oluştur
    const textureSize = 512; // Daha küçük boyut dene
    const dynamicTexture = new BABYLON.DynamicTexture("screenTexture",
        {width: textureSize, height: textureSize}, scene, false);

    // Texture ayarları
    dynamicTexture.hasAlpha = false;
    dynamicTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
    dynamicTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;

    // Filtering ayarları - daha keskin görüntü için
    dynamicTexture.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);

    // Güçlü materyal oluştur
    const screenMaterial = new BABYLON.StandardMaterial("screenMaterial", scene);

    // Materyal ayarları - emissive kullanarak kendinden ışık veren ekran efekti
    screenMaterial.diffuseTexture = dynamicTexture;
    screenMaterial.emissiveTexture = dynamicTexture;
    screenMaterial.emissiveColor = new BABYLON.Color3(0.8, 0.8, 0.8); // Biraz daha yumuşak
    screenMaterial.specularColor = new BABYLON.Color3(0, 0, 0); // Yansımayı tamamen kapat
    screenMaterial.ambientColor = new BABYLON.Color3(0.2, 0.2, 0.2);

    // Backface culling'i kapat (çift taraflı görünüm)
    screenMaterial.backFaceCulling = false;

    // Mesh'e materyal ata
    screenMesh.material = screenMaterial;
    screenMesh.isVisible = true;
    screenMesh.visibility = 1;

    // UV mapping'i kontrol et ve düzelt
    fixUVMapping(screenMesh);

    // Canvas context'i al
    const ctx = dynamicTexture.getContext();

    // Başlangıç ekranı çiz
    drawImprovedStartScreen(ctx, dynamicTexture);

    // Global referansları sakla
    window.arcadeScreen = {
        texture: dynamicTexture,
        context: ctx,
        mesh: screenMesh,
        material: screenMaterial
    };

    // Debug bilgileri
    createEnhancedDebugInfo(dynamicTexture, screenMesh);

    console.log("✅ Arcade ekranı kurulumu tamamlandı!");
}

// Mesh detaylarını logla
function logMeshDetails(mesh) {
    const bounds = mesh.getBoundingInfo().boundingBox;
    const worldMatrix = mesh.getWorldMatrix();

    console.log("📋 Detaylı Mesh Bilgileri:");
    console.log("  Name:", mesh.name);
    console.log("  Vertices:", mesh.getTotalVertices());
    console.log("  Position:", `${mesh.position.x.toFixed(2)}, ${mesh.position.y.toFixed(2)}, ${mesh.position.z.toFixed(2)}`);
    console.log("  Rotation:", `${mesh.rotation.x.toFixed(2)}, ${mesh.rotation.y.toFixed(2)}, ${mesh.rotation.z.toFixed(2)}`);
    console.log("  Scale:", `${mesh.scaling.x.toFixed(2)}, ${mesh.scaling.y.toFixed(2)}, ${mesh.scaling.z.toFixed(2)}`);
    console.log("  Size:", `${bounds.extendSize.x.toFixed(2)} x ${bounds.extendSize.y.toFixed(2)} x ${bounds.extendSize.z.toFixed(2)}`);

    // UV verilerini kontrol et
    const uvs = mesh.getVerticesData(BABYLON.VertexBuffer.UVKind);
    if (uvs) {
        console.log("  UV Points:", uvs.length / 2);
        console.log("  UV Range U:", `${Math.min(...uvs.filter((_, i) => i % 2 === 0)).toFixed(3)} to ${Math.max(...uvs.filter((_, i) => i % 2 === 0)).toFixed(3)}`);
        console.log("  UV Range V:", `${Math.min(...uvs.filter((_, i) => i % 2 === 1)).toFixed(3)} to ${Math.max(...uvs.filter((_, i) => i % 2 === 1)).toFixed(3)}`);
    } else {
        console.warn("  ⚠️ UV verisi yok!");
    }
}

// Geliştirilmiş UV mapping düzeltmesi
function fixUVMapping(mesh) {
    console.log("🔧 UV mapping düzeltiliyor...");

    const uvs = mesh.getVerticesData(BABYLON.VertexBuffer.UVKind);

    if (uvs) {
        console.log(`Original UV count: ${uvs.length / 2}`);
        console.log("Original UV values:", uvs);

        // SORUN: UV'ler texture'ın sadece küçük bir bölümünü kullanıyor
        // ÇÖZÜM: UV'leri tam 0-1 aralığına yay

        if (uvs.length === 8) { // 4 vertex = 8 UV koordinatı (U,V çiftleri)
            // Basit dörtgen için UV mapping - hem X hem Y eksenini flip et
            uvs[0] = 1; uvs[1] = 1; // Sağ üst
            uvs[2] = 0; uvs[3] = 1; // Sol üst
            uvs[4] = 0; uvs[5] = 0; // Sol alt
            uvs[6] = 1; uvs[7] = 0; // Sağ alt

            console.log("✅ Dörtgen için X&Y-flipped UV mapping uygulandı");
        } else {
            // Genel normalize etme
            const minU = Math.min(...uvs.filter((_, i) => i % 2 === 0));
            const maxU = Math.max(...uvs.filter((_, i) => i % 2 === 0));
            const minV = Math.min(...uvs.filter((_, i) => i % 2 === 1));
            const maxV = Math.max(...uvs.filter((_, i) => i % 2 === 1));

            for (let i = 0; i < uvs.length; i += 2) {
                // U koordinatını 0-1 aralığına yay
                uvs[i] = (uvs[i] - minU) / (maxU - minU);
                // V koordinatını 0-1 aralığına yay
                uvs[i + 1] = (uvs[i + 1] - minV) / (maxV - minV);
            }

            console.log("✅ UV mapping 0-1 aralığına yayıldı");
        }

        console.log("New UV values:", uvs);
        mesh.setVerticesData(BABYLON.VertexBuffer.UVKind, uvs);

    } else {
        console.warn("⚠️ UV verisi bulunamadı, yeni UV oluşturuluyor...");
        createPlanarUVMapping(mesh);
    }
}

// Planar UV mapping oluştur
function createPlanarUVMapping(mesh) {
    const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    const bounds = mesh.getBoundingInfo().boundingBox;

    if (!positions) {
        console.error("❌ Position verisi bulunamadı!");
        return;
    }

    const uvs = [];

    // Her vertex için UV koordinatı hesapla
    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        const z = positions[i + 2];

        // X ve Y koordinatlarına göre UV hesapla (Z-projection)
        const u = (x - bounds.minimum.x) / (bounds.maximum.x - bounds.minimum.x);
        const v = (y - bounds.minimum.y) / (bounds.maximum.y - bounds.minimum.y);

        uvs.push(u, v);
    }

    mesh.setVerticesData(BABYLON.VertexBuffer.UVKind, uvs);
    console.log("✅ Yeni planar UV mapping oluşturuldu");
}

// Geliştirilmiş başlangıç ekranı
function drawImprovedStartScreen(ctx, texture) {
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
function createEnhancedDebugInfo(dynamicTexture, screenMesh) {
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
        drawTestPattern(dynamicTexture.getContext(), dynamicTexture);
        updatePreview();
    };

    const refreshButton = document.createElement('button');
    refreshButton.textContent = 'Refresh';
    refreshButton.style.cssText = 'margin: 2px; padding: 5px; background: #333; color: white; border: 1px solid #666;';
    refreshButton.onclick = () => {
        drawImprovedStartScreen(dynamicTexture.getContext(), dynamicTexture);
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
function drawTestPattern(ctx, texture) {
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

// Alternatif: Tüm mesh'lere materyal uygula (debug için)
function applyToAllMeshes(meshes) {
    console.log("🔧 Tüm mesh'lere test materyali uygulanıyor...");

    meshes.forEach((mesh, index) => {
        if (mesh.getTotalVertices() > 0) {
            const testTexture = new BABYLON.DynamicTexture(`testTexture${index}`,
                {width: 256, height: 256}, scene);

            const testMaterial = new BABYLON.StandardMaterial(`testMaterial${index}`, scene);
            testMaterial.diffuseTexture = testTexture;
            testMaterial.emissiveTexture = testTexture;
            testMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5);

            const ctx = testTexture.getContext();
            ctx.fillStyle = `hsl(${index * 360 / meshes.length}, 70%, 50%)`;
            ctx.fillRect(0, 0, 256, 256);
            ctx.fillStyle = 'white';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Mesh ${index}`, 128, 128);
            ctx.fillText(mesh.name, 128, 150);
            testTexture.update();

            mesh.material = testMaterial;
            console.log(`✅ Mesh ${index} (${mesh.name}) renklendirildi`);
        }
    });
}
