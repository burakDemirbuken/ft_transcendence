import Vector2D from '../../utils/Vector2D.js';
import Object from '../PıngPong/utils/Object.js';

class Collision2D
{
	// ============================
	// RECTANGLE COLLISION METHODS
	// ============================

	/**
	 * rectangle to rectangle collision detection (AABB)
	 * @param {Object} rect1 - {x, y, width, height}
	 * @param {Object} rect2 - {x, y, width, height}
	 * @returns {boolean|Object} - colliding or collision details
	 */
	static rectangleToRectangle(rect1, rect2, returnDetails = false)
	{
		const isColliding =
		(
			rect1.x < rect2.x + rect2.width &&
			rect1.x + rect1.width > rect2.x &&
			rect1.y < rect2.y + rect2.height &&
			rect1.y + rect1.height > rect2.y
		);

		if (!returnDetails)
			return isColliding;

		if (!isColliding)
			return { colliding: false };

		const overlapX = Math.min(rect1.x + rect1.width - rect2.x, rect2.x + rect2.width - rect1.x);
		const overlapY = Math.min(rect1.y + rect1.height - rect2.y, rect2.y + rect2.height - rect1.y);

		let side, normalX = 0, normalY = 0, penetration;

		if (overlapX < overlapY)
		{
			penetration = overlapX;
			if (rect1.x < rect2.x)
			{
				side = 'right';
				normalX = -1;
			}
			else
			{
				side = 'left';
				normalX = 1;
			}
		}
		else
		{
			penetration = overlapY;
			if (rect1.y < rect2.y)
			{
				side = 'bottom';
				normalY = -1;
			}
			else
			{
				side = 'top';
				normalY = 1;
			}
		}

		return {
			colliding: true,
			side: side,
			overlap: { x: overlapX, y: overlapY },
			normal: { x: normalX, y: normalY },
			penetration: penetration
		};
	}

	// ============================
	// TRAJECTORY COLLISION METHODS
	// ============================

	/**
	 * @description trajectory rectangle to rectangle collision detection
	 * @param {Object} rect1 - trajectory rectangle {x, y, width, height, oldX, oldY}
	 * @param {Object} rect2 - static rectangle {x, y, width, height}
	 * @param {boolean} returnDetails - collision details
	 * @returns {boolean|Object} - Collision status or details
	 */
	static trajectoryRectangleToRectangle(rect1, rect2, returnDetails = false)
	{
		const currentCollision = this.rectangleToRectangle(rect1, rect2, returnDetails);
		if (currentCollision === true || (currentCollision && currentCollision.colliding)) {
			return currentCollision;
		}

		const startX = rect1.oldX !== undefined ? rect1.oldX : rect1.x;
		const startY = rect1.oldY !== undefined ? rect1.oldY : rect1.y;
		const endX = rect1.x;
		const endY = rect1.y;

		if (startX === endX && startY === endY)
			return returnDetails ? { colliding: false } : false;

		const sweepStartX = Math.min(startX, endX);
		const sweepStartY = Math.min(startY, endY);
		const sweepEndX = Math.max(startX + rect1.width, endX + rect1.width);
		const sweepEndY = Math.max(startY + rect1.height, endY + rect1.height);

		const sweptArea = {
			x: sweepStartX,
			y: sweepStartY,
			width: sweepEndX - sweepStartX,
			height: sweepEndY - sweepStartY
		};

		const sweepCollision = this.rectangleToRectangle(sweptArea, rect2, false);
		if (!sweepCollision)
			return returnDetails ? { colliding: false } : false;

		const corners = [
			{ x1: startX, y1: startY, x2: endX, y2: endY },
			{ x1: startX + rect1.width, y1: startY, x2: endX + rect1.width, y2: endY },
			{ x1: startX, y1: startY + rect1.height, x2: endX, y2: endY + rect1.height },
			{ x1: startX + rect1.width, y1: startY + rect1.height, x2: endX + rect1.width, y2: endY + rect1.height }
		];

		let earliestCollision = null;
		let earliestTime = 1.0;

		for (const corner of corners)
		{
			const lineCollision = this.lineToRectangle(corner, rect2, true);
			if (lineCollision && lineCollision.colliding && lineCollision.time < earliestTime)
				{
				earliestTime = lineCollision.time;
				earliestCollision = lineCollision;
			}
		}

		if (earliestCollision)
		{
			if (!returnDetails)
				return true;

			const collisionX = startX + (endX - startX) * earliestTime;
			const collisionY = startY + (endY - startY) * earliestTime;

			const collisionRect1 = {
				x: collisionX,
				y: collisionY,
				width: rect1.width,
				height: rect1.height
			};

			const detailedCollision = this.rectangleToRectangle(collisionRect1, rect2, true);

			return {
				colliding: true,
				time: earliestTime,
				collisionPoint: {
					x: collisionX,
					y: collisionY
				},
				trajectoryStart: { x: startX, y: startY },
				trajectoryEnd: { x: endX, y: endY },
				...detailedCollision
			};
		}

		return returnDetails ? { colliding: false } : false;
	}

