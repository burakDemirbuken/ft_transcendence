import Scene from './Scene.js';
import Socket from './Socket.js';
import Engine from './Engine.js';

const engine = new Engine(document.getElementById("renderCanvas"));
const scene = new Scene(engine);
let socket = new Socket("ws://localhost:3000/ws");

engine.runRenderLoop(
	() =>
	{
		if (scene && scene.scene)
			scene.scene.render();
	});

window.addEventListener("resize",
	function ()
	{
		engine.resize();
	});

scene.on("pressedKeys", (pressedKeys) =>
{

});

function startAnimationWhenReady() {
	if (window.arcadeScreen && window.arcadeScreen.texture) {
		engine.startTextureAnimation(
			(time) =>
			{
				drawMenu(window.arcadeScreen.texture);
			});
	} else {
		setTimeout(startAnimationWhenReady, 100);
	}
}

startAnimationWhenReady();

function drawBtutton(x, y, width, height, text, dynamicTexture, isSelected)
{
	const ctx = dynamicTexture.getContext();

	ctx.lineWidth = 3;
	if (isSelected)
	{
		ctx.fillStyle = "white";
		ctx.strokeStyle = "black";
		ctx.font = "20px black";
	}
	else
	{
		ctx.fillStyle = "black";
		ctx.strokeStyle = "white";
		ctx.font = "20px white";
	}

	ctx.fillRect(x, y, width, height);
	ctx.strokeRect(x, y, width, height);
	ctx.textBaseline = "middle";
	ctx.fillStyle = (isSelected ? "black" : "white");
	ctx.fillText(text, x + 10 + (ctx.measureText(text).width / 2), y + height / 2);

}

function drawMenu(dynamicTexture)
{
	const ctx = dynamicTexture.getContext();

	ctx.fillStyle = "black";
	ctx.strokeStyle = "white";

	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	drawBtutton(50, 50, 200, 50, "Start Game", dynamicTexture, true);
	drawBtutton(50, 120, 200, 50, "Settings", dynamicTexture, false);
	drawBtutton(50, 190, 200, 50, "Exit", dynamicTexture, false);


	dynamicTexture.update();
}


