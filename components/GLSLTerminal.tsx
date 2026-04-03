'use client';

import { useEffect, useRef } from 'react';

const GLSL_CODE = `// ─── SDF Primitives ───────────────────
float sdSphere(vec3 p, float r) {
  return length(p) - r;
}

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0))
    + min(max(q.x, max(q.y, q.z)), 0.0);
}

float sdTorus(vec3 p, vec2 t) {
  vec2 q = vec2(length(p.xz) - t.x, p.y);
  return length(q) - t.y;
}

// ─── Noise ────────────────────────────
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7)))
    * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x),
             mix(c, d, f.x), f.y);
}

// ─── IQ Color Palette ────────────────
vec3 palette(float t) {
  vec3 a = vec3(0.5, 0.5, 0.5);
  vec3 b = vec3(0.5, 0.5, 0.5);
  vec3 c = vec3(1.0, 1.0, 1.0);
  vec3 d = vec3(0.26, 0.42, 0.56);
  return a + b * cos(6.283 * (c * t + d));
}

// ─── Scene ────────────────────────────
float map(vec3 p) {
  p = mod(p + 2.0, 4.0) - 2.0;
  float s = sdSphere(p, 0.8);
  float b = sdBox(p, vec3(0.6));
  float t = sdTorus(p, vec2(1.2, 0.3));
  return min(min(s, b), t);
}

vec3 calcNormal(vec3 p) {
  vec2 e = vec2(0.001, 0.0);
  return normalize(vec3(
    map(p + e.xyy) - map(p - e.xyy),
    map(p + e.yxy) - map(p - e.yxy),
    map(p + e.yyx) - map(p - e.yyx)
  ));
}

// ─── Main ─────────────────────────────
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5
    * u_resolution.xy) / u_resolution.y;

  vec3 ro = vec3(sin(u_time) * 3.0,
    2.0, cos(u_time) * 3.0);
  vec3 ta = vec3(0.0);
  vec3 fwd = normalize(ta - ro);
  vec3 right = normalize(cross(
    vec3(0, 1, 0), fwd));
  vec3 up = cross(fwd, right);
  vec3 rd = normalize(
    fwd + uv.x * right + uv.y * up);

  float t = 0.0;
  for(int i = 0; i < 128; i++) {
    vec3 p = ro + rd * t;
    float d = map(p);
    if(d < 0.001 || t > 50.0) break;
    t += d;
  }

  vec3 col = vec3(0.0);
  if(t < 50.0) {
    vec3 p = ro + rd * t;
    vec3 n = calcNormal(p);
    vec3 light = normalize(vec3(1, 2, -1));
    float diff = max(dot(n, light), 0.0);
    col = palette(t * 0.1 + u_time * 0.2);
    col *= diff * 0.8 + 0.2;
    col *= exp(-0.03 * t * t);
  }

  gl_FragColor = vec4(col, 1.0);
}`;

const LINES = GLSL_CODE.split('\n');
const CHAR_DELAY_MIN = 18;
const CHAR_DELAY_MAX = 55;
const LINE_DELAY_MIN = 40;
const LINE_DELAY_MAX = 120;
const RESTART_DELAY = 1200;
const FILL_THRESHOLD = 0.88;

export default function GLSLTerminal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    let running = true;
    let lineIdx = 0;
    let charIdx = 0;
    let currentEl: HTMLDivElement | null = null;

    const createLine = (): HTMLDivElement => {
      const div = document.createElement('div');
      div.className = 'glsl-line';
      // Remove cursor from previous last line
      const prev = content.querySelector('.glsl-cursor');
      if (prev) prev.classList.remove('glsl-cursor');
      div.classList.add('glsl-cursor');
      content.appendChild(div);
      return div;
    };

    const clearAll = () => {
      // Flash effect
      container.style.backgroundColor = 'rgba(32,128,32,0.15)';
      setTimeout(() => {
        if (!running) return;
        container.style.backgroundColor = '';
        content.innerHTML = '';
        lineIdx = 0;
        charIdx = 0;
        currentEl = null;
        tick();
      }, RESTART_DELAY);
    };

    const isFull = () =>
      content.scrollHeight > container.clientHeight * FILL_THRESHOLD;

    const tick = () => {
      if (!running) return;

      // Check overflow
      if (isFull()) {
        clearAll();
        return;
      }

      // All lines done — restart
      if (lineIdx >= LINES.length) {
        clearAll();
        return;
      }

      const line = LINES[lineIdx];

      // Start new line element
      if (!currentEl) {
        currentEl = createLine();
        charIdx = 0;
      }

      if (charIdx < line.length) {
        charIdx++;
        // Use non-breaking space for leading spaces to preserve indentation
        const display = line.slice(0, charIdx).replace(/^ +/, (m) =>
          '\u00a0'.repeat(m.length),
        );
        currentEl.textContent = display;
        // Auto-scroll
        container.scrollTop = container.scrollHeight;
        const delay =
          CHAR_DELAY_MIN + Math.random() * (CHAR_DELAY_MAX - CHAR_DELAY_MIN);
        setTimeout(tick, delay);
      } else {
        // Preserve full line with nbsp for indentation
        currentEl.textContent = line.replace(/^ +/, (m) =>
          '\u00a0'.repeat(m.length),
        );
        lineIdx++;
        currentEl = null;
        const delay =
          LINE_DELAY_MIN + Math.random() * (LINE_DELAY_MAX - LINE_DELAY_MIN);
        setTimeout(tick, delay);
      }
    };

    tick();

    return () => {
      running = false;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden transition-colors duration-300"
      style={{
        backgroundColor: '#0a1a0a',
        backgroundImage:
          'radial-gradient(ellipse 500% 100% at 50% 90%, transparent, #091209)',
        boxShadow: 'inset 0 0 10em 1em rgba(0,0,0,0.5)',
        padding: '14px 16px',
      }}
    >
      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          backgroundImage:
            'linear-gradient(0deg, rgba(0,0,0,0.15) 50%, transparent 50%)',
          backgroundSize: '100% 2px',
        }}
      />
      {/* Scan beam */}
      <div className="absolute inset-0 pointer-events-none z-20 crt-scan-beam" />
      {/* Glare */}
      <div
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 50% 15% at 50% 15%, rgba(255,255,255,0.04), transparent),
            radial-gradient(ellipse 50% 10% at 50% 12%, rgba(255,255,255,0.08), transparent),
            radial-gradient(ellipse 50% 5% at 50% 10%, rgba(255,255,255,0.08), transparent)
          `,
        }}
      />
      {/* Code content */}
      <div
        ref={contentRef}
        className="relative z-10 font-mono text-[11px] leading-[1.6] whitespace-pre"
        style={{
          color: 'rgba(128, 255, 128, 0.8)',
          textShadow: '0 0 1ex #3f3, 0 0 2px rgba(255,255,255,0.8)',
        }}
      />
    </div>
  );
}
