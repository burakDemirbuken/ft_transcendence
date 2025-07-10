import UIScreen from './UIScreen.js';
import { drawButtons } from './utils.js';

class MenuScreen extends UIScreen
{
	constructor(ctx)
	{
		super(ctx ,"Menu");
		this.ctx = ctx;
		this.buttons = [
			{ "Start Game": false },
			{ "Settings": false },
 			{ "Exit": false }
		];

	}

	onEnter()
	{
		this.updateButtonSelection();
	}

	#drawMenu()
	{

		ctx.fillStyle = "black";
		ctx.strokeStyle = "white";

		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		drawButtons(this.ctx, buttons, buttonWidth, buttonHeight);

	}

	render()
	{
		if (window.arcadeScreen && window.arcadeScreen.texture)
			this.#drawMenu();
	}
}

export default MenuScreen;
