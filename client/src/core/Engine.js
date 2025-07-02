class Engine
{
    constructor(canvas)
	{
        this.engine = new BABYLON.Engine(canvas, true);
        this.setupEventListeners();
    }

    startRenderLoop(scene)
	{
        this.engine.runRenderLoop(() => scene.render());
    }

    resize()
	{
        this.engine.resize();
    }
}
