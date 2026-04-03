'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// ─── Config ──────────────────────────────────────────────────
const SHADER_POINTS = 16;
const CURVE_POINTS = 80;
const CURVE_LERP = 0.5;
const RADIUS1 = 5;
const RADIUS2 = 30;
const VELOCITY_THRESHOLD = 10;
const SLEEP_RADIUS_X = 100;
const SLEEP_RADIUS_Y = 100;
const SLEEP_TIME_COEF_X = 0.0025;
const SLEEP_TIME_COEF_Y = 0.0025;

// ─── Shaders ─────────────────────────────────────────────────
const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
}
`;

const FRAG = /* glsl */ `
// Signed distance to a quadratic bezier
// https://www.shadertoy.com/view/wdy3DD
float sdBezier(vec2 pos, vec2 A, vec2 B, vec2 C) {
    vec2 a = B - A;
    vec2 b = A - 2.0*B + C;
    vec2 c = a * 2.0;
    vec2 d = A - pos;
    float kk = 1.0 / dot(b,b);
    float kx = kk * dot(a,b);
    float ky = kk * (2.0*dot(a,a)+dot(d,b)) / 3.0;
    float kz = kk * dot(d,a);
    float res = 0.0;
    float p = ky - kx*kx;
    float p3 = p*p*p;
    float q = kx*(2.0*kx*kx - 3.0*ky) + kz;
    float h = q*q + 4.0*p3;
    if(h >= 0.0){
        h = sqrt(h);
        vec2 x = (vec2(h, -h) - q) / 2.0;
        vec2 uv = sign(x)*pow(abs(x), vec2(1.0/3.0));
        float t = uv.x + uv.y - kx;
        t = clamp(t, 0.0, 1.0);
        vec2 qos = d + (c + b*t)*t;
        res = length(qos);
    } else {
        float z = sqrt(-p);
        float v = acos(q/(p*z*2.0)) / 3.0;
        float m = cos(v);
        float n = sin(v)*1.732050808;
        vec3 t = vec3(m + m, -n - m, n - m) * z - kx;
        t = clamp(t, 0.0, 1.0);
        vec2 qos = d + (c + b*t.x)*t.x;
        float dis = dot(qos,qos);
        res = dis;
        qos = d + (c + b*t.y)*t.y;
        dis = dot(qos,qos);
        res = min(res,dis);
        qos = d + (c + b*t.z)*t.z;
        dis = dot(qos,qos);
        res = min(res,dis);
        res = sqrt(res);
    }
    return res;
}

uniform vec2 uRatio;
uniform vec2 uSize;
uniform vec2 uPoints[${SHADER_POINTS}];
uniform vec3 uColor;
varying vec2 vUv;

