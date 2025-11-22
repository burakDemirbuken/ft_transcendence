// Using global BABYLON from CDN (loaded via script tag in index.html)
declare const BABYLON: any;

interface Position {
	x: number;
	y: number;
	z: number;
}

interface GameCoreParameters {
	[key: string]: any;
}

class GameCore
{
	private parameters: GameCoreParameters;
	private engine: BABYLON.Engine | null;
	public scene: BABYLON.Scene | null;
	private camera: BABYLON.UniversalCamera | null;
	private gameConfig: any;

	constructor(parameters: GameCoreParameters = {})
	{
		this.parameters = parameters;
		this.engine = null;
		this.scene = null;
		this.camera = null;
		this.gameConfig = null;
	}

	async initialize(canvas: HTMLCanvasElement, gameConfig?: any): Promise<void>
	{
		if (typeof BABYLON === 'undefined') {
			throw new Error('BABYLON.js is not loaded. Please ensure the library is included.');
		}

		const gl = canvas.getContext("webgl2", { stencil: true }) || canvas.getContext("webgl", { stencil: true });

		if (!gl) {
			throw new Error("Unable to initialize WebGL. Your browser may not support it.");
		}

		gl.getExtension("EXT_color_buffer_float");
		gl.getExtension("WEBGL_color_buffer_float");
		gl.getExtension("EXT_color_buffer_half_float");
		gl.getExtension("EXT_float_blend");

		this.engine = new BABYLON.Engine(gl, true);
		this.scene = new BABYLON.Scene(this.engine);

		this.scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

		this.camera = new BABYLON.UniversalCamera("camera",
			new BABYLON.Vector3(0, 4.5, 2.5), this.scene);

		this.camera.attachControl(canvas, true);
		this.camera.angularSensibility = 5000;
		this.camera.speed = 0;
		this.gameConfig = gameConfig;

		this.engine.runRenderLoop(
			() =>
			{
				if (this.scene) {
					this.scene.render();
				}
			}
		);

		window.addEventListener("resize",
			() =>
			{
				if (this.engine) {
					this.engine.resize();
				}
			}
		);
	}

	setCameraPosition(newPosition: Position, targetPosition: Position): void
	{
		if (this.camera) {
			this.camera.position = new BABYLON.Vector3(newPosition.x, newPosition.y, newPosition.z);
			this.camera.setTarget(new BABYLON.Vector3(targetPosition.x, targetPosition.y, targetPosition.z));
		}
	}

	dispose(): void
	{
		if (this.scene) {
			this.scene.dispose();
			this.scene = null;
		}

		if (this.engine) {
			// Stop render loop
			this.engine.stopRenderLoop();
			// Dispose engine
			this.engine.dispose();
			this.engine = null;
		}

		this.camera = null;
	}

	// Getters for external access
	getScene(): BABYLON.Scene | null {
		return this.scene;
	}

	getEngine(): BABYLON.Engine | null {
		return this.engine;
	}

	getCamera(): BABYLON.UniversalCamera | null {
		return this.camera;
	}
}

export default GameCore;
