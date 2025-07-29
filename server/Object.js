class Object
{
	constructor(x, y, width, height)
	{
		this.position = {x: x, y: y };
		this.oldPosition = { x: x, y: y };
		this.size = { width: width, height: height };
	}

	isCollidingWith(other)
	{
		return this.position.x < other.position.x + other.size.width &&
		       this.position.x + this.size.width > other.position.x &&
		       this.position.y < other.position.y + other.size.height &&
		       this.position.y + this.size.height > other.position.y;
	}
}

export default Object;

