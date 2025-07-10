import ArcadeMachine from './ArcadeMachine.js';

class Player
{
	constructor(scene, position)
	{
		this.scene = scene;
		this.position = position;
		this.arcadeMachine = new ArcadeMachine(scene);
		
	}

	getDynamicTexture()
	{
		return this.arcadeMachine.getDynamicTexture();
	}
}
