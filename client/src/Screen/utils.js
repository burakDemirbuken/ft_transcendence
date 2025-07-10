
export function drawButton(ctx, x, y, width, height, text, isSelected)
{
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

export function drawButtons(ctx, Buttons, buttonWidth, buttonHeight)
{
	let margin = buttonHeight + 10;

	let y = (ctx.canvas.height / 2) - ((Buttons.length * margin) / 2);

	Buttons.forEach(
		(buttonObj) =>
		{
			const x = (ctx.canvas.width / 2) - (buttonWidth / 2);
			const [text, isSelected] = Object.entries(buttonObj)[0];
			drawButton(ctx, x, y, buttonWidth, buttonHeight, text, isSelected);
			y += margin;
		});
}
