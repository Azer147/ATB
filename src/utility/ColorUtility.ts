// Tolerance should be consistent everywhere
// Define when two hue are similar enough to be considered the same group.
const DEFAULT_HUE_TOLERANCE = 25;

// TODO: placeholder - need redo
export function createColorSquare(htmlId: string, hex: string, size: number = 20): HTMLDivElement {
    const square = document.createElement("div");
    square.id = htmlId;
    //square.style.width = `${size}px`;
    square.style.height = `${size}px`;
    square.style.backgroundColor = hex;
    square.style.border = "1px solid #ccc";
    square.style.borderRadius = "4px";
    square.style.display = "inline-block";

    return square;
}

// Try to change item color to newColor
// Only the Hue is changed, saturation and lightness are preserved to keep the original different color tone.
export function smartReplaceItemColor(
    newColor: string,
    origColor: ItemColor | undefined,
    sourceHexToReplace?: string, // If provided, will only replace this color group
    tolerance: number = DEFAULT_HUE_TOLERANCE
): ItemColor | undefined {
    if (origColor && newColor && newColor !== "Default") {
        if (typeof origColor === "string") {
            return smartReplaceSingleColor(origColor, newColor, sourceHexToReplace, tolerance);
        } else if (Array.isArray(origColor)) {
            let newColorList: string[] = [];
            for (let i=0; i < origColor.length; i++) {
                newColorList.push(smartReplaceSingleColor(origColor[i], newColor, sourceHexToReplace, tolerance));
            }
            return newColorList;
        }
    }
    return origColor; // Default color
}

// Try to change a single color
// Only the Hue is changed, saturation and lightness are preserved to keep the original different color tone.
export function smartReplaceSingleColor(
    originalHex: string,
    targetHex: string,
    sourceHexToReplace?: string, // If provided, will only replace this color group
    tolerance: number = DEFAULT_HUE_TOLERANCE
): string {
    if (!originalHex || originalHex === "Default" || !targetHex) {
        return originalHex;
    }

    const origHsl = hexToHsl(originalHex);

    // Ignore neutral colors (black, grey)
    if (isNeutralColor(origHsl.s, origHsl.l)) {
        return originalHex;
    }

    // (optional) Check if originalHex is in the same color group as sourceHexToReplace
    if (sourceHexToReplace && sourceHexToReplace !== "Default") {
        const sourceHsl = hexToHsl(sourceHexToReplace);
        const distance = getHueDistance(origHsl.h, sourceHsl.h);

        // Ignore if not the same color group
        if (distance > tolerance) {
            return originalHex;
        }
    }

    // We only use the Hue of targetHex, and keep the original sat and light
    const targetHsl = hexToHsl(targetHex);
    return hslToHex(targetHsl.h, origHsl.s, origHsl.l);
}

// Used by extractMainColorGroup to build the color groups
interface ColorBucket {
    representativeHex: string;
    representativeHue: number;
    totalCount: number;
    exactCounts: Map<string, number>;
}

/**
 * Extracts and ranks the most prominent colors, grouping them by Hue family.
 *
 * @param allColors A flat array of all color strings.
 * @param ignoreNeutrals If true, strips out greys, blacks, and whites.
 * @param hueTolerance How many degrees apart on the color wheel to group (default: 25).
 * @returns An array of HEX color strings, sorted from most frequent to least.
 */
export function extractMainColorGroup(
    allColors: string[],
    ignoreNeutrals: boolean = true,
    hueTolerance: number = DEFAULT_HUE_TOLERANCE
): string[] {
    const buckets: ColorBucket[] = [];

    for (let color of allColors) {
        if (!color || color === "Default" || color === "None") {
            continue;
        }

        let hex = color.toUpperCase();
        if (hex.length === 4 && hex.startsWith("#")) {
            hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
        }
        const hsl = hexToHsl(hex);

        if (ignoreNeutrals) {
            if (isNeutralColor(hsl.s, hsl.l)) {
                continue;
            }
        }

        // Check if bucket exist for this color group
        let foundBucket: ColorBucket | null = null;
        for (const bucket of buckets) {
            const distance = getHueDistance(hsl.h, bucket.representativeHue);
            if (distance <= hueTolerance) {
                foundBucket = bucket;
                break;
            }
        }

        if (foundBucket) {
            // Update existing bucket
            foundBucket.totalCount += 1;

            const currentExactCount = (foundBucket.exactCounts.get(hex) || 0) + 1;
            foundBucket.exactCounts.set(hex, currentExactCount);

            // Use the most popular shade as a representative color.
            const repCount = foundBucket.exactCounts.get(foundBucket.representativeHex) || 0;
            if (currentExactCount > repCount) {
                foundBucket.representativeHex = hex;
                foundBucket.representativeHue = hsl.h; // Update the cached hue
            }
        } else {
            // Create new bucket
            const exactMap = new Map<string, number>();
            exactMap.set(hex, 1);

            buckets.push({
                representativeHex: hex,
                representativeHue: hsl.h, // Store the hue for future distance checks
                totalCount: 1,
                exactCounts: exactMap
            });
        }
    }

    // Sort by count and return representative hex list
    return buckets
        .sort((a, b) => b.totalCount - a.totalCount)
        .map(bucket => bucket.representativeHex);
}

/**
 * Calculates the shortest distance between two hues on a 360-degree wheel.
 * Returns a value between 0 (exact match) and 180 (opposite colors).
 */
export function getHueDistance(hue1: number, hue2: number): number {
    let diff = Math.abs(hue1 - hue2) % 360;
    return diff > 180 ? 360 - diff : diff;
}

/**
 * Determines if a color should be ignored during recoloring.
 * @param s Saturation (0 to 1)
 * @param l Lightness (0 to 1)
 */
export function isNeutralColor(s: number, l: number): boolean {
    // grey
    if (s < 0.05) return true;

    // black
    if (l < 0.05) return true;

    // white
    //if (l > 0.95) return true;

    return false;
}

/**
 * Converts a HEX string to HSL values.
 * @param hex The hex color (e.g., "#FF0000" or "#F00")
 * @returns Object containing h (0-360), s (0-1), l (0-1)
 */
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
    // Strip the hash if present
    hex = hex.replace(/^#/, '');

    let r = 0, g = 0, b = 0;
    if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    }

    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return { h: h * 360, s, l };
}

/**
 * Converts HSL values back to a HEX string.
 * @param h Hue (0-360), s Saturation (0-1), l Lightness (0-1)
 * @returns HEX color string (e.g., "#FF0000")
 */
export function hslToHex(h: number, s: number, l: number): string {
    h /= 360;
    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    const toHex = (x: number) => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}