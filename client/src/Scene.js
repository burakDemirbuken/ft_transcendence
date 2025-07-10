import arcadeMachine from "./ArcadeMachine.js";
import EventEmitter from "./EventEmitter.js";

const Keys = {
	LEFT: "ArrowLeft",
	RIGHT: "ArrowRight",
	UP: "ArrowUp",
	DOWN: "ArrowDown",
	SPACE: "Space",
	ENTER: "Enter",
	ESCAPE: "Escape",
	W: "KeyW",
	A: "KeyA",
	D: "KeyD",
	S: "KeyS",
}

class Scene extends EventEmitter
{
	constructor(engine)
	{
		super();
		this.dynamicTextures = new Map();
		this.scene = new BABYLON.Scene(engine);
		this.pressedKeys = new Set();

		const camera = new BABYLON.UniversalCamera("camera",
			new BABYLON.Vector3(0, 4.5, 2.5), this.scene);

		camera.setTarget(new BABYLON.Vector3(0, 3.75, 0));

		// Canvas referansını engine'dan al
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

		this.#keyObservable();


		this.arcadeMachines.add("Player1", new arcadeMachine(this.scene));

	}

	#keyObservable()
	{
		this.scene.onKeyboardObservable.add(
			(kbInfo) =>
			{
				const keyCode = kbInfo.event.code;
				const key = kbInfo.event.key;
				switch (kbInfo.type)
				{
					case BABYLON.KeyboardEventTypes.KEYDOWN:
						if (!this.pressedKeys.has(keyCode))
							this.pressedKeys.add(keyCode);
						break;

					case BABYLON.KeyboardEventTypes.KEYUP:
						this.pressedKeys.delete(keyCode);
						break;
				}
				this.emit("pressedKeys", this.pressedKeys);
			});
	}

	getDynamicTextures(name)
	{
		return this.dynamicTextures.get(name);
	}

}

// Export the Scene class
export default Scene;
