class Obje
{
	constructor(x, y, width, height)
	{
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}

	isCollidingWith(other)
	{
		return this.x < other.x + other.width &&
		       this.x + this.width > other.x &&
		       this.y < other.y + other.height &&
		       this.y + this.height > other.y;
	}

	getPosition()
	{
		return { x: this.x, y: this.y };
	}

	getSize()
	{
		return { width: this.width, height: this.height };
	}


}
