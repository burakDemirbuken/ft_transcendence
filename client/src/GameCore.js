class GameCore
{
	constructor(parameters)
	{
		this.engine = null;
		this.scene = null;
		this.camera = null;
		this.arcadeMachines = new Map();
		this.isInitialized = false;
		this.viewMode = 'single'; // 'single', 'multiple', 'tournament'
	}

	async initialize(canvas)
	{
		this.engine = new BABYLON.Engine(canvas, true);
		this.scene = new BABYLON.Scene(this.engine);

		const camera = new BABYLON.UniversalCamera("camera",
			new BABYLON.Vector3(0, 4.5, 2.5), this.scene);

		camera.setTarget(new BABYLON.Vector3(0, 3.75, 0));

		const canvas = engine.getRenderingCanvas();
		camera.attachControl(canvas, true);
		camera.angularSensibility = 5000;
		camera.speed = 0;
		camera.lowerRadiusLimit = camera.radius;
		camera.upperRadiusLimit = camera.radius;

		const light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), this.scene);
		light1.intensity = 0.7;

		const light2 = new BABYLON.DirectionalLight("light2", new BABYLON.Vector3(-1, -1, -1), this.scene);
		light2.intensity = 0.5;

		this.isInitialized = true;

		this.engine.runRenderLoop(
			() =>
			{
				this.scene.render();
			});

		window.addEventListener("resize",
			() =>
			{
				this.engine.resize();
			});
	}


/* // ...existing code...
positionCameraInFrontOfMachine(machineId, distance = 5, height = 2) {
    const machine = this.getMachine(machineId);
    if (!machine || !machine.body) {
        console.warn(`Machine with id ${machineId} not found`);
        return;
    }

    // Makinenin pozisyonu ve rotasyonu
    const machinePosition = machine.body.position;
    const machineRotation = machine.body.rotation;

    // Makinenin önündeki pozisyonu hesapla
    const frontDirection = new BABYLON.Vector3(
        Math.sin(machineRotation.y),
        0,
        Math.cos(machineRotation.y)
    );

    // Kamera pozisyonunu hesapla
    const cameraPosition = machinePosition.add(frontDirection.scale(distance));
    cameraPosition.y = machinePosition.y + height;

    // Kamerayı konumlandır
    this.camera.position = cameraPosition;

    // Kamerayı makineye baktır
    this.camera.lookAt(machinePosition.add(new BABYLON.Vector3(0, 1, 0)));
}

// Kamerayı makineye yumuşak bir şekilde hareket ettir
smoothMoveToMachine(machineId, distance = 5, height = 2, speed = 0.05) {
    const machine = this.getMachine(machineId);
    if (!machine || !machine.body) {
        console.warn(`Machine with id ${machineId} not found`);
        return;
    }

    const machinePosition = machine.body.position;
    const machineRotation = machine.body.rotation;

    // Hedef pozisyonu hesapla
    const frontDirection = new BABYLON.Vector3(
        Math.sin(machineRotation.y),
        0,
        Math.cos(machineRotation.y)
    );

    const targetPosition = machinePosition.add(frontDirection.scale(distance));
    targetPosition.y = machinePosition.y + height;

    // Yumuşak hareket için animation
    this.animateCameraToPosition(targetPosition, machinePosition, speed);
}

// Kamera animasyonu
animateCameraToPosition(targetPosition, lookAtPosition, speed = 0.05) {
    const animate = () => {
        // Pozisyon interpolasyonu
        this.camera.position = BABYLON.Vector3.Lerp(
            this.camera.position,
            targetPosition,
            speed
        );

        // Bakış yönü interpolasyonu
        const currentTarget = this.camera.getTarget();
        const newTarget = BABYLON.Vector3.Lerp(
            currentTarget,
            lookAtPosition.add(new BABYLON.Vector3(0, 1, 0)),
            speed
        );
        this.camera.setTarget(newTarget);

        // Hedefe yaklaştıysak animasyonu durdur
        const distance = BABYLON.Vector3.Distance(this.camera.position, targetPosition);
        if (distance > 0.1) {
            requestAnimationFrame(animate);
        }
    };
    animate();
}

// Kamerayı makineye sabitle ve önünde konumlandır
attachCameraToMachineFront(machineId, distance = 5, height = 2) {
    const machine = this.getMachine(machineId);
    if (!machine || !machine.body) {
        console.warn(`Machine with id ${machineId} not found`);
        return;
    }

    // Kamerayı makineye parent olarak bağla
    this.camera.parent = machine.body;

    // Kamerayı makinenin önünde konumlandır
    this.camera.position = new BABYLON.Vector3(0, height, distance);
    this.camera.rotation = new BABYLON.Vector3(0, Math.PI, 0);
}
// ...existing code... */

	async setViewMode(mode, machineCount = 1)
	{
		this.viewMode = mode;

		this.clearMachines();

		switch (mode)
		{
			case 'single':
				await this.setupSingleMachine();
				break;
			case 'multiple':
				await this.setupMultipleMachines(machineCount);
				break;
			case 'tournament':
				await this.setupTournamentMachines(machineCount);
				break;
		}

		this.adjustCameraForMode();
	}

}

