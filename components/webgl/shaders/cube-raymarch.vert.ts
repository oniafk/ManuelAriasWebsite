/**
 * DOM-projecting vertex shader for the raymarching quad.
 * Positions the quad at the DOM element's location so it scrolls
 * with the page like a normal HTML element.
 */
const vertexShader = /* glsl */ `
uniform vec2 u_resolution;
uniform vec2 u_scrollOffset;
uniform vec2 u_domXY;
uniform vec2 u_domWH;

varying vec2 v_uv;

void main() {
    // Convert from document space to canvas space
    vec2 pixelXY = u_domXY - u_scrollOffset + u_domWH * 0.5;

    // Flip Y axis (DOM: Y down, WebGL: Y up)
    pixelXY.y = u_resolution.y - pixelXY.y;

    // Scale by element size (position.xy is [-0.5, 0.5])
    pixelXY += position.xy * u_domWH;

    // Convert to NDC [-1, 1]
    vec2 xy = pixelXY / u_resolution * 2.0 - 1.0;

    v_uv = uv;
    gl_Position = vec4(xy, 0.0, 1.0);
}
`;

export default vertexShader;
