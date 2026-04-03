# WebGL + DOM Scroll Sync — Complete Implementation Guide

> **Based on:** [`oniafk/WebGL-Scroll-Sync`](https://github.com/oniafk/WebGL-Scroll-Sync)
> **Stack:** Three.js ^0.161 · Vite ^5.1 · GLSL (custom shaders)
> **Author note:** This guide is a deep-dive expansion of the Lusion technique — covering multi-element scenes, custom shaders, and production-grade performance patterns.

---

## Table of Contents

1. [The Core Problem & Architecture](#1-the-core-problem--architecture)
2. [Single Canvas, Multiple DOM Elements](#2-single-canvas-multiple-dom-elements)
3. [Adding Elements in Different Page Sections](#3-adding-elements-in-different-page-sections)
4. [DOM ↔ WebGL Coordinate Mapping (The Math)](#4-dom--webgl-coordinate-mapping-the-math)
5. [Custom Shaders — Vertex & Fragment](#5-custom-shaders--vertex--fragment)
6. [Performance — Preload, Dispose, Culling & More](#6-performance--preload-dispose-culling--more)
7. [Interaction Patterns — Hover, Click, Scroll-Driven](#7-interaction-patterns--hover-click-scroll-driven)
8. [Smooth Scroll Library Integration](#8-smooth-scroll-library-integration)
9. [Full Annotated Code Reference](#9-full-annotated-code-reference)

---

## 1. The Core Problem & Architecture

### 1.1 Why WebGL + Scroll is Hard

When you combine WebGL with a scrollable page, you hit a fundamental threading problem:

```
Native scroll  →  compositor thread  (GPU-accelerated, runs at display rate)
requestAnimationFrame  →  main thread  (tied to JS execution)
```

These two do **not** run in lock-step. Between frames, the user can scroll several hundred pixels. If your canvas is `position: fixed`, the WebGL render lags behind native scroll by up to one full frame — creating a visible "drift" where your 3D element floats away from its intended DOM position.

### 1.2 Three Approaches Compared

| Approach                           | How it works                                           | Scroll-jacking? | Drift?                              | Recommended?                     |
| ---------------------------------- | ------------------------------------------------------ | --------------- | ----------------------------------- | -------------------------------- |
| **Fixed canvas**                   | `position: fixed; top: 0`                              | No              | **YES** — drifts during fast scroll | Only for simple cases            |
| **Scroll-jacking**                 | Intercept `wheel`/`touchmove`, animate scroll manually | **YES**         | No                                  | Avoid — kills accessibility & UX |
| **Absolute canvas + transform** ✅ | Canvas scrolls with page; JS pushes it back each frame | No              | Minimal (sub-pixel)                 | **Use this**                     |

### 1.3 The Lusion Technique — Absolute Canvas + Per-Frame Transform

The key insight: **put the canvas inside the scrollable page, not above it.**

```html
<!-- #wrapper must be position: relative; overflow: hidden -->
<div id="wrapper">
  <canvas id="canvas"></canvas>
  <!-- position: absolute; left: 0; z-index: -1 -->

  <!-- All your DOM content, including .webgl-element placeholders -->
  <section id="hero">
    <div class="webgl-element" data-src="/images/hero.webp"></div>
  </section>
</div>
```

```css
#wrapper {
  position: relative;
  overflow: hidden; /* Critical — clips the canvas to page width */
}

#canvas {
  pointer-events: none;
  position: absolute;
  left: 0;
  top: 0;
  z-index: -1; /* Renders behind DOM content */
}
```

Each `requestAnimationFrame`, you translate the canvas back to the current scroll position:

```js
// In your animate() loop:
canvas.style.transform = `translate(${window.scrollX}px, ${window.scrollY}px)`;
```

**What this achieves:**

- The canvas is part of the document flow → it scrolls with the page
- The per-frame transform snaps it back to the viewport origin
- The WebGL render happens at the correct scroll offset
- Native scroll is never intercepted → zero scroll-jacking

### 1.4 The Padding Trick (Eliminating Clipping on Fast Scroll)

The residual issue: if the user scrolls faster than 60fps, the canvas transform hasn't caught up yet, and the canvas top/bottom edges clip into view momentarily.

**Solution:** Render extra pixels above and below the viewport.

```js
const PADDING = 0.25; // 25% of viewport height, top and bottom

function onResize() {
  const canvasHeight = window.innerHeight * (1 + PADDING * 2);

  renderer.setSize(window.innerWidth, canvasHeight);
  canvas.style.height = `${canvasHeight}px`;

  // Offset the canvas upward by the padding amount
  // so the extra pixels are above the viewport
  scrollOffset.set(
    window.scrollX,
    window.scrollY - window.innerHeight * PADDING,
  );
}
```

The shader accounts for this by receiving `u_scrollOffset` which includes the padding offset, so elements still render in the right position despite the canvas being taller than the viewport.

---

## 2. Single Canvas, Multiple DOM Elements

### 2.1 Architecture Overview

```
ONE WebGLRenderer
  └── ONE Scene
        └── ONE Camera (Orthographic — no perspective distortion)
              ├── Mesh_0  →  ShaderMaterial_0  →  Texture_0  →  .webgl-element[0]
              ├── Mesh_1  →  ShaderMaterial_1  →  Texture_1  →  .webgl-element[1]
              ├── Mesh_2  →  ShaderMaterial_2  →  Texture_2  →  .webgl-element[2]
              └── Mesh_N  →  ShaderMaterial_N  →  Texture_N  →  .webgl-element[N]
```

**Why Orthographic Camera?**
An orthographic camera maps pixel coordinates directly to the screen without perspective distortion. This is essential — you need to place WebGL geometry at exact pixel positions to match DOM elements.

### 2.2 The Item List Pattern

Every DOM element that has a WebGL counterpart is tracked in an array:

```js
const itemList = [
  {
    domContainer: HTMLElement, // The actual DOM node
    mesh: THREE.Mesh, // Its WebGL counterpart
    x: 0, // document-space left edge
    y: 0, // document-space top edge
    width: 0, // px width
    height: 0, // px height
  },
  // ... one entry per .webgl-element
];
```

### 2.3 Shared vs Per-Element Uniforms

This is the key performance pattern. Split uniforms into two groups:

```js
// SHARED — same value for ALL meshes, passed by reference
// Changing sharedUniforms.u_time.value updates ALL materials simultaneously
const sharedUniforms = {
  u_resolution:  { value: new THREE.Vector2() },  // canvas size
  u_scrollOffset: { value: new THREE.Vector2() }, // current scroll
  u_time:        { value: 0 },
  u_strength:    { value: 0 },   // scroll velocity proxy
};

// PER-ELEMENT — unique per mesh
// Set when creating each mesh
{
  u_texture: { value: texture },          // each element's own image
  u_domXY:   { value: new THREE.Vector2() }, // element position (updated each frame)
  u_domWH:   { value: new THREE.Vector2() }, // element dimensions
  u_id:      { value: i },               // unique ID for shader variation
  u_rands:   { value: new THREE.Vector4() }, // random seeds for effects
}
```

```js
// When creating a ShaderMaterial, merge both:
new THREE.ShaderMaterial({
  uniforms: {
    // Spread per-element
    u_texture: { value: texture },
    u_domXY: { value: new THREE.Vector2(0, 0) },
    u_domWH: { value: new THREE.Vector2(1, 1) },
    u_id: { value: i },
    u_rands: { value: new THREE.Vector4() },
    // Reference shared (updating the source updates ALL materials)
    u_resolution: sharedUniforms.u_resolution,
    u_scrollOffset: sharedUniforms.u_scrollOffset,
    u_time: sharedUniforms.u_time,
    u_strength: sharedUniforms.u_strength,
  },
  vertexShader,
  fragmentShader,
});
```

### 2.4 Shared Geometry

All elements use the same `PlaneGeometry`. Three.js meshes share the geometry object — it is uploaded to the GPU once.

```js
// Create ONCE
const geometry = new THREE.PlaneGeometry(1, 1);

// Reuse for EVERY mesh
for (const el of domElements) {
  const mesh = new THREE.Mesh(geometry, new THREE.ShaderMaterial({ ... }));
  scene.add(mesh);
}
```

The vertex shader handles all sizing/positioning via uniforms, so a unit plane `(1×1)` is sufficient for every element.

---

## 3. Adding Elements in Different Page Sections

### 3.1 HTML — Placing WebGL Placeholders

Any `div` with the target class becomes a WebGL element. It must have explicit dimensions (aspect-ratio, width, height, or a combination) so `getBoundingClientRect()` returns real pixel values.

```html
<div id="wrapper">
  <canvas id="canvas"></canvas>

  <!-- HERO — full-width banner -->
  <section id="hero">
    <div
      class="webgl-element"
      data-shader="default"
      data-src="/images/hero.webp"
      style="width:100%; aspect-ratio:16/9;"
    ></div>
    <h1>Welcome</h1>
  </section>

  <!-- MID-PAGE — two side-by-side elements -->
  <section id="gallery">
    <div style="display:flex; gap:20px;">
      <div
        class="webgl-element"
        data-shader="glitch"
        data-src="/images/a.webp"
        style="flex:1; aspect-ratio:3/4;"
      ></div>
      <div
        class="webgl-element"
        data-shader="wave"
        data-src="/images/b.webp"
        style="flex:1; aspect-ratio:3/4;"
      ></div>
    </div>
  </section>

  <!-- STICKY SECTION — element inside a sticky container -->
  <section id="sticky-section" style="height:300vh;">
    <div class="sticky-inner" style="position:sticky; top:0; height:100vh;">
      <div
        class="webgl-element"
        data-shader="noise"
        data-src="/images/c.webp"
        style="width:50vw; aspect-ratio:1/1; margin:auto;"
      ></div>
    </div>
  </section>

  <!-- FOOTER HERO -->
  <section id="footer-hero">
    <div
      class="webgl-element"
      data-shader="ripple"
      data-src="/images/footer.webp"
      style="width:100%; aspect-ratio:21/9;"
    ></div>
  </section>
</div>
```

**Rules for `.webgl-element` containers:**

- Must have a computed width and height (use `aspect-ratio`, `height`, or both)
- Can be anywhere in the DOM — inside flex/grid containers, sticky sections, etc.
- Use `data-shader` and `data-src` attributes to configure per-element behavior
- The element itself stays **empty** (or contains a `<noscript>` fallback image)
- The WebGL mesh renders behind the DOM via `z-index: -1` on the canvas

### 3.2 CSS — Required Styles

```css
/* The scrollable container */
#wrapper {
  position: relative;
  overflow: hidden; /* Must clip the canvas */
}

/* The single WebGL canvas */
#canvas {
  pointer-events: none;
  position: absolute;
  left: 0;
  top: 0;
  z-index: -1;
  /* Width/height set via JS */
}

/* Every WebGL placeholder — must have explicit dimensions */
.webgl-element {
  position: relative; /* Allows absolutely positioned children */
  display: block;
  /* Add aspect-ratio or explicit height */
}

/* Optional: border/frame styling visible around the WebGL render */
.webgl-element.framed {
  border: 4px solid var(--accent-color);
}
```

### 3.3 JavaScript — Initializing Multiple Elements

```js
import * as THREE from "three";
import defaultVert from "../shaders/default.vert?raw";
import defaultFrag from "../shaders/default.frag?raw";
import glitchFrag from "../shaders/glitch.frag?raw";
import waveFrag from "../shaders/wave.frag?raw";
import noiseFrag from "../shaders/noise.frag?raw";

// Map shader names (from data-shader) to fragment shader strings
const SHADER_MAP = {
  default: defaultFrag,
  glitch: glitchFrag,
  wave: waveFrag,
  noise: noiseFrag,
  ripple: noiseFrag, // reuse with different uniforms
};

function createWebGLElements() {
  const elements = document.querySelectorAll(".webgl-element");
  const textureLoader = new THREE.TextureLoader();

  elements.forEach((el, i) => {
    const shaderName = el.dataset.shader || "default";
    const src = el.dataset.src || `/images/${i}.webp`;

    const texture = textureLoader.load(src);
    texture.minFilter = THREE.LinearFilter; // Avoid mipmaps for DOM-sized elements
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    const mesh = new THREE.Mesh(
      geometry, // shared PlaneGeometry(1,1)
      new THREE.ShaderMaterial({
        uniforms: {
          // Per-element
          u_texture: { value: texture },
          u_domXY: { value: new THREE.Vector2(0, 0) },
          u_domWH: { value: new THREE.Vector2(1, 1) },
          u_id: { value: i },
          u_rands: {
            value: new THREE.Vector4(
              Math.random(),
              Math.random(),
              Math.random(),
              Math.random(),
            ),
          },
          // Custom per-shader params
          u_progress: { value: 0.0 },
          u_hover: { value: 0.0 },
          // Shared (by reference)
          u_resolution: sharedUniforms.u_resolution,
          u_scrollOffset: sharedUniforms.u_scrollOffset,
          u_time: sharedUniforms.u_time,
          u_strength: sharedUniforms.u_strength,
        },
        vertexShader: defaultVert, // Same vertex shader for all
        fragmentShader: SHADER_MAP[shaderName],
        transparent: true, // Enable if using alpha
        side: THREE.DoubleSide,
      }),
    );

    mesh.frustumCulled = false; // We do manual culling
    scene.add(mesh);

    itemList.push({ domContainer: el, mesh, x: 0, y: 0, width: 0, height: 0 });
  });
}
```

### 3.4 Handling Elements in Sticky Containers

Sticky elements change their relationship to the scroll position. Use `getBoundingClientRect()` **every frame** (not cached) for sticky elements:

```js
function updateMeshPositions() {
  for (const item of itemList) {
    const rect = item.domContainer.getBoundingClientRect();
    const isSticky = item.domContainer.closest("[data-sticky]") !== null;

    if (isSticky) {
      // For sticky elements, position is viewport-relative; use scrollY=0 equivalent
      item.x = rect.left + window.scrollX;
      item.y = rect.top + window.scrollY; // This changes as sticky engages
    } else {
      // For normal elements, document-space position is stable; only read on resize
      item.x = rect.left + scrollOffset.x;
      item.y = rect.top + scrollOffset.y;
    }

    item.width = rect.width;
    item.height = rect.height;
    item.mesh.material.uniforms.u_domWH.value.set(item.width, item.height);
  }
}
```

**Key rule:** Normal (non-sticky) elements only need `getBoundingClientRect()` on resize. Sticky elements need it every rAF frame because their position changes as scrolling progresses.

---

## 4. DOM ↔ WebGL Coordinate Mapping (The Math)

### 4.1 Coordinate Spaces

```
Document space:  (0,0) = top-left of the full page. Y increases downward.
Viewport space:  (0,0) = top-left of the visible window. Changes with scroll.
Canvas space:    (0,0) = top-left of the canvas element. With padding, canvas top is above viewport top.
NDC (GPU):       (-1,-1) = bottom-left, (1,1) = top-right. Y is FLIPPED vs DOM.
```

### 4.2 The Vertex Shader Explained

```glsl
uniform vec2 u_resolution;    // Canvas pixel size (e.g., 1440 × 900 + padding)
uniform vec2 u_scrollOffset;  // (scrollX, scrollY - paddingOffset)
uniform vec2 u_domXY;         // Element top-left in DOCUMENT space (from JS)
uniform vec2 u_domWH;         // Element width × height in pixels
varying vec2 v_uv;

void main() {
    // Step 1: Convert from document space to canvas space
    // Subtract scroll offset to get position relative to canvas top-left
    vec2 pixelXY = u_domXY - u_scrollOffset;

    // Step 2: Move to element center (PlaneGeometry goes from -0.5 to 0.5)
    pixelXY += u_domWH * 0.5;

    // Step 3: Flip Y axis (DOM: Y↓, WebGL: Y↑)
    pixelXY.y = u_resolution.y - pixelXY.y;

    // Step 4: Scale by element size (position.xy is in [-0.5, 0.5])
    pixelXY += position.xy * u_domWH;

    // Step 5: Convert pixel coords → NDC [-1, 1]
    vec2 xy = pixelXY / u_resolution * 2.0 - 1.0;

    // Pass UV to fragment shader
    v_uv = uv;

    gl_Position = vec4(xy, 0.0, 1.0);
}
```

### 4.3 JavaScript Side — Computing u_domXY

```js
function updateItemPositions() {
  for (const item of itemList) {
    const rect = item.domContainer.getBoundingClientRect();

    // getBoundingClientRect gives VIEWPORT-relative coords
    // Add scroll to get DOCUMENT-space coords
    item.x = rect.left + window.scrollX;
    item.y = rect.top + window.scrollY;
    item.width = rect.width;
    item.height = rect.height;

    // Only update WH uniform here (position uniform updated every frame)
    item.mesh.material.uniforms.u_domWH.value.set(item.width, item.height);
  }
}

// In animate():
function updateMeshes() {
  const canvasTop = scrollOffset.y;
  const canvasBottom = canvasTop + resolution.y;

  for (const item of itemList) {
    // Push current document-space position to shader
    item.mesh.material.uniforms.u_domXY.value.set(item.x, item.y);

    // Frustum culling — hide meshes outside the current canvas render area
    const inView = item.y + item.height > canvasTop && item.y < canvasBottom;
    item.mesh.visible = inView;
  }
}
```

### 4.4 UV Coordinates for Proper Image Aspect Ratio

The DOM element and the texture may have different aspect ratios. Use the fragment shader to handle this (cover behavior, like `object-fit: cover`):

```glsl
// In fragment shader — cover the element with the texture
vec2 coverUV(vec2 uv, vec2 elementSize, vec2 textureSize) {
    float elementAspect = elementSize.x / elementSize.y;
    float textureAspect = textureSize.x / textureSize.y;

    vec2 scale = vec2(1.0);
    if (elementAspect > textureAspect) {
        scale.y = textureAspect / elementAspect;
    } else {
        scale.x = elementAspect / textureAspect;
    }

    return (uv - 0.5) * scale + 0.5;
}

// Usage:
vec2 uv = coverUV(v_uv, u_domWH, u_textureSize);
vec4 color = texture2D(u_texture, uv);
```

```js
// Pass texture natural size as uniform
texture.onload = () => {
  mesh.material.uniforms.u_textureSize.value.set(
    texture.image.naturalWidth,
    texture.image.naturalHeight,
  );
};
// Or after TextureLoader:
const texture = textureLoader.load(src, (tex) => {
  mesh.material.uniforms.u_textureSize.value.set(
    tex.image.width,
    tex.image.height,
  );
});
```

---

## 5. Custom Shaders — Vertex & Fragment

### 5.1 Vertex Shader — The Universal DOM Projector

The vertex shader is **the same for every element type**. It handles the DOM→NDC math. Custom visual behavior all goes in the fragment shader.

**`src/shaders/dom-project.vert`**

```glsl
uniform vec2 u_resolution;
uniform vec2 u_scrollOffset;
uniform vec2 u_domXY;
uniform vec2 u_domWH;
// Optional: scroll-driven distortion
uniform float u_strength;

varying vec2 v_uv;
varying vec2 v_pixelCoord; // For fragment shader calculations

void main() {
    vec2 pixelXY = u_domXY - u_scrollOffset + u_domWH * 0.5;
    pixelXY.y = u_resolution.y - pixelXY.y;
    pixelXY += position.xy * u_domWH;

    // Optional: wave distortion on Y during scroll
    // pixelXY.y += sin(position.x * 3.14159 + u_time * 2.0) * u_strength * 20.0;

    vec2 xy = pixelXY / u_resolution * 2.0 - 1.0;
    v_uv = uv;
    v_pixelCoord = pixelXY;
    gl_Position = vec4(xy, 0.0, 1.0);
}
```

### 5.2 Fragment Shader Types

#### A) Default — Image Display with Scroll Distortion (existing in repo)

**`src/shaders/glitch.frag`**

```glsl
uniform sampler2D u_texture;
uniform vec4 u_rands;
uniform float u_strength;
uniform float u_time;
uniform float u_id;

varying vec2 v_uv;

#define NUM_SAMPLES 5

vec4 hash43(vec3 p) {
    vec4 p4 = fract(vec4(p.xyzx) * vec4(.1031, .1030, .0973, .1099));
    p4 += dot(p4, p4.wzxy + 33.33);
    return fract((p4.xxyz + p4.yzzw) * p4.zywx);
}

void main() {
    vec4 noises = hash43(vec3(gl_FragCoord.xy, u_id));
    vec4 rands = hash43(vec3(
        floor(sin(v_uv.x * 2.0 + u_rands.x * 6.283) * mix(3., 40., u_rands.y)) * 30.0,
        u_id, u_rands.z
    ));

    vec2 uvOffset = vec2(0.0, (rands.x - 0.5) * 0.5 * (rands.y > 0.7 ? 1.0 : 0.0))
                    / float(NUM_SAMPLES) * (0.05 + u_strength * 0.3);

    vec2 uv = v_uv + noises.xy * uvOffset;
    vec3 color = vec3(0.0);

    for (int i = 0; i < NUM_SAMPLES; i++) {
        color += texture2D(u_texture, uv).rgb;
        uv += uvOffset;
    }

    color /= float(NUM_SAMPLES);
    gl_FragColor = vec4(color * (1.0 + u_strength * 2.0), 1.0);
}
```

#### B) Wave Distortion

**`src/shaders/wave.frag`**

```glsl
uniform sampler2D u_texture;
uniform float u_strength;
uniform float u_time;
uniform vec2 u_domWH;

varying vec2 v_uv;

void main() {
    float amplitude = u_strength * 0.04;
    float frequency = 8.0;

    vec2 uv = v_uv;
    uv.x += sin(uv.y * frequency + u_time * 3.0) * amplitude;
    uv.y += sin(uv.x * frequency * 0.5 + u_time * 2.0) * amplitude * 0.5;

    // Clamp UV to prevent texture bleeding
    uv = clamp(uv, 0.001, 0.999);

    vec4 color = texture2D(u_texture, uv);
    gl_FragColor = color;
}
```

#### C) RGB Chromatic Aberration Split

**`src/shaders/chromatic.frag`**

```glsl
uniform sampler2D u_texture;
uniform float u_strength;

varying vec2 v_uv;

void main() {
    float offset = u_strength * 0.02;

    float r = texture2D(u_texture, v_uv + vec2( offset, 0.0)).r;
    float g = texture2D(u_texture, v_uv).g;
    float b = texture2D(u_texture, v_uv + vec2(-offset, 0.0)).b;
    float a = texture2D(u_texture, v_uv).a;

    gl_FragColor = vec4(r, g, b, a);
}
```

#### D) Scroll-Driven Reveal (Clip from bottom)

**`src/shaders/reveal.frag`**

```glsl
uniform sampler2D u_texture;
uniform float u_progress; // 0 = hidden, 1 = fully revealed
uniform float u_strength;
uniform float u_time;

varying vec2 v_uv;

// Smooth noise for organic edge
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float smoothNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
    );
}

void main() {
    vec4 color = texture2D(u_texture, v_uv);

    // Organic reveal threshold with noise
    float noise = smoothNoise(vec2(v_uv.x * 5.0, u_time * 0.5)) * 0.1;
    float threshold = v_uv.y + noise;
    float reveal = smoothstep(1.0 - u_progress + 0.05, 1.0 - u_progress - 0.05, threshold);

    color.a *= reveal;
    gl_FragColor = color;
}
```

#### E) SDF Background Pattern (No texture required)

**`src/shaders/sdf-bg.frag`**

```glsl
uniform float u_time;
uniform float u_strength;
uniform vec2 u_domWH;
uniform vec3 u_color1;  // Custom color uniform
uniform vec3 u_color2;

varying vec2 v_uv;

float sdfCircle(vec2 p, float r) {
    return length(p) - r;
}

float sdfBox(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

void main() {
    vec2 uv = v_uv * 2.0 - 1.0;
    // Correct for aspect ratio
    uv.x *= u_domWH.x / u_domWH.y;

    // Animated SDF
    float t = u_time * 0.5;
    float d = sdfCircle(uv + vec2(sin(t) * 0.3, cos(t) * 0.2), 0.5 + u_strength * 0.1);
    float mask = smoothstep(0.01, -0.01, d);

    vec3 color = mix(u_color1, u_color2, mask);
    gl_FragColor = vec4(color, 1.0);
}
```

### 5.3 Assigning Different Shaders Per Element

```js
// shader-registry.js
import defaultVert from "./shaders/dom-project.vert?raw";
import glitchFrag from "./shaders/glitch.frag?raw";
import waveFrag from "./shaders/wave.frag?raw";
import chromaticFrag from "./shaders/chromatic.frag?raw";
import revealFrag from "./shaders/reveal.frag?raw";
import sdfBgFrag from "./shaders/sdf-bg.frag?raw";

export const VERTEX_SHADER = defaultVert;

export const FRAGMENT_SHADERS = {
  glitch: glitchFrag,
  wave: waveFrag,
  chromatic: chromaticFrag,
  reveal: revealFrag,
  "sdf-bg": sdfBgFrag,
};

// Default uniforms per shader type (merged with shared uniforms)
export const SHADER_DEFAULTS = {
  glitch: { u_rands: { value: new THREE.Vector4() } },
  wave: {},
  chromatic: {},
  reveal: { u_progress: { value: 0.0 } },
  "sdf-bg": {
    u_color1: { value: new THREE.Color("#1a0030") },
    u_color2: { value: new THREE.Color("#ff6b6b") },
  },
};
```

```js
// In createWebGLElements():
import {
  VERTEX_SHADER,
  FRAGMENT_SHADERS,
  SHADER_DEFAULTS,
} from "./shader-registry.js";

function createMaterial(shaderName, texture, index) {
  const fragmentShader =
    FRAGMENT_SHADERS[shaderName] || FRAGMENT_SHADERS.glitch;
  const extraUniforms = SHADER_DEFAULTS[shaderName] || {};

  return new THREE.ShaderMaterial({
    uniforms: {
      u_texture: { value: texture },
      u_domXY: { value: new THREE.Vector2() },
      u_domWH: { value: new THREE.Vector2() },
      u_id: { value: index },
      // Shared
      u_resolution: sharedUniforms.u_resolution,
      u_scrollOffset: sharedUniforms.u_scrollOffset,
      u_time: sharedUniforms.u_time,
      u_strength: sharedUniforms.u_strength,
      // Shader-specific extras
      ...extraUniforms,
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
  });
}
```

### 5.4 Hot Shader Reloading in Vite (Dev Only)

```js
// main.js — dev only
if (import.meta.hot) {
  import.meta.hot.accept("../shaders/glitch.frag?raw", (newModule) => {
    // Update all meshes using this shader
    for (const item of itemList) {
      if (item.shaderName === "glitch") {
        item.mesh.material.fragmentShader = newModule.default;
        item.mesh.material.needsUpdate = true;
      }
    }
  });
}
```

---

## 6. Performance — Preload, Dispose, Culling & More

### 6.1 Texture Preloading with LoadingManager

Never let textures "pop in" after the page is interactive. Use `THREE.LoadingManager` to gate the first render:

```js
function preloadAssets(onComplete) {
  const manager = new THREE.LoadingManager(
    // onLoad — all assets ready
    () => {
      console.log("All textures loaded");
      onComplete();
    },
    // onProgress
    (url, loaded, total) => {
      const progress = loaded / total;
      document.querySelector("#loading-bar").style.width = `${progress * 100}%`;
    },
    // onError
    (url) => {
      console.error(`Failed to load: ${url}`);
    },
  );

  const loader = new THREE.TextureLoader(manager);
  const elements = document.querySelectorAll(".webgl-element");

  const textures = [];
  elements.forEach((el, i) => {
    const src = el.dataset.src || `/images/${i}.webp`;
    const texture = loader.load(src);
    texture.minFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    textures.push(texture);
  });

  return textures;
}

// Usage:
async function init() {
  setupThreeJS();

  // Preload all textures, then create meshes and start rendering
  preloadAssets((textures) => {
    createWebGLElements(textures);
    setupEventListeners();
    animate();
  });
}
```

### 6.2 Dispose — Cleaning Up GPU Memory

Critical when navigating between pages (SPAs) or removing WebGL elements dynamically. Failing to dispose causes memory leaks on the GPU.

```js
/**
 * Dispose a single item (mesh + material + texture)
 */
function disposeItem(item) {
  scene.remove(item.mesh);

  // Geometry — only dispose if NOT shared
  // (If using shared geometry, DON'T dispose here)
  // item.mesh.geometry.dispose();

  // Dispose the material
  if (item.mesh.material) {
    // Dispose each texture in the material's uniforms
    const uniforms = item.mesh.material.uniforms;
    for (const key in uniforms) {
      if (uniforms[key].value instanceof THREE.Texture) {
        uniforms[key].value.dispose();
      }
    }
    item.mesh.material.dispose();
  }
}

/**
 * Full teardown — call on page unmount / SPA route change
 */
function dispose() {
  // Cancel animation loop
  cancelAnimationFrame(rafId);

  // Remove event listeners
  window.removeEventListener("resize", onResize);

  // Dispose all items
  for (const item of itemList) {
    disposeItem(item);
  }
  itemList.length = 0;

  // Dispose shared geometry
  geometry.dispose();

  // Dispose renderer (releases WebGL context)
  renderer.dispose();

  // Optional: force context loss to free GPU memory immediately
  renderer.forceContextLoss();
}
```

### 6.3 Frustum Culling (Per-Frame Visibility Optimization)

The repo already implements this. Here's the fully commented version:

```js
function updateMeshes() {
  // Current canvas render window in document space
  const canvasTop = scrollOffset.y;
  const canvasBottom = canvasTop + resolution.y;

  for (const item of itemList) {
    // Push document-space position to vertex shader
    item.mesh.material.uniforms.u_domXY.value.set(item.x, item.y);

    // Skip GPU draw call entirely if outside canvas bounds
    // item.y = element top, item.y + item.height = element bottom
    const elementBottom = item.y + item.height;
    const elementTop = item.y;

    item.mesh.visible = elementBottom > canvasTop && elementTop < canvasBottom;

    // Only update expensive uniforms for visible items
    if (item.mesh.visible) {
      updateItemEffects(item);
    }
  }
}
```

### 6.4 Resize Debouncing

`onResize` calls `getBoundingClientRect()` for every element — expensive. Debounce it:

```js
let resizeTimer = null;

function onResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    _onResize();
  }, 100); // 100ms debounce
}

function _onResize() {
  viewportWidth = window.innerWidth;
  viewportHeight = window.innerHeight;
  const canvasH = viewportHeight * (1 + PADDING * 2);

  resolution.set(viewportWidth, canvasH);
  renderer.setSize(viewportWidth * dpr, canvasH * dpr);
  canvas.style.width = `${viewportWidth}px`;
  canvas.style.height = `${canvasH}px`;

  scrollOffset.set(window.scrollX, window.scrollY - viewportHeight * PADDING);
  updateItemPositions(); // getBoundingClientRect for all items
}
```

### 6.5 ResizeObserver for Individual Elements

For elements that change size independently (e.g., in responsive grids), use a `ResizeObserver`:

```js
const ro = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const item = itemList.find((i) => i.domContainer === entry.target);
    if (!item) continue;

    const rect = entry.target.getBoundingClientRect();
    item.width = rect.width;
    item.height = rect.height;
    item.x = rect.left + window.scrollX;
    item.y = rect.top + window.scrollY;
    item.mesh.material.uniforms.u_domWH.value.set(item.width, item.height);
  }
});

// Observe each element
for (const item of itemList) {
  ro.observe(item.domContainer);
}
```

### 6.6 Texture Atlases (Advanced)

For many small elements (icons, thumbnails), pack them into a single texture and use UV offsets:

```js
// Assume atlas is a single 4096×4096 texture with 4 images in a 2×2 grid
const atlasTexture = textureLoader.load("/images/atlas.webp");

// Per-mesh UV region (normalized 0–1 coords in the atlas)
const UV_REGIONS = [
  [0.0, 0.5, 0.5, 1.0], // image 0: [u0, v0, u1, v1]
  [0.5, 0.5, 1.0, 1.0], // image 1
  [0.0, 0.0, 0.5, 0.5], // image 2
  [0.5, 0.0, 1.0, 0.5], // image 3
];

// In the fragment shader:
// uniform vec4 u_uvRegion; // x=u0, y=v0, z=u1, w=v1
// vec2 atlasUV = mix(u_uvRegion.xy, u_uvRegion.zw, v_uv);
// vec4 color = texture2D(u_atlas, atlasUV);
```

### 6.7 Skipping Renders When Nothing Changed

```js
let lastScrollY = -1;
let forceRender = true;

function animate() {
  rafId = requestAnimationFrame(animate);

  const scrollY = window.scrollY;
  const hasScrolled = scrollY !== lastScrollY;
  const hasTimeEffect = sharedUniforms.u_strength.value > 0.001;

  // Skip render if page is idle and no time-based effects running
  if (!hasScrolled && !hasTimeEffect && !forceRender) return;

  forceRender = false;
  lastScrollY = scrollY;

  // ... rest of animate
  renderer.render(scene, camera);
}

// Force a render on next frame (e.g., after resize)
function requestRender() {
  forceRender = true;
}
```

### 6.8 Pixel Ratio Cap

High-DPR screens (3×, 4×) dramatically increase fill rate. Cap at 2×:

```js
const dpr = Math.min(window.devicePixelRatio, 2);
renderer.setPixelRatio(dpr);
```

---

## 7. Interaction Patterns — Hover, Click, Scroll-Driven

### 7.1 Hover Effect via DOM Events

Use DOM `mousemove` on each `.webgl-element` — no raycasting needed:

```js
function setupHoverEffects() {
  for (const item of itemList) {
    item.mesh.material.uniforms.u_hover = { value: 0.0 };
    let hoverTarget = 0;
    let hoverCurrent = 0;

    item.domContainer.addEventListener("mouseenter", () => {
      hoverTarget = 1;
    });
    item.domContainer.addEventListener("mouseleave", () => {
      hoverTarget = 0;
    });

    // Smooth hover value updated in animate()
    item.updateHover = (dt) => {
      hoverCurrent += (hoverTarget - hoverCurrent) * Math.min(1, dt * 6);
      item.mesh.material.uniforms.u_hover.value = hoverCurrent;
    };
  }
}

// In animate():
for (const item of itemList) {
  if (item.updateHover) item.updateHover(dt);
}
```

Fragment shader usage:

```glsl
uniform float u_hover;
// ...
vec2 uv = v_uv;
uv += (uv - 0.5) * u_hover * 0.05; // Slight zoom on hover
vec4 color = texture2D(u_texture, uv);
gl_FragColor = color;
```

### 7.2 Mouse Position in UV Space

```js
item.domContainer.addEventListener("mousemove", (e) => {
  const rect = item.domContainer.getBoundingClientRect();
  const uvX = (e.clientX - rect.left) / rect.width;
  const uvY = (e.clientY - rect.top) / rect.height;
  item.mesh.material.uniforms.u_mouse.value.set(uvX, 1.0 - uvY); // flip Y
});
```

Fragment shader usage:

```glsl
uniform vec2 u_mouse; // UV-space mouse position

float dist = distance(v_uv, u_mouse);
float ripple = sin(dist * 30.0 - u_time * 5.0) * 0.5 + 0.5;
float mask = smoothstep(0.3, 0.0, dist);
vec4 color = texture2D(u_texture, v_uv + (v_uv - u_mouse) * ripple * mask * 0.02);
gl_FragColor = color;
```

### 7.3 Scroll-Driven Progress Per Element

Track how much each element has progressed through the viewport:

```js
function updateScrollProgress() {
  for (const item of itemList) {
    // 0 = element bottom just entered viewport bottom
    // 1 = element top just left viewport top
    const elementCenter = item.y + item.height * 0.5;
    const viewportCenter = window.scrollY + window.innerHeight * 0.5;
    const maxDistance = window.innerHeight * 0.5 + item.height * 0.5;

    const rawProgress = 1.0 - (elementCenter - viewportCenter) / maxDistance;
    const progress = Math.max(0, Math.min(1, rawProgress));

    if (item.mesh.material.uniforms.u_progress) {
      item.mesh.material.uniforms.u_progress.value = progress;
    }
  }
}
```

### 7.4 Avoiding Scroll-Jacking — The Golden Rules

```
✅ DO:
  - Use window.scrollY to read scroll position (passive, non-blocking)
  - Use { passive: true } on scroll event listeners
  - Let native scroll run freely; only READ the scroll position in rAF
  - Use IntersectionObserver for enter/leave detection
  - Use requestAnimationFrame for all animation updates

❌ DO NOT:
  - Call event.preventDefault() on scroll, wheel, or touchmove events
  - Set overflow: hidden on <body> or <html> to control scroll
  - Use transform: translate on <body> (Locomotive Scroll old pattern)
  - Animate window.scrollTo() to simulate scroll movement
  - Use pointer-events on the canvas (keep pointer-events: none)
```

```js
// Correct: passive scroll listener (read-only)
window.addEventListener("scroll", onScroll, { passive: true });

// Correct: read scroll in rAF, not in scroll handler
function animate() {
  requestAnimationFrame(animate);
  const scrollY = window.scrollY; // Read current value
  // ... update uniforms
}

// WRONG: intercepting scroll
window.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault(); // ❌ This is scroll-jacking!
    // ...
  },
  { passive: false },
);
```

---

## 8. Smooth Scroll Library Integration

### 8.1 Lenis (Recommended)

[Lenis](https://github.com/darkroomengineering/lenis) provides smooth scroll without hijacking native scroll. It provides a `scroll` value you use instead of `window.scrollY`.

```js
import Lenis from "lenis";

const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
});

let lenisScrollY = 0;

lenis.on("scroll", ({ scroll, limit, velocity, direction, progress }) => {
  lenisScrollY = scroll; // Use this instead of window.scrollY
});

// Integrate Lenis with your rAF loop
function animate(time) {
  rafId = requestAnimationFrame(animate);

  lenis.raf(time); // Must be called each frame

  // Use lenisScrollY everywhere instead of window.scrollY
  const scrollY = lenisScrollY;
  const scrollDelta = scrollY - prevScrollY;

  updateStrength(scrollDelta, dt);

  // Update scroll offset using Lenis scroll value
  scrollOffset.set(window.scrollX, scrollY - viewportHeight * PADDING);

  // Canvas transform uses Lenis scroll
  canvas.style.transform = `translate(0px, ${scrollY - viewportHeight * PADDING}px)`;

  renderer.render(scene, camera);
  prevScrollY = scrollY;
}
```

### 8.2 GSAP ScrollTrigger Integration

```js
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

// Control a reveal shader via ScrollTrigger
for (const item of itemList) {
  if (item.shaderName !== "reveal") continue;

  ScrollTrigger.create({
    trigger: item.domContainer,
    start: "top 80%",
    end: "bottom 20%",
    onUpdate: (self) => {
      item.mesh.material.uniforms.u_progress.value = self.progress;
    },
  });
}

// Use GSAP's ticker instead of your own rAF for proper integration
gsap.ticker.add((time, deltaTime) => {
  const dt = deltaTime / 1000;
  // ... your update logic
  renderer.render(scene, camera);
});
gsap.ticker.lagSmoothing(0);
```

---

## 9. Full Annotated Code Reference

### 9.1 Complete main.js (Expanded Architecture)

```js
import * as THREE from "three";
import {
  VERTEX_SHADER,
  FRAGMENT_SHADERS,
  SHADER_DEFAULTS,
} from "./shader-registry.js";

// ─── DOM ──────────────────────────────────────────────────────────────────────
const domWrapper = document.getElementById("wrapper");
let canvas;

// ─── THREE.JS CORE ────────────────────────────────────────────────────────────
let scene, camera, renderer, geometry;
let rafId;

// ─── RENDER STATE ─────────────────────────────────────────────────────────────
let time = 0;
let prevScrollY = 0;
let strength = 0;
let viewportWidth, viewportHeight;
const PADDING = 0.25; // 25% — adjust to taste; 0 to disable

// ─── SHARED UNIFORMS (by reference — one update affects ALL materials) ────────
const resolution = new THREE.Vector2(1, 1);
const scrollOffset = new THREE.Vector2(0, 0);
const sharedUniforms = {
  u_resolution: { value: resolution },
  u_scrollOffset: { value: scrollOffset },
  u_time: { value: 0 },
  u_strength: { value: 0 },
};

// ─── ITEM LIST ────────────────────────────────────────────────────────────────
const itemList = []; // [{ domContainer, mesh, x, y, width, height, shaderName, updateHover? }]

// ─── INIT ─────────────────────────────────────────────────────────────────────
function init() {
  setupThreeJS();
  preloadAndCreateElements();
  setupEventListeners();
  time = performance.now() / 1000;
  prevScrollY = window.scrollY;
}

function setupThreeJS() {
  canvas = document.querySelector("#canvas");
  scene = new THREE.Scene();
  camera = new THREE.Camera(); // Identity camera — NDC maps 1:1 to screen
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap DPR at 2
  geometry = new THREE.PlaneGeometry(1, 1); // Shared by all meshes
}

function preloadAndCreateElements() {
  const elements = document.querySelectorAll(".webgl-element");
  const manager = new THREE.LoadingManager(() => {
    // All textures loaded — now create meshes and start rendering
    createMeshes(elements, textures);
    animate(); // Start loop only after assets are ready
  });

  const loader = new THREE.TextureLoader(manager);
  const textures = [];

  elements.forEach((el, i) => {
    const src = el.dataset.src || `/images/${i}.webp`;
    const tex = loader.load(src);
    tex.minFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    textures.push(tex);
  });
}

function createMeshes(elements, textures) {
  elements.forEach((el, i) => {
    const shaderName = el.dataset.shader || "glitch";
    const fragShader = FRAGMENT_SHADERS[shaderName] || FRAGMENT_SHADERS.glitch;
    const extras = SHADER_DEFAULTS[shaderName] || {};

    const material = new THREE.ShaderMaterial({
      uniforms: {
        u_texture: { value: textures[i] },
        u_domXY: { value: new THREE.Vector2(0, 0) },
        u_domWH: { value: new THREE.Vector2(1, 1) },
        u_id: { value: i },
        u_rands: {
          value: new THREE.Vector4(
            Math.random(),
            Math.random(),
            Math.random(),
            Math.random(),
          ),
        },
        ...extras,
        // Shared (by reference)
        u_resolution: sharedUniforms.u_resolution,
        u_scrollOffset: sharedUniforms.u_scrollOffset,
        u_time: sharedUniforms.u_time,
        u_strength: sharedUniforms.u_strength,
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: fragShader,
      transparent: true,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false; // We do manual culling in updateMeshes
    scene.add(mesh);

    itemList.push({
      domContainer: el,
      mesh,
      shaderName,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    });
  });

  // Initial position calculation
  onResize();
  setupHoverEffects();
}

// ─── RESIZE ───────────────────────────────────────────────────────────────────
let resizeTimer = null;

function onResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(_onResize, 100);
}

function _onResize() {
  viewportWidth = domWrapper.clientWidth;
  viewportHeight = window.innerHeight;

  const canvasHeight = viewportHeight * (1 + PADDING * 2);
  const dpr = Math.min(window.devicePixelRatio, 2);

  resolution.set(viewportWidth, canvasHeight);
  renderer.setSize(viewportWidth * dpr, canvasHeight * dpr);
  canvas.style.width = `${viewportWidth}px`;
  canvas.style.height = `${canvasHeight}px`;

  scrollOffset.set(window.scrollX, window.scrollY - viewportHeight * PADDING);
  updateItemPositions();
}

function updateItemPositions() {
  for (const item of itemList) {
    const rect = item.domContainer.getBoundingClientRect();
    item.x = rect.left + scrollOffset.x;
    item.y = rect.top + scrollOffset.y;
    item.width = rect.width;
    item.height = rect.height;
    item.mesh.material.uniforms.u_domWH.value.set(item.width, item.height);
  }
}

// ─── ANIMATION LOOP ───────────────────────────────────────────────────────────
function animate() {
  rafId = requestAnimationFrame(animate);

  const scrollY = window.scrollY;
  const scrollDelta = scrollY - prevScrollY;
  const newTime = performance.now() / 1000;
  const dt = Math.min(newTime - time, 0.1); // Cap dt to avoid jumps
  time = newTime;

  // Update strength (scroll velocity → exponential decay)
  const targetStrength = (Math.abs(scrollDelta) * 10) / viewportHeight;
  strength *= Math.exp(-dt * 10);
  strength += Math.min(targetStrength, 5);

  // Update shared uniforms
  sharedUniforms.u_time.value += dt;
  sharedUniforms.u_strength.value = Math.min(1, strength);
  scrollOffset.set(window.scrollX, scrollY - viewportHeight * PADDING);

  // Position canvas
  canvas.style.transform = `translate(${scrollOffset.x}px, ${scrollOffset.y}px)`;

  // Per-mesh updates
  updateMeshes(dt, scrollY);

  renderer.render(scene, camera);
  prevScrollY = scrollY;
}

function updateMeshes(dt, scrollY) {
  const canvasTop = scrollOffset.y;
  const canvasBottom = canvasTop + resolution.y;

  for (const item of itemList) {
    item.mesh.material.uniforms.u_domXY.value.set(item.x, item.y);

    // Update scroll progress if shader supports it
    if (item.mesh.material.uniforms.u_progress) {
      const center = item.y + item.height * 0.5;
      const vpCenter = scrollY + viewportHeight * 0.5;
      const maxDist = viewportHeight * 0.5 + item.height * 0.5;
      const progress = Math.max(
        0,
        Math.min(1, 1.0 - (center - vpCenter) / maxDist),
      );
      item.mesh.material.uniforms.u_progress.value = progress;
    }

    // Randomize rands when visible
    if (
      item.mesh.visible &&
      Math.random() > Math.exp(-dt * 25 * (1 + strength))
    ) {
      item.mesh.material.uniforms.u_rands.value.set(
        Math.random(),
        Math.random(),
        Math.random(),
        Math.random(),
      );
    }

    // Hover lerp
    if (item.updateHover) item.updateHover(dt);

    // Frustum cull
    item.mesh.visible =
      item.y + item.height > canvasTop && item.y < canvasBottom;
  }
}

// ─── HOVER ────────────────────────────────────────────────────────────────────
function setupHoverEffects() {
  for (const item of itemList) {
    if (!item.mesh.material.uniforms.u_hover) {
      item.mesh.material.uniforms.u_hover = { value: 0.0 };
    }

    let hoverTarget = 0;
    let hoverCurrent = 0;

    item.domContainer.addEventListener("mouseenter", () => {
      hoverTarget = 1;
    });
    item.domContainer.addEventListener("mouseleave", () => {
      hoverTarget = 0;
    });

    item.updateHover = (dt) => {
      hoverCurrent += (hoverTarget - hoverCurrent) * Math.min(1, dt * 6);
      item.mesh.material.uniforms.u_hover.value = hoverCurrent;
    };
  }
}

// ─── EVENT LISTENERS ──────────────────────────────────────────────────────────
function setupEventListeners() {
  window.addEventListener("resize", onResize);
  if (window.ResizeObserver) {
    new ResizeObserver(onResize).observe(domWrapper);
  }
}

// ─── DISPOSE (call on page teardown / SPA route change) ───────────────────────
export function dispose() {
  cancelAnimationFrame(rafId);
  window.removeEventListener("resize", onResize);

  for (const item of itemList) {
    scene.remove(item.mesh);
    const u = item.mesh.material.uniforms;
    for (const key in u) {
      if (u[key].value instanceof THREE.Texture) u[key].value.dispose();
    }
    item.mesh.material.dispose();
  }
  itemList.length = 0;

  geometry.dispose();
  renderer.dispose();
  renderer.forceContextLoss();
}

// ─── BOOTSTRAP ────────────────────────────────────────────────────────────────
requestAnimationFrame(init); // Wait one frame for CSS to compute
```

### 9.2 Vite Config for GLSL Shader Imports

```js
// vite.config.js
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  root: "src",
  publicDir: "../public",
  build: {
    outDir: "../build",
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "src/index.html"),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  assetsInclude: ["**/*.vert", "**/*.frag", "**/*.glsl"],
  plugins: [
    {
      // Custom plugin: import .vert/.frag files as raw strings
      name: "glsl-loader",
      transform(code, id) {
        if (/\.(vert|frag|glsl)$/.test(id)) {
          return {
            code: `export default ${JSON.stringify(code)};`,
            map: null,
          };
        }
      },
    },
  ],
});
```

With this config, import shaders as:

```js
import myShader from "./shaders/custom.frag?raw"; // ?raw forces raw string import
// OR — the plugin handles it automatically:
import myShader from "./shaders/custom.frag";
```

---

## Quick Reference Checklist

### Adding a New WebGL Element

- [ ] Add `<div class="webgl-element" data-shader="wave" data-src="/images/new.webp">` to HTML
- [ ] Ensure the div has explicit dimensions (`aspect-ratio`, `width`, `height`)
- [ ] Add the image to `public/images/`
- [ ] If using a new shader, create `src/shaders/myshader.frag` and add to `FRAGMENT_SHADERS`
- [ ] If the shader needs custom uniforms, add defaults to `SHADER_DEFAULTS`
- [ ] Test on mobile — check touch scroll behavior

### Adding a New Shader

- [ ] Create `src/shaders/myeffect.frag`
- [ ] Import and register in `shader-registry.js`
- [ ] Add any custom uniform defaults to `SHADER_DEFAULTS`
- [ ] Ensure all shared uniforms (`u_resolution`, `u_scrollOffset`, `u_time`, `u_strength`) are declared in the shader if used
- [ ] Test with `u_strength = 1` to see the scroll effect at maximum

### Before Going to Production

- [ ] Cap `devicePixelRatio` at 2
- [ ] Confirm `pointer-events: none` on canvas
- [ ] Test fast scroll — check for canvas clipping (increase PADDING if needed)
- [ ] Verify `dispose()` is called on SPA route changes
- [ ] Check GPU memory in DevTools Memory tab after multiple navigations
- [ ] Run Lighthouse — no scroll performance warnings
- [ ] Test on low-end mobile (throttle CPU in DevTools)
- [ ] Add `<noscript>` fallback images inside each `.webgl-element`

---

_Last updated: April 2026_
