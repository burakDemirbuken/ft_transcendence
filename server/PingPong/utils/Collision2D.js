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
			if (rect1Pos.y > rect2Pos.y)
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
	 * @description trajectory rectangle to rectangle collision detection (Swept AABB)
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
			return obj.oldX !== undefined ? obj.oldX :
				   (obj.oldPos && obj.oldPos.x) ||
				   (obj.oldPosition && obj.oldPosition.x) ||
				   getX(obj);
		};

		const getOldY = (obj) => {
			if (!obj) return getY(obj);
			return obj.oldY !== undefined ? obj.oldY :
				   (obj.oldPos && obj.oldPos.y) ||
				   (obj.oldPosition && obj.oldPosition.y) ||
				   getY(obj);
		};

		const rect1X = getX(rect1);
		const rect1Y = getY(rect1);
		const rect1W = getWidth(rect1);
		const rect1H = getHeight(rect1);

		const rect2X = getX(rect2);
		const rect2Y = getY(rect2);
		const rect2W = getWidth(rect2);
		const rect2H = getHeight(rect2);

		const oldX = getOldX(rect1);
		const oldY = getOldY(rect1);

		const currentCollision = Collision2D.rectangleToRectangle(rect1, rect2, returnDetails);
		if (currentCollision === true || (currentCollision && currentCollision.colliding)) {
			return currentCollision;
		}

		if (oldX === rect1X && oldY === rect1Y) {
			return returnDetails ? { colliding: false } : false;
		}

		const velX = rect1X - oldX;
		const velY = rect1Y - oldY;

		const expandedRect = {
			x: rect2X - rect1W,
			y: rect2Y - rect1H,
			width: rect2W + rect1W,
			height: rect2H + rect1H
		};

		const lineStart = { x: oldX, y: oldY };
		const lineEnd = { x: rect1X, y: rect1Y };

		const intersection = Collision2D.lineToRectangleIntersection(lineStart, lineEnd, expandedRect);

		if (!intersection.intersects)
			return returnDetails ? { colliding: false } : false;

		if (!returnDetails)
			return true;

		const t = intersection.t;
		const collisionX = oldX + velX * t;
		const collisionY = oldY + velY * t;

		const expandedCenterX = expandedRect.x + expandedRect.width / 2;
		const expandedCenterY = expandedRect.y + expandedRect.height / 2;
		const dx = collisionX - expandedCenterX;
		const dy = collisionY - expandedCenterY;

		let side, normal;
		const ratioX = Math.abs(dx) / (expandedRect.width / 2);
		const ratioY = Math.abs(dy) / (expandedRect.height / 2);

		if (ratioX > ratioY)
		{
			side = dx > 0 ? 'right' : 'left';
			normal = { x: dx > 0 ? 1 : -1, y: 0 };
		}
		else
		{
			side = dy > 0 ? 'bottom' : 'top';
			normal = { x: 0, y: dy > 0 ? 1 : -1 };
		}

		return {
			colliding: true,
			time: t,
			collisionPoint: { x: collisionX, y: collisionY },
			side: side,
			normal: normal,
			penetration: 0, // At exact collision time, no penetration
			trajectoryStart: { x: oldX, y: oldY },
			trajectoryEnd: { x: rect1X, y: rect1Y }
		};
	}

	/**
	 * Line-Rectangle intersection with time parameter (parametric approach)
	 * @param {Object} lineStart - {x, y}
	 * @param {Object} lineEnd - {x, y}
	 * @param {Object} rect - {x, y, width, height}
	 * @returns {Object} - {intersects: boolean, t: number, point: {x, y}}
	 */
	static lineToRectangleIntersection(lineStart, lineEnd, rect)
	{
		const x1 = lineStart.x;
		const y1 = lineStart.y;
		const x2 = lineEnd.x;
		const y2 = lineEnd.y;

		const rectLeft = rect.x;
		const rectRight = rect.x + rect.width;
		const rectTop = rect.y;
		const rectBottom = rect.y + rect.height;

		const dx = x2 - x1;
		const dy = y2 - y1;

		let tmin = 0;
		let tmax = 1;

		if (Math.abs(dx) > 1e-10)
		{
			const t1 = (rectLeft - x1) / dx;
			const t2 = (rectRight - x1) / dx;
			tmin = Math.max(tmin, Math.min(t1, t2));
			tmax = Math.min(tmax, Math.max(t1, t2));
		}
		else if (x1 < rectLeft || x1 > rectRight)
			return { intersects: false };

		if (Math.abs(dy) > 1e-10)
		{
			const t1 = (rectTop - y1) / dy;
			const t2 = (rectBottom - y1) / dy;
			tmin = Math.max(tmin, Math.min(t1, t2));
			tmax = Math.min(tmax, Math.max(t1, t2));
		}
		else if (y1 < rectTop || y1 > rectBottom)
			return { intersects: false };

		if (tmin <= tmax && tmin >= 0 && tmin <= 1)
		{
			return {
				intersects: true,
				t: tmin,
				point:
				{
					x: x1 + dx * tmin,
					y: y1 + dy * tmin
				}
			};
		}

		return { intersects: false };
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
