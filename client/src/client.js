import Scene from './Scene.js';
import Socket from './Socket.js';

const engine = new BABYLON.Engine(document.getElementById("renderCanvas"), true, {
    preserveDrawingBuffer: true,
    stencil: true
});
const scene = new Scene(engine);
let socket = new Socket("ws://localhost:3000/ws");

engine.runRenderLoop(
    () =>
    {
        if (scene && scene.scene)
            scene.scene.render();
    });

window.addEventListener("resize", function () {
	engine.resize();
});

scene.on("keydown", (data) =>
{
    if (data.keyCode === "KeyP")
    {
        console.log("Pause key pressed");
        // Implement pause functionality here
    }
    else if (data.keyCode === "KeyR")
    {
        console.log("Resume key pressed");
        // Implement resume functionality here
    }
});