void main() {
    float intensity = 1.0;
    vec2 pos = (vUv - 0.5) * uRatio;

    vec2 c2 = (uPoints[0] + uPoints[1]) / 2.0;
    vec2 c_prev;
    float dist = 10000.0;
    for(int i = 0; i < ${SHADER_POINTS} - 1; i++){
        c_prev = c2;
        c2 = (uPoints[i] + uPoints[i + 1]) / 2.0;
        dist = min(dist, sdBezier(pos, c_prev, uPoints[i], c2));
    }
    dist = max(0.0, dist);

    float glow = pow(uSize.y / dist, intensity);
    vec3 col = vec3(0.0);
    col += 10.0 * vec3(smoothstep(uSize.x, 0.0, dist));
    col += glow * uColor;

    // Tone mapping
    col = 1.0 - exp(-col);
    col = pow(col, vec3(0.4545));

    gl_FragColor = vec4(col, 1.0);
}
`;

// ─── Colors (project palette) ────────────────────────────────
// Cyan:    (0.0,  1.0,   1.0)
// Magenta: (1.0,  0.318, 0.98)
// Lime:    (0.792, 0.992, 0.0)

export default function NeonCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Renderer ─────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // ── Spline trail ─────────────────────────────────────────
    const points = Array.from({ length: CURVE_POINTS }, () => new THREE.Vector2());
    const spline = new THREE.SplineCurve(points);
    const velocity = new THREE.Vector3();
    const velocityTarget = new THREE.Vector3();

    // ── Uniforms ─────────────────────────────────────────────
    const uRatio = { value: new THREE.Vector2() };
    const uSize = { value: new THREE.Vector2() };
    const uPoints = {
      value: Array.from({ length: SHADER_POINTS }, () => new THREE.Vector2()),
    };
    const uColor = { value: new THREE.Color(0x00ffff) };

    // ── Mesh ─────────────────────────────────────────────────
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms: { uRatio, uSize, uPoints, uColor },
      vertexShader: VERT,
      fragmentShader: FRAG,
    });
    scene.add(new THREE.Mesh(geometry, material));

    // ── State ────────────────────────────────────────────────
    let hover = false;
    let running = true;
    let prevX = 0;
    let prevY = 0;

    // ── Resize ───────────────────────────────────────────────
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      uSize.value.set(RADIUS1, RADIUS2);
      if (w >= h) {
        uRatio.value.set(1, h / w);
        uSize.value.multiplyScalar(1 / w);
      } else {
        uRatio.value.set(w / h, 1);
        uSize.value.multiplyScalar(1 / h);
      }
    };
    onResize();

    // ── Mouse ────────────────────────────────────────────────
    const onPointerMove = (e: PointerEvent) => {
      hover = true;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const nx = (e.clientX / w) * 2 - 1;
      const ny = -((e.clientY / h) * 2 - 1);
      spline.points[0].set(
        0.5 * nx * uRatio.value.x,
        0.5 * ny * uRatio.value.y,
      );

      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      prevX = e.clientX;
      prevY = e.clientY;

      velocityTarget.x = Math.min(
        velocity.x + Math.abs(dx) / VELOCITY_THRESHOLD,
        1,
      );
      velocityTarget.y = Math.min(
        velocity.y + Math.abs(dy) / VELOCITY_THRESHOLD,
        1,
      );
      velocityTarget.z = Math.sqrt(
        velocityTarget.x ** 2 + velocityTarget.y ** 2,
      );
      velocity.lerp(velocityTarget, 0.05);
    };

    const onPointerLeave = () => {
      hover = false;
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerleave', onPointerLeave);

    // ── Animate ──────────────────────────────────────────────
    const animate = () => {
      if (!running) return;
      requestAnimationFrame(animate);

      const now = performance.now();

      // Trail: each point lerps toward the one ahead
      for (let i = 1; i < CURVE_POINTS; i++) {
        points[i].lerp(points[i - 1], CURVE_LERP);
      }
      // Sample spline for shader
      for (let i = 0; i < SHADER_POINTS; i++) {
        spline.getPoint(i / (SHADER_POINTS - 1), uPoints.value[i]);
      }

      if (!hover) {
        // Idle: gentle elliptical drift
        const t1 = now * SLEEP_TIME_COEF_X;
        const t2 = now * SLEEP_TIME_COEF_Y;
        const w = window.innerWidth;
        const r1 = (SLEEP_RADIUS_X * 2) / w;
        const r2 = (SLEEP_RADIUS_Y * 2) / w;
        spline.points[0].set(r1 * Math.cos(t1), r2 * Math.sin(t2));

        // Color: cyan ↔ magenta cycle
        const blend = 0.5 + 0.5 * Math.cos(now * 15e-4);
        uColor.value.setRGB(blend, 1 - blend * 0.68, 1 - blend * 0.02);
      } else {
        // Hover: cyan → lime based on velocity
        const v = Math.min(velocity.z, 1);
        uColor.value.setRGB(v * 0.79, 1 - v * 0.01, 1 - v);
        velocity.multiplyScalar(0.95);
      }

      renderer.render(scene, camera);
    };
    animate();

    // ── Cleanup ──────────────────────────────────────────────
    return () => {
      running = false;
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerleave', onPointerLeave);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        mixBlendMode: 'screen',
      }}
    />
  );
}
