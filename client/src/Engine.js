
class Engine extends BABYLON.Engine
{
	constructor(canvas)
	{
		super(canvas, true, {preserveDrawingBuffer: true, stencil: true });
		this.animationRunning = false;
		this.animationFrame = null;
	}

	startTextureAnimation(func)
	{
		if (this.animationRunning) return;

		this.animationRunning = true;

		const animateTexture = () =>
		{
			if (!this.animationRunning)
				return;

			if (window.arcadeScreen && window.arcadeScreen.texture) {
				const time = Date.now() / 1000;
				func(time);

				if (window.updateDebugCanvas)
					window.updateDebugCanvas();
			}

			this.animationFrame = requestAnimationFrame(animateTexture);
		};

		animateTexture();
	}

}

export default Engine;
