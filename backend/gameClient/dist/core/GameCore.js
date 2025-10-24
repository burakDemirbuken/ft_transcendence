/// <reference types="babylonjs" />
class GameCore {
    constructor(parameters = {}) {
        this.parameters = parameters;
        this.engine = null;
        this.scene = null;
        this.camera = null;
        this.gameConfig = null;
    }
    async initialize(canvas, gameConfig) {
        // Check if BABYLON is available
        if (typeof BABYLON === 'undefined') {
            throw new Error('BABYLON.js is not loaded. Please ensure the library is included.');
        }
        this.engine = new BABYLON.Engine(canvas, true);
        this.scene = new BABYLON.Scene(this.engine);
        this.camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(0, 4.5, 2.5), this.scene);
        this.camera.attachControl(canvas, true);
        this.camera.angularSensibility = 5000;
        this.camera.speed = 0;
        // Note: lowerRadiusLimit and upperRadiusLimit are for ArcRotateCamera, not UniversalCamera
        // Commenting out for now as they don't apply to UniversalCamera
        // this.camera.lowerRadiusLimit = this.camera.radius;
        // this.camera.upperRadiusLimit = this.camera.radius;
        this.gameConfig = gameConfig;
        this.engine.runRenderLoop(() => {
            if (this.scene) {
                this.scene.render();
            }
        });
        window.addEventListener("resize", () => {
            if (this.engine) {
                this.engine.resize();
            }
        });
    }
    setCameraPosition(newPosition, targetPosition) {
        if (this.camera) {
            this.camera.position = new BABYLON.Vector3(newPosition.x, newPosition.y, newPosition.z);
            this.camera.setTarget(new BABYLON.Vector3(targetPosition.x, targetPosition.y, targetPosition.z));
        }
    }
    dispose() {
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
    getScene() {
        return this.scene;
    }
    getEngine() {
        return this.engine;
    }
    getCamera() {
        return this.camera;
    }
}
export default GameCore;
//# sourceMappingURL=GameCore.js.map