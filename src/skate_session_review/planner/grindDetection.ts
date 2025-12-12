// C:\Users\user\Desktop\invert61\src\skate_session_review\planner\grindDetection.ts

import type { PathPoint3D } from '../3d/PathEditor3D';

/**
 * A detected grind section along the path.
 * startT / endT are normalized (0..1) along the full path length.
 */
export interface GrindSection {
    startT: number;
    endT: number;
    length: number; // meters (approx)
}

/**
 * Detect grind sections along a drawn 3D path.
 *
 * @param path - flattened stroke path (single continuous path)
 * @param copingY - world Y position of coping (usually box.max.y from ramp)
 */
export function detectGrindSections(
    path: PathPoint3D[],
    copingY: number
): GrindSection[] {
    if (path.length < 2) return [];

    const sections: GrindSection[] = [];

    // --- Tunable thresholds (KEEP SIMPLE) ---
    const COPING_Y_EPS = 0.05;     // meters
    const MAX_VERTICAL_DELTA = 0.03;
    const MIN_GRIND_LENGTH = 0.3; // meters
    const MIN_SEGMENT_LEN = 0.02;

    // --- Total path length ---
    let totalLength = 0;
    for (let i = 1; i < path.length; i++) {
        totalLength += dist(path[i - 1], path[i]);
    }
    if (totalLength === 0) return [];

    let walked = 0;
    let currentStartT: number | null = null;
    let currentLength = 0;

    for (let i = 1; i < path.length; i++) {
        const p1 = path[i - 1];
        const p2 = path[i];

        const segLen = dist(p1, p2);
        const dy = Math.abs(p2.y - p1.y);

        const isAtCoping =
            Math.abs(p2.y - copingY) <= COPING_Y_EPS;

        const isMostlyHorizontal =
            dy <= MAX_VERTICAL_DELTA && segLen >= MIN_SEGMENT_LEN;

        const isGrind = isAtCoping && isMostlyHorizontal;

        if (isGrind) {
            if (currentStartT === null) {
                currentStartT = walked / totalLength;
                currentLength = 0;
            }
            currentLength += segLen;
        } else {
            if (
                currentStartT !== null &&
                currentLength >= MIN_GRIND_LENGTH
            ) {
                sections.push({
                    startT: currentStartT,
                    endT: walked / totalLength,
                    length: currentLength,
                });
            }
            currentStartT = null;
            currentLength = 0;
        }

        walked += segLen;
    }

    // Close open section
    if (
        currentStartT !== null &&
        currentLength >= MIN_GRIND_LENGTH
    ) {
        sections.push({
            startT: currentStartT,
            endT: 1,
            length: currentLength,
        });
    }

    return sections;
}

/* ---------------------------------------------------
   Helpers
----------------------------------------------------*/

function dist(a: PathPoint3D, b: PathPoint3D): number {
    return Math.hypot(
        b.x - a.x,
        b.y - a.y,
        b.z - a.z
    );
}
