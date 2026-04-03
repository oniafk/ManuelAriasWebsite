// Constants for wave animation behavior
const WAVE_THRESH = 3;
const CHAR_MULT = 3;
const ANIM_STEP = 40;
const WAVE_BUF = 5;

interface Wave {
  startPos: number;
  startTime: number;
  id: number;
}

interface ASCIIOpts {
  dur?: number;
  chars?: string;
  preserveSpaces?: boolean;
  spread?: number;
}

/**
 * ASCII ripple animation instance for an element
 */
export const createASCIIShift = (el: HTMLElement, opts: ASCIIOpts = {}) => {
  // State variables
  let origTxt = el.textContent || "";
  let origChars = origTxt.split("");
  let isAnim = false;
  let cursorPos = 0;
  let waves: Wave[] = [];
  let animId: number | null = null;
  let isHover = false;
  let origW: number | null = null;

  // options
  const cfg = {
    dur: 600,
    chars: '.,·-─~+:;=*π""┐┌┘┴┬╗╔╝╚╬╠╣╩╦║░▒▓█▄▀▌▐■!?&#$@0123456789*',
    preserveSpaces: true,
    spread: 0.3,
    ...opts
  };

  /**
   * Updates cursor position based on mouse move
   */
  const updateCursorPos = (e: MouseEvent) => {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const len = origTxt.length;
    const pos = Math.round((x / rect.width) * len);
    cursorPos = Math.max(0, Math.min(pos, len - 1));
  };

  /**
   * Starts a new wave animation from current cursor pos
   */
  const startWave = () => {
    waves.push({
      startPos: cursorPos,
      startTime: Date.now(),
      id: Math.random()
    });

    if (!isAnim) start();
  };

  /**
   * Clean up expired waves that have exceeded their duration
   */
  const cleanupWaves = (t: number) => {
    waves = waves.filter((w) => t - w.startTime < cfg.dur);
  };

  /**
   * Calculates wave fx for a character at given index
   * Returns whether to animate and which character to show
   */
  const calcWaveEffect = (charIdx: number, t: number) => {
    let shouldAnim = false;
    let resultChar = origChars[charIdx];

    for (const w of waves) {
      const age = t - w.startTime;
      const prog = Math.min(age / cfg.dur, 1);
      const dist = Math.abs(charIdx - w.startPos);
      const maxDist = Math.max(w.startPos, origChars.length - w.startPos - 1);
      const rad = (prog * (maxDist + WAVE_BUF)) / cfg.spread;

      if (dist <= rad) {
        shouldAnim = true;
        const intens = Math.max(0, rad - dist);

        // Chars in the wave zone shift through character sequence
        if (intens <= WAVE_THRESH && intens > 0) {
          const shiftIdx =
            (dist * CHAR_MULT + Math.floor(age / ANIM_STEP)) % cfg.chars.length;
          resultChar = cfg.chars[shiftIdx];
        }
      }
    }

    return { shouldAnim, char: resultChar };
  };

  /**
   * Generates scrambled text based on current waves
   */
  const genScrambledTxt = (t: number) =>
    origChars
      .map((char, i) => {
        if (cfg.preserveSpaces && char === " ") return " ";
        const res = calcWaveEffect(i, t);
        return res.shouldAnim ? res.char : char;
      })
      .join("");

  /**
   * Stops the animation and resets to original text
   */
  const stop = () => {
    el.textContent = origTxt;
    el.classList.remove("as");

    // Reset width to allow natural text flow
    if (origW !== null) {
      el.style.width = "";
      origW = null;
    }
    isAnim = false;
  };

  /**
   * Start the animation loop
   */
  const start = () => {
    if (isAnim) return;

    // Preserve original width to prevent layout shifts
    if (origW === null) {
      origW = el.getBoundingClientRect().width;
      el.style.width = `${origW}px`;
    }

    isAnim = true;
    el.classList.add("as");

    const animate = () => {
      const t = Date.now();

      // Clean up expired waves first
      cleanupWaves(t);

      if (waves.length === 0) {
        stop();
        return;
      }

      // Generate scrambled text
      el.textContent = genScrambledTxt(t);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
  };

  /**
   * Event handlers
   */
  const handleEnter = (e: MouseEvent) => {
    isHover = true;
    updateCursorPos(e);
    startWave();
  };

  const handleMove = (e: MouseEvent) => {
    if (!isHover) return;
    const old = cursorPos;
    updateCursorPos(e);
    if (cursorPos !== old) startWave();
  };

  const handleLeave = () => {
    isHover = false;
  };

  /**
   * Initializes event listeners
   */
  const init = () => {
    el.addEventListener("mouseenter", handleEnter);
    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
  };

  /**
   * Resets animation to original state
   */
  const resetToOrig = () => {
    waves = [];
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }

    // Reset width preservation
    if (origW !== null) {
      el.style.width = "";
      origW = null;
    }
    stop();
  };

  /**
   * Updates the text content
   */
  const updateTxt = (newTxt: string) => {
    origTxt = newTxt;
    origChars = newTxt.split("");
    if (!isAnim) el.textContent = newTxt;
  };

  /**
   * Destroys the instance and cleans up event listeners
   */
  const destroy = () => {
    resetToOrig();
    el.removeEventListener("mouseenter", handleEnter);
    el.removeEventListener("mousemove", handleMove);
    el.removeEventListener("mouseleave", handleLeave);
  };

  // Initialize the instance
  init();

  // public API
  return { updateTxt, resetToOrig, destroy };
};
