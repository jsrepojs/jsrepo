/*
	jsrepo 1.3.0
	Installed from github/ieedan/std
	11-22-2024
*/

import { dtr } from './conversions';

export type RightTriangle = {
	/** Angle in degrees */
	angle: number;
	/** opposite length */
	opposite: number;
	/** adjacent length */
	adjacent: number;
	/** hypotenuse length */
	hypotenuse: number;
};

export type SolveOptions =
	| {
			angle: number;
			opposite: number;
			adjacent?: never;
			hypotenuse?: never;
	  }
	| {
			angle: number;
			opposite?: never;
			adjacent: number;
			hypotenuse?: never;
	  }
	| {
			angle: number;
			opposite?: never;
			adjacent?: never;
			hypotenuse: number;
	  };

/** Solves the right triangle based on the angle given and any one of the sides
 *
 * @param param0
 * @returns
 */
const solveRight = ({ angle, opposite, adjacent, hypotenuse }: SolveOptions): RightTriangle => {
	if (angle <= 0) throw new Error(`Invalid value (${angle}) for 'angle'`);

	if (typeof hypotenuse === 'number') {
		opposite = solveForOpposite({ angle, hypotenuse });
		adjacent = solveForAdjacent({ angle, hypotenuse });
	} else if (typeof opposite === 'number') {
		adjacent = solveForAdjacent({ angle, opposite });
		hypotenuse = solveForHypotenuse({ angle, opposite });
	} else if (typeof adjacent === 'number') {
		opposite = solveForOpposite({ angle, adjacent });
		hypotenuse = solveForHypotenuse({ angle, adjacent });
	} else {
		throw new Error(
			'Incorrect arguments provided! expected opposite, adjacent, or hypotenuse to be a number'
		);
	}

	return {
		angle,
		opposite,
		adjacent,
		hypotenuse
	};
};

type OppositeSolveOptions =
	| { angle: number; adjacent: number; hypotenuse?: never }
	| { angle: number; adjacent?: never; hypotenuse: number };

const solveForOpposite = ({ angle, adjacent, hypotenuse }: OppositeSolveOptions): number => {
	if (typeof hypotenuse === 'number') {
		return Math.sin(dtr(angle)) * hypotenuse;
	}

	return Math.tan(dtr(angle)) * adjacent;
};

type AdjacentSolveOptions =
	| { angle: number; opposite: number; hypotenuse?: never }
	| { angle: number; opposite?: never; hypotenuse: number };

const solveForAdjacent = ({ angle, opposite, hypotenuse }: AdjacentSolveOptions): number => {
	if (typeof opposite === 'number') {
		return opposite / Math.tan(dtr(angle));
	}

	return hypotenuse * Math.cos(dtr(angle));
};

type HypotenuseSolveOptions =
	| { angle: number; opposite: number; adjacent?: never }
	| { angle: number; opposite?: never; adjacent: number };

const solveForHypotenuse = ({ angle, opposite, adjacent }: HypotenuseSolveOptions): number => {
	if (typeof opposite === 'number') {
		return opposite / Math.sin(dtr(angle));
	}

	return adjacent / Math.cos(dtr(angle));
};

/** Functions for working with right triangles */
const right = { solve: solveRight };

export { right };
