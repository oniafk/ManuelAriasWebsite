/**
 * Raymarched subdivided cube — based on Shadertoy fd3SRN.
 *
 * The entire 3D scene is rendered in this fragment shader via raymarching.
 * No actual 3D geometry is needed — just a flat quad.
 *
 * Modifications from the original:
 * - Block expansion is driven by u_hover (0→1) instead of always-on
 * - Mouse position (u_mouse) influences camera rotation on hover
 * - Slow base rotation instead of full-speed
 * - Transparent background (discard) for compositing over the page
 */
const fragmentShader = /* glsl */ `
precision highp float;

#define MDIST 350.0
#define STEPS 128.0
#define pi 3.1415926535
#define rot(a) mat2(cos(a), sin(a), -sin(a), cos(a))

uniform float u_time;
uniform float u_hover;
uniform vec2  u_mouse;
uniform vec2  u_domWH;

varying vec2 v_uv;

// ── IQ palette ──────────────────────────────────────────────
vec3 pal(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(2.0 * pi * (c * t + d));
}

// ── Hash functions ──────────────────────────────────────────
float h21(vec2 a) {
    return fract(sin(dot(a.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float h11(float a) {
    return fract(sin(a * 12.9898) * 43758.5453123);
}

// ── SDF primitives ──────────────────────────────────────────
float box(vec3 p, vec3 b) {
    vec3 d = abs(p) - b;
    return max(d.x, max(d.y, d.z));
}

float ebox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

// ── Smooth square wave ──────────────────────────────────────
float swave(float x, float a) {
    float s = sin(x * pi / 3.0 - pi / 2.0);
    return (s / sqrt(a * a + s * s) + 1.0 / sqrt(a * a + 1.0)) * 0.5;
}

// ── Globals (per-fragment) ──────────────────────────────────
vec3 rdg = vec3(0);
float nsdf = 0.0;

// ── Subdivision + block expansion ───────────────────────────
vec2 blocks(vec3 p, vec3 scl, vec3 rd) {
    float t = u_time;

    bvec3 isEdge = bvec3(true);
    vec3 dMin = vec3(-0.5) * scl;
    vec3 dMax = vec3(0.5) * scl;
    vec3 dMini = dMin;
    vec3 dMaxi = dMax;

    float id = 0.0;
    float seed = floor(t / 4.0);

    float MIN_SIZE = 0.5;
    float PAD_FACTOR = 1.01;
    float BREAK_CHANCE = 0.2;

    vec3 dim = dMax - dMin;

    for (float i = 0.0; i < 5.0; i += 1.0) {
        vec3 divHash = vec3(
            h21(vec2(i + id, seed)),
            h21(vec2(i + id + 2.44, seed)),
            h21(vec2(i + id + 7.83, seed))
        );
        if (i == 0.0) {
            divHash = vec3(0.49, 0.5, 0.51);
        }
        if (i > 0.0) {
            vec3 center = -(dMin + dMax) / 2.0;
            vec3 cs = vec3(0.3);
            divHash = clamp(divHash, cs * sign(center), 1.0 - cs * sign(-center));
        }

        vec3 divide = divHash * dim + dMin;
        divide = clamp(divide, dMin + MIN_SIZE * PAD_FACTOR, dMax - MIN_SIZE * PAD_FACTOR);
        vec3 minAxis = min(abs(dMin - divide), abs(dMax - divide));

        float minSize = min(minAxis.x, min(minAxis.y, minAxis.z));
        bool smallEnough = minSize < MIN_SIZE;

        bool willBreak = false;
        if (i > 0.0 && h11(id) < BREAK_CHANCE) { willBreak = true; }
        if (smallEnough && i > 0.0) { willBreak = true; }
        if (willBreak) { break; }

        dMax = mix(dMax, divide, step(p, divide));
        dMin = mix(divide, dMin, step(p, divide));

        float pad = 0.01;
        if (dMaxi.x > dMax.x + pad && dMini.x < dMin.x - pad) isEdge.x = false;
        if (dMaxi.y > dMax.y + pad && dMini.y < dMin.y - pad) isEdge.y = false;
        if (dMaxi.z > dMax.z + pad && dMini.z < dMin.z - pad) isEdge.z = false;

        vec3 diff = mix(-divide, divide, step(p, divide));
        id = length(diff + 1.0);

        dim = dMax - dMin;
    }

    vec3 center = (dMin + dMax) / 2.0;
    float b = 0.0;

    // Edge blocks expand outward — driven by u_hover
    if (any(isEdge)) {
        float expand = 1.0 + u_hover * (3.0 - h11(id) * 3.0) * swave(t * 3.0 + h11(id) * 1.5, 0.17);
        if (isEdge.x) {
            center.x *= expand;
        } else if (isEdge.y) {
            center.y *= expand;
        } else if (isEdge.z) {
            center.z *= expand;
        }
    }

    vec3 edgeAxis = mix(dMin, dMax, step(0.0, rd));
    vec3 dAxis = abs(p - edgeAxis) / (abs(rd) + 1e-4);
    float dEdge = min(dAxis.x, min(dAxis.y, dAxis.z));
    b = dEdge;

    dim -= 0.4;
    float a = ebox(p - center, dim * 0.5) - 0.2;

    if (!any(isEdge)) {
        a = b;
        nsdf = 5.0;
    } else {
        nsdf = a;
    }
    a = min(a, b);

    id = h11(id) * 1000.0;
    return vec2(a, id);
}

// ── Scene SDF ───────────────────────────────────────────────
vec3 map(vec3 p) {
    float t = u_time;
    vec3 rd2 = rdg;
    vec3 scl = vec3(10.0);

    // Slow base rotation
    float rotAngle = t * 0.3;
    p.xz *= rot(rotAngle);
    rd2.xz *= rot(rotAngle);
    p.xy *= rot(pi / 4.0);
    rd2.xy *= rot(pi / 4.0);

    vec2 a = blocks(p, scl, rd2) + 0.01;
    a.x = max(box(p, vec3(scl * 2.0)), a.x);

    return vec3(a, nsdf);
}

// ── Normal via central differences ──────────────────────────
vec3 norm(vec3 p) {
    vec2 e = vec2(0.01, 0.0);
    return normalize(map(p).x - vec3(
        map(p - e.xyy).x,
        map(p - e.yxy).x,
        map(p - e.yyx).x
    ));
}

// ── AO macro ────────────────────────────────────────────────
#define AO(dist, nor, pos) smoothstep(-(dist), (dist), map((pos) + (nor) * (dist)).z)

void main() {
    vec2 uv = v_uv - 0.5;
    uv.x *= u_domWH.x / u_domWH.y; // correct for container aspect ratio
    vec3 col = vec3(0);

    // ── Camera ────────────────────────────────────────────── make cube bigger or smaller
    vec3 ro = vec3(0.0, 3.5, -20.0) * 1.5;

    // Mouse-driven camera orbit on hover
    vec2 mRot = (u_mouse - 0.5) * u_hover;
    ro.yz *= rot(mRot.y * 2.0);
    ro.zx *= rot(-mRot.x * 3.5);

    ro.xz *= rot(-pi / 4.0);

    vec3 lk = vec3(0.0);
    vec3 f = normalize(lk - ro);
    vec3 r = normalize(cross(vec3(0, 1, 0), f));
    vec3 rd = normalize(f * 0.99 + uv.x * r + uv.y * cross(f, r));
    rdg = rd;

    // ── Raymarch ────────────────────────────────────────────
    vec3 p = ro;
    float dO = 0.0;
    vec3 d = vec3(0);
    bool hit = false;

    for (float i = 0.0; i < STEPS; i += 1.0) {
        p = ro + rd * dO;
        d = map(p);
        dO += d.x;
        if (abs(d.x) < 0.0001) {
            hit = true;
            break;
        }
        if (dO > MDIST) {
            break;
        }
    }

    // ── Shading ─────────────────────────────────────────────
    if (hit) {
        vec3 n = norm(p);
        vec3 ref = reflect(rd, n);
        vec3 e = vec3(0.5);
        vec3 al = pal(fract(d.y) * 0.8 - 0.15, e * 1.4, e, e * 2.0, vec3(0.0, 0.33, 0.66));

        // Lighting (blackle-style)
        float spec = length(sin(ref * 5.0) * 0.5 + 0.5) / sqrt(3.0);
        float fres = 1.0 - abs(dot(rd, n)) * 0.9;
        float diff = length(sin(n * 2.0) * 0.5 + 0.65) / sqrt(3.0);

        float ao = AO(0.3, n, p) * AO(0.5, n, p) * AO(0.9, n, p);

        col = al * diff + pow(spec, 5.0) * fres;
        col *= pow(ao, 0.2);
        col = pow(col, vec3(0.9));

        gl_FragColor = vec4(col, 1.0);
    } else {
        discard;
    }
}
`;

export default fragmentShader;