	/**
	 * line to rectangle collision detection
	 * @description Checks if a line segment intersects with a rectangle.
	 * @param {Object} line - {x1, y1, x2, y2}
	 * @param {Object} rect - {x, y, width, height}
	 * @returns {boolean|Object}
	 */
	static lineToRectangle(line, rect, returnDetails = false)
	{
		const INSIDE = 0; // 0000
		const LEFT = 1;   // 0001
		const RIGHT = 2;  // 0010
		const BOTTOM = 4; // 0100
		const TOP = 8;    // 1000

		const computeOutCode = (x, y) => {
			let code = INSIDE;
			if (x < rect.x) code |= LEFT;
			else if (x > rect.x + rect.width) code |= RIGHT;
			if (y < rect.y) code |= BOTTOM;
			else if (y > rect.y + rect.height) code |= TOP;
			return code;
		};

		let x1 = line.x1, y1 = line.y1;
		let x2 = line.x2, y2 = line.y2;
		let outcode1 = computeOutCode(x1, y1);
		let outcode2 = computeOutCode(x2, y2);

		while (true)
		{
			if (!(outcode1 | outcode2))
				return returnDetails ? { colliding: true, intersection: { x: x1, y: y1 } } : true;
			else if (outcode1 & outcode2)
				return returnDetails ? { colliding: false } : false;
			else
			{
				let x, y;
				const outcodeOut = outcode1 ? outcode1 : outcode2;

				if (outcodeOut & TOP)
				{
					x = x1 + (x2 - x1) * (rect.y + rect.height - y1) / (y2 - y1);
					y = rect.y + rect.height;
				}
				else if (outcodeOut & BOTTOM)
				{
					x = x1 + (x2 - x1) * (rect.y - y1) / (y2 - y1);
					y = rect.y;
				}
				else if (outcodeOut & RIGHT)
				{
					y = y1 + (y2 - y1) * (rect.x + rect.width - x1) / (x2 - x1);
					x = rect.x + rect.width;
				}
				else if (outcodeOut & LEFT)
				{
					y = y1 + (y2 - y1) * (rect.x - x1) / (x2 - x1);
					x = rect.x;
				}

				if (outcodeOut === outcode1)
				{
					x1 = x;
					y1 = y;
					outcode1 = computeOutCode(x1, y1);
				}
				else
				{
					x2 = x;
					y2 = y;
					outcode2 = computeOutCode(x2, y2);
				}
			}
		}
	}


	/**
	 * Basic overlap resolution
	 * @param {Object} obj1 - {x, y, radius}
	 * @param {Object} obj2 - {x, y, radius}
	 * @returns {Object} - New positions
	 */
	static separateObjects(obj1, obj2)
	{
		const dx = obj2.x - obj1.x;
		const dy = obj2.y - obj1.y;
		const distance = Math.sqrt(dx * dx + dy * dy);
		const minDistance = obj1.radius + obj2.radius;

		if (distance >= minDistance)
			return { obj1, obj2 };

		const overlap = minDistance - distance;
		const separationDistance = overlap / 2;

		const nx = distance > 0 ? dx / distance : 1;
		const ny = distance > 0 ? dy / distance : 0;

		return {
			obj1: {
				...obj1,
				x: obj1.x - nx * separationDistance,
				y: obj1.y - ny * separationDistance
			},
			obj2: {
				...obj2,
				x: obj2.x + nx * separationDistance,
				y: obj2.y + ny * separationDistance
			}
		};
	}
}

export default Collision2D;
