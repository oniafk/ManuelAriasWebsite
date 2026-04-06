/**
 * Scrolling text-mask shader for the contact helmet (ZoneE).
 * Tiles ContactMe.png across the mesh surface with alternating
 * white/pink rows, scrolling horizontally over time.
 * Uses the mask value as alpha for transparency.
 */
const fragmentShader = /* glsl */ `
uniform sampler2D uTextMask;
uniform float uTime;
varying vec2 vUv;

void main() {
    // 1. Define repetitions: 4 times around the mesh horizontally, 10 stacked vertically
    float horizontalWrap = 4.0;
    float verticalStack = 10.0;

    // 2. Scale the UVs
    vec2 scaledUv = vec2(vUv.x * horizontalWrap, vUv.y * verticalStack);

    // 3. Translate position based on time (Scrolling the banner)
    scaledUv.x -= uTime * 0.5; // Subtract to move left-to-right

    // 4. Calculate the Modulo for alternating rows
    // floor() isolates the current row number (0, 1, 2, 3...)
    // mod(..., 2.0) returns 0.0 for even rows, 1.0 for odd rows
    float rowIndex = floor(vUv.y * verticalStack);
    float isOddRow = mod(rowIndex, 2.0);

    // 5. Define colors and mix based on the modulo result
    vec3 colorWhite = vec3(1.0, 1.0, 1.0);
    vec3 colorPink = vec3(1.0, 0.4, 0.7);
    vec3 currentTextColor = mix(colorWhite, colorPink, isOddRow);

    // 6. Sample the texture mask using the animated UVs
    float mask = texture2D(uTextMask, scaledUv).r;

    // 7. Output. Multiply the mask by the calculated color, use mask as alpha for transparency
    vec3 finalColor = currentTextColor * mask;

    gl_FragColor = vec4(finalColor, mask);
}
`;

export default fragmentShader;
