import Scene from './Scene.js';
import Socket from './Socket.js';
import Engine from './Engine.js';

const engine = new Engine(document.getElementById("renderCanvas"));
const scene = new Scene(engine);
let socket = new Socket("ws://localhost:3000/ws");

const buttons = [
	{"startGame": false},
	{"settings": false},
 	{"exit": false}
];


let buttonWidth = 200;
let buttonHeight = 50;

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

function drawBtutton(dynamicTexture, x, y, width, height, text, isSelected)
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
	ctx.fillText(text, x + (width / 2) - (ctx.measureText(text).width / 2), y + height / 2);

}

function drawButtons(dynamicTexture, Buttons, buttonWidth, buttonHeight)
{
	const ctx = dynamicTexture.getContext();
	let margin = buttonHeight + 10;

	let y = (ctx.canvas.height / 2) - ((Buttons.length * margin) / 2);

	Buttons.forEach((buttonObj) => {
		const x = (ctx.canvas.width / 2) - (buttonWidth / 2);
		const [text, isSelected] = Object.entries(buttonObj)[0];
		drawBtutton(dynamicTexture, x, y, buttonWidth, buttonHeight, text, isSelected);
		y += margin;
	});
}

function drawMenu(dynamicTexture)
{
	const ctx = dynamicTexture.getContext();

	ctx.fillStyle = "black";
	ctx.strokeStyle = "white";

	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	drawButtons(dynamicTexture, buttons, buttonWidth, buttonHeight);

	dynamicTexture.update();
}
