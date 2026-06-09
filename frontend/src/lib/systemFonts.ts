/**
 * Detect which monospace fonts are installed on the system
 * using canvas width measurement.
 */

/** Popular monospace fonts to check across platforms */
const MONOSPACE_CANDIDATES = [
  // Coding fonts
  "Cascadia Code",
  "Cascadia Mono",
  "JetBrains Mono",
  "Fira Code",
  "IBM Plex Mono",
  "Berkeley Mono",
  "Source Code Pro",
  "Menlo",
  "Monaco",
  "Consolas",
  "Courier New",
  "Ubuntu Mono",
  "DejaVu Sans Mono",
  "Liberation Mono",
  "Roboto Mono",
  "Inconsolata",
  "Hack",
  "Droid Sans Mono",
  "Noto Sans Mono",
  "SF Mono",
  "PT Mono",
  "Anonymous Pro",
  "Space Mono",
  "Victor Mono",
  "Fantasque Sans Mono",
  "Iosevka",
  "Input Mono",
  "Operator Mono",
  "PragmataPro",
  "Meslo LG M",
  "Bitstream Vera Sans Mono",
  "Lucida Console",
  "Courier",
  "monospace",
];

const BASE_FONT = "monospace";
const TEST_STRING = "mmmmmmmmmmlli";
const TEST_SIZE = "72px";

let cached: string[] | null = null;

/**
 * Probe the system for installed monospace fonts.
 * Returns a promise that resolves to an alphabetically sorted list
 * of detected font names. Results are cached after the first call.
 */
export function detectMonospaceFonts(): Promise<string[]> {
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve) => {
    // Use requestIdleCallback if available, otherwise setTimeout
    const run = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        cached = MONOSPACE_CANDIDATES;
        resolve(cached);
        return;
      }

      // Measure baseline width with the generic monospace font
      ctx.font = `${TEST_SIZE} ${BASE_FONT}`;
      const baselineWidth = ctx.measureText(TEST_STRING).width;

      const detected: string[] = [];

      for (const font of MONOSPACE_CANDIDATES) {
        ctx.font = `${TEST_SIZE} '${font}', ${BASE_FONT}`;
        const width = ctx.measureText(TEST_STRING).width;
        // If the width differs from the baseline, the font is installed
        if (width !== baselineWidth) {
          detected.push(font);
        }
      }

      // Always include the generic "monospace" fallback
      if (!detected.includes("monospace")) {
        detected.push("monospace");
      }

      detected.sort((a, b) => a.localeCompare(b));
      cached = detected;
      resolve(detected);
    };

    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(run, { timeout: 500 });
    } else {
      setTimeout(run, 0);
    }
  });
}
