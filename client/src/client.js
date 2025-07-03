import Scene from './Scene.js';
// import Socket from './Socket.js'; // Socket'i de import etmeniz gerekiyor

const engine = new BABYLON.Engine(document.getElementById("renderCanvas"), true, {
    preserveDrawingBuffer: true,
    stencil: true
});
const scene = new Scene(engine);
// let socket = Socket("ws://localhost:3000/ws"); // Socket import edilene kadar kapat

engine.runRenderLoop(
    () =>
    {
        if (scene && scene.scene) // ✅ scene.scene (Scene class'ının scene property'si)
        {
            scene.scene.render();
        }
    });

window.addEventListener("resize", function () {
	engine.resize();
});