class GameCore
{



	async setupSingleMachine()
	{
		const machine = new ArcadeMachine('main', this.scene, { x: 0, y: 0, z: 0 });
		await machine.load();
		machine.setActive(true);
		this.arcadeMachines.set('main', machine);
	}

	async setupMultipleMachines(count)
	{
		const spacing = 8; // Makineler arası mesafe
		const startX = -(count - 1) * spacing / 2;

		for (let i = 0; i < count; i++)
		{
			const machine = new ArcadeMachine(`machine_${i}`, this.scene, {
				x: startX + i * spacing,
				y: 0,
				z: 0
			});
			await machine.load();
			machine.setActive(i === 0); // İlk makine aktif
			this.arcadeMachines.set(`machine_${i}`, machine);
		}
	}

	async setupTournamentMachines(count)
	{
		// Turnuva için dairesel yerleşim
		const radius = 15;
		const angleStep = (Math.PI * 2) / count;

		for (let i = 0; i < count; i++)
		{
			const angle = i * angleStep;
			const x = Math.cos(angle) * radius;
			const z = Math.sin(angle) * radius;

			const machine = new ArcadeMachine(`tournament_${i}`, this.scene, { x, y: 0, z });
			await machine.load();

			// Merkeze doğru bak
			machine.mesh.rotation.y = angle + Math.PI;

			machine.setActive(false); // Başlangıçta hepsi pasif
			this.arcadeMachines.set(`tournament_${i}`, machine);
		}
	}

	adjustCameraForMode()
	{
		switch (this.viewMode)
		{
			case 'single':
				this.camera.position = new BABYLON.Vector3(0, 5, -10);
				this.camera.setTarget(BABYLON.Vector3.Zero());
				break;
			case 'multiple':
				const machineCount = this.arcadeMachines.size;
				this.camera.position = new BABYLON.Vector3(0, 8, -15 - machineCount * 2);
				this.camera.setTarget(BABYLON.Vector3.Zero());
				break;
			case 'tournament':
				this.camera.position = new BABYLON.Vector3(0, 25, -5);
				this.camera.setTarget(BABYLON.Vector3.Zero());
				break;
		}
	}

	getMachine(id)
	{
		return this.arcadeMachines.get(id);
	}

	setActiveMachine(id)
	{
		this.arcadeMachines.forEach((machine, machineId) =>
		{
			machine.setActive(machineId === id);
		});
	}

	clearMachines()
	{
		this.arcadeMachines.forEach(machine => {
			machine.dispose();
		});
		this.arcadeMachines.clear();
	}

	dispose()
	{
		this.clearMachines();
		this.engine.dispose();
	}

}
