import Vector2D from './Vector2D.js';

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
		// Null check and safe property access
		const getX = (obj) => {
			if (!obj) return 0;
			return obj.x || (obj.pos && obj.pos.x) || (obj.position && obj.position.x) || 0;
		};

		const getY = (obj) => {
			if (!obj) return 0;
			return obj.y || (obj.pos && obj.pos.y) || (obj.position && obj.position.y) || 0;
		};

		const getWidth = (obj) => {
			if (!obj) return 0;
			return obj.width || (obj.size && obj.size.width) || (obj.size && obj.size.x) || 0;
		};

		const getHeight = (obj) => {
			if (!obj) return 0;
			return obj.height || (obj.size && obj.size.height) || (obj.size && obj.size.y) || 0;
		};

		const rect1Pos = new Vector2D(getX(rect1), getY(rect1));
		const rect1Size = { width: getWidth(rect1), height: getHeight(rect1) };

		const rect2Pos = new Vector2D(getX(rect2), getY(rect2));
		const rect2Size = { width: getWidth(rect2), height: getHeight(rect2) };

		const isColliding =
		(
			rect1Pos.x < rect2Pos.x + rect2Size.width &&
			rect1Pos.x + rect1Size.width > rect2Pos.x &&
			rect1Pos.y < rect2Pos.y + rect2Size.height &&
			rect1Pos.y + rect1Size.height > rect2Pos.y
		);

		if (!returnDetails)
			return isColliding;

		if (!isColliding)
			return { colliding: false };

		const overlapX = Math.min(rect1Pos.x + rect1Size.width - rect2Pos.x, rect2Pos.x + rect2Size.width - rect1Pos.x);
		const overlapY = Math.min(rect1Pos.y + rect1Size.height - rect2Pos.y, rect2Pos.y + rect2Size.height - rect1Pos.y);

		let side, normalX = 0, normalY = 0, penetration;

		if (overlapX < overlapY)
		{
			penetration = overlapX;
			if (rect1Pos.x < rect2Pos.x)
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
			if (rect1Pos.y < rect2Pos.y)
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
		if (!rect1 || !rect2) {
			console.warn('⚠️ Null objects passed to trajectoryRectangleToRectangle');
			return returnDetails ? { colliding: false } : false;
		}


		const currentCollision = Collision2D.rectangleToRectangle(rect1, rect2, returnDetails);
		if (currentCollision === true || (currentCollision && currentCollision.colliding)) {
			return currentCollision;
		}

		const getX = (obj) => {
			if (!obj) return 0;
			return obj.x || (obj.pos && obj.pos.x) || (obj.position && obj.position.x) || 0;
		};

		const getY = (obj) => {
			if (!obj) return 0;
			return obj.y || (obj.pos && obj.pos.y) || (obj.position && obj.position.y) || 0;
		};

		const getWidth = (obj) => {
			if (!obj) return 0;
			return obj.width || (obj.size && obj.size.width) || (obj.size && obj.size.x) || 0;
		};

		const getHeight = (obj) => {
			if (!obj) return 0;
			return obj.height || (obj.size && obj.size.height) || (obj.size && obj.size.y) || 0;
		};

		const getOldX = (obj) => {
			if (!obj) return getX(obj);
			return obj.oldX || (obj.oldPos && obj.oldPos.x) || (obj.oldPosition && obj.oldPosition.x) || getX(obj);
		};

		const getOldY = (obj) => {
			if (!obj) return getY(obj);
			return obj.oldY || (obj.oldPos && obj.oldPos.y) || (obj.oldPosition && obj.oldPosition.y) || getY(obj);
		};

		const rect1Pos = new Vector2D(getX(rect1), getY(rect1));
		const rect1Size = { width: getWidth(rect1), height: getHeight(rect1) };
		const rect1OldPos = new Vector2D(getOldX(rect1), getOldY(rect1));

		const startX = rect1OldPos.x;
		const startY = rect1OldPos.y;
		const endX = rect1Pos.x;
		const endY = rect1Pos.y;

		if (startX === endX && startY === endY)
			return returnDetails ? { colliding: false } : false;

		const sweepStartX = Math.min(startX, endX);
		const sweepStartY = Math.min(startY, endY);
		const sweepEndX = Math.max(startX + rect1Size.width, endX + rect1Size.width);
		const sweepEndY = Math.max(startY + rect1Size.height, endY + rect1Size.height);

		const sweptArea = {
			x: sweepStartX,
			y: sweepStartY,
			width: sweepEndX - sweepStartX,
			height: sweepEndY - sweepStartY
		};
		const sweepCollision = Collision2D.rectangleToRectangle(sweptArea, rect2, false);
		if (!sweepCollision)
			return returnDetails ? { colliding: false } : false;

		const corners = [
			{ x1: startX, y1: startY, x2: endX, y2: endY },
			{ x1: startX + rect1Size.width, y1: startY, x2: endX + rect1Size.width, y2: endY },
			{ x1: startX, y1: startY + rect1Size.height, x2: endX, y2: endY + rect1Size.height },
			{ x1: startX + rect1Size.width, y1: startY + rect1Size.height, x2: endX + rect1Size.width, y2: endY + rect1Size.height }
		];

		let earliestCollision = null;
		let earliestTime = 1.0;

		for (const corner of corners)
		{
			const lineCollision = Collision2D.lineToRectangle(corner, rect2, true);
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
				width: rect1Size.width,
				height: rect1Size.height
			};

			const detailedCollision = Collision2D.rectangleToRectangle(collisionRect1, rect2, true);

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
	 * @description Separates two objects based on collision details.
	 * @param {Object} obj1 - {x, y, width, height} - (stationary object)
	 * @param {Object} obj2 - {x, y, width, height} - (moving object)
	 * @param {Object} collisionDetails - {colliding, overlap, normal, penetration}
	 * @returns {Object} - New positions {obj1: {x, y}, obj2: {x, y}}
	 */
	static separateObjects(obj1, obj2, collisionDetails)
	{
		if (!obj1 || !obj2 || !collisionDetails || !collisionDetails.colliding)
		{
			console.warn('⚠️ Invalid parameters for separateObjects');
			return { obj1: { x: 0, y: 0 }, obj2: { x: 0, y: 0 } };
		}

		const getX = (obj) => obj.x || (obj.pos && obj.pos.x) || (obj.position && obj.position.x) || 0;
		const getY = (obj) => obj.y || (obj.pos && obj.pos.y) || (obj.position && obj.position.y) || 0;

		const originalX = getX(obj1);
		const originalY = getY(obj1);

		let newX = originalX + collisionDetails.normal.x * collisionDetails.penetration;
		let newY = originalY + collisionDetails.normal.y * collisionDetails.penetration;

		return {
			obj1: { x: originalX, y: originalY }, // obj1 remains stationary
			obj2: { x: newX, y: newY }            // obj2 moved to resolve collision
		};
	}
}

export default Collision2D;
