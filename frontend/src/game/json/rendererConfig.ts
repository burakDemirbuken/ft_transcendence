interface Colors {
	background: string;
	paddle: string;
	ball: string;
	text: string;
	accent: string;
}

interface PaddleSize {
	width: number;
	height: number;
}

interface Ball {
	radius: number;
}

interface RendererConfig {
	canvasId: string;
	colors: Colors;
	paddleSize: PaddleSize;
	ball: Ball;
}

const rendererConfig: RendererConfig = {
	canvasId: "renderCanvas",
	colors:
	{
		background: "#000000",
		paddle: "#FFFFFF",
		ball: "#FFFFFF",
		text: "#FFFFFF",
		accent: "#00FF00"
	},
	paddleSize:
	{
		width: 10,
		height: 100
	},
	ball:
	{
		radius: 7
	}
};

export default rendererConfig;
