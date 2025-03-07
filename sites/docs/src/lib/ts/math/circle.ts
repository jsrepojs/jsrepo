/*
	Installed from github/ieedan/std
*/

import * as triangle from './triangles';
import type { Point } from './types';

/** Gets a point in reference to a grid with a coordinate system in line with the DOM.
 * You can use this to animate a point around a circle.
 *
 * **Example Grid:**
 * ```
 * 0───────→ x
 * │ ● (1, 1)
 * │   ● (2, 2)
 * │   ● (2, 3)
 * ↓
 * y
 * ```
 *
 * @param angle
 * @param radius
 * @returns
 *
 * ```ts
 * // a program to move something around a circle
 *
 * const radius = 24;
 * const speed = 0.05;
 * let angle = 0;
 *
 * const update = () => {
 *    const cords = getPoint(angle, radius);
 *
 *    move(cords); // update position
 *
 *    // increase angle to move point around the circle
 *    if (angle >= 360) {
 *        angle = speed; // start at speed because 360 is the same as 0
 *    } else {
 *        angle += speed;
 *    }
 *
 *    requestAnimationFrame(update)
 * }
 *
 * update();
 * ```
 */
const getPoint = (angle: number, radius: number): Point => {
	if (angle > 0 && angle < 90) {
		const deg = angle;
		const { opposite, adjacent } = triangle.right.solve({ angle: deg, hypotenuse: radius });

		return { x: radius - opposite, y: radius - adjacent };
	}

	if (angle === 90) {
		return { x: 0, y: radius };
	}

	if (angle > 90 && angle < 180) {
		const deg = angle - 90;
		const { opposite, adjacent } = triangle.right.solve({ angle: deg, hypotenuse: radius });

		return { x: radius - adjacent, y: radius + opposite };
	}

	if (angle === 180) {
		return { x: radius, y: radius * 2 };
	}

	if (angle > 180 && angle < 270) {
		const deg = angle - 180;
		const { opposite, adjacent } = triangle.right.solve({ angle: deg, hypotenuse: radius });

		return { x: radius + opposite, y: radius * 2 - radius + adjacent };
	}

	if (angle === 270) {
		return { x: radius * 2, y: radius };
	}

	if (angle > 270 && angle < 360) {
		const deg = angle - 270;
		const { opposite, adjacent } = triangle.right.solve({ angle: deg, hypotenuse: radius });

		return { x: radius * 2 - radius + adjacent, y: radius - opposite };
	}

	// must be 0degrees
	return { x: radius, y: 0 };
};

export { getPoint };
