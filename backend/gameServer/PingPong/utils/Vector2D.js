class Vector2D
{
	constructor(x = 0, y = 0)
	{
		this.x = x;
		this.y = y;
	}

	add(vector)
	{
		return new Vector2D(this.x + vector.x, this.y + vector.y);
	}

	subtract(vector)
	{
		return new Vector2D(this.x - vector.x, this.y - vector.y);
	}

	multiply(scalar)
	{
		return new Vector2D(this.x * scalar, this.y * scalar);
	}

	divide(scalar)
	{
		if (scalar === 0)
			throw new Error('Division by zero');
		return new Vector2D(this.x / scalar, this.y / scalar);
	}
}

export default Vector2D;
