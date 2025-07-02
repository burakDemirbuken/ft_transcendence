class Application
{
    constructor()
	{
        this.engine = null;
        this.scene = null;
        this.arcadeMachine = null;
        this.networkManager = null;
    }

    async initialize()
	{
        this.setupEngine();
        await this.loadResources();
        this.setupArcadeMachine();
        this.startApplication();
    }

    // Küçük, anlaşılır metodlar
    setupEngine()
	{
        const canvas = document.getElementById("renderCanvas");
        this.engine = new Engine(canvas);
        this.scene = new Scene(this.engine);
    }

    async loadResources()
	{
        const modelLoader = new ModelLoader();
        const meshes = await modelLoader.load("../models/arcade/arcade.obj");
        this.screenMesh = meshes.find(m => m.name.includes('screen'));
    }

    setupArcadeMachine()
	{
        const screen = new Screen(this.screenMesh, this.scene.babylon);
        const renderer = new PongRenderer();
        const network = new WebSocketClient("ws://localhost:3000/ws");

        this.arcadeMachine = new ArcadeMachine(screen, renderer, network);
    }

    startApplication()
	{
        this.engine.startRenderLoop(this.scene);
        this.arcadeMachine.start();
    }
}
