/**
 * Basic fragment shader — solid color for testing geometry setup.
 * Uses u_time to animate color so we can confirm the render loop works.
 */
const fragmentShader = /* glsl */ `
uniform float u_time;
uniform vec2 u_domWH;

varying vec2 v_uv;

void main() {
    // Cyan/magenta pulse to match the portfolio palette
    vec3 cyan = vec3(0.0, 1.0, 1.0);
    vec3 magenta = vec3(1.0, 0.318, 0.98);

    float t = sin(u_time * 2.0) * 0.5 + 0.5;
    vec3 color = mix(cyan, magenta, v_uv.x + t * 0.3);

    // Grid lines for visual debugging
    vec2 grid = abs(fract(v_uv * 10.0) - 0.5);
    float line = step(min(grid.x, grid.y), 0.02);
    color = mix(color, vec3(1.0), line * 0.3);

    gl_FragColor = vec4(color, 0.9);
}
`;

export default fragmentShader;
