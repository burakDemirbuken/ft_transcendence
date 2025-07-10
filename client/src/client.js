import Scene from './Scene.js';
import Socket from './Socket.js';
import Engine from './Engine.js';
import MenuScreen from './Screen/MenuScreen.js';

const engine = new Engine(document.getElementById("renderCanvas"));
const scene = new Scene(engine);
let socket = new Socket("ws://localhost:3000/ws");
const Menu = new MenuScreen();

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

function startAnimationWhenReady()
{
	if (window.arcadeScreen && window.arcadeScreen.texture)
	{
		engine.startTextureAnimation(
			(time) =>
			{
				drawMenu(window.arcadeScreen.texture);
			});
		scene.getDynamicTexture().array.forEach(
			element =>
			{
				element.update();
			});
	}
	else
		setTimeout(startAnimationWhenReady, 100);

}

startAnimationWhenReady();

