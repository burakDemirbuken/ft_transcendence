class UIScreen
{
	constructor(ctx, name)
	{
		this.name = name;
		this.isActive = false;
	}

	onEnter()
	{
		this.isActive = true;
	}

	onExit()
	{
		this.isActive = false;
	}

	update()
	{
	}

	render()
	{
	}

	keyHandle(pressedKeys)
	{
	}

}

export default UIScreen;
