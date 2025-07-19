import ArcadeMachine from './ArcadeMachine.js';

class GameCore
{
	constructor(parameters = {})
	{
		this.parameters = parameters;
		this.engine = null;
		this.scene = null;
		this.camera = null;
		this.arcadeMachines = new Map();
		this.isInitialized = false;
		this.viewMode = 'single';
		this.gameConfig = null;
	}

	async initialize(canvas, gameConfig)
	{
		this.engine = new BABYLON.Engine(canvas, true);
		this.scene = new BABYLON.Scene(this.engine);

		this.camera = new BABYLON.UniversalCamera("camera",
			new BABYLON.Vector3(0, 4.5, 2.5), this.scene);

		this.camera.attachControl(canvas, true);
		this.camera.angularSensibility = 5000;
		this.camera.speed = 0;
		this.camera.lowerRadiusLimit = this.camera.radius;
		this.camera.upperRadiusLimit = this.camera.radius;
		this.gameConfig = gameConfig;

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
			case 'multiple':
				await this.setupSingleMachine();
				break;
			case 'tournament':
				await this.setupTournamentMachines(machineCount);
				break;
			default:
				throw new Error(`Unknown view mode: ${mode}`);
		}

		this.setCameraPositionForMode(this.arcadeMachines.get('main'));
	}

	setCameraPositionForMode(mainMachine)
	{
		if (!this.camera || !mainMachine)
			return;

		if (!mainMachine.meshs || !Array.isArray(mainMachine.meshs))
		{
			console.warn("mainMachine.meshs is not available or not an array");
			return;
		}

		const screen = mainMachine.meshs.find(m => m.name === "screen");
		if (screen)
		{
			this.camera.setTarget(new BABYLON.Vector3(screen.position.x, screen.position.y + 3.75, screen.position.z));
			this.camera.position = new BABYLON.Vector3(mainMachine.position.x, mainMachine.position.y + 4.5, mainMachine.position.z + 2.5);
		}
	}

	async setupSingleMachine()
	{
		const machine = new ArcadeMachine('main', this.scene, { x: 1, y: 1, z: 1 });
		await machine.load(this.gameConfig.machine);
		machine.setActive(true);
		this.arcadeMachines.set('main', machine);
	}

	async setupTournamentMachines(count)
	{
		const radius = 15;
		const angleStep = (Math.PI * 2) / count;

		for (let i = 0; i < count; i++)
		{
			const angle = i * angleStep;
			const x = Math.cos(angle) * radius;
			const z = Math.sin(angle) * radius;

			const machine = new ArcadeMachine(`tournament_${i}`, this.scene, { x, y: 0, z });
			await machine.load();

			machine.mesh.rotation.y = angle + Math.PI;

			machine.setActive(false);
			this.arcadeMachines.set(`tournament_${i}`, machine);
		}
	}

	getMachines()
	{
		return this.arcadeMachines;
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
		this.camera.dispose();
		this.scene.dispose();
		this.isInitialized = false;
	}
}

export default GameCore;
