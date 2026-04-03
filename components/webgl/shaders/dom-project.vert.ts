/**
 * Universal DOM-projecting vertex shader.
 * Maps DOM pixel coordinates to WebGL NDC space.
 * Following the Lusion technique from WEBGL_SCROLL_SYNC_GUIDE.md
 */
const vertexShader = /* glsl */ `
uniform vec2 u_resolution;
uniform vec2 u_scrollOffset;
uniform vec2 u_domXY;
uniform vec2 u_domWH;
uniform float u_strength;

varying vec2 v_uv;
varying vec2 v_pixelCoord;

void main() {
    // Step 1: Convert from document space to canvas space
    vec2 pixelXY = u_domXY - u_scrollOffset + u_domWH * 0.5;

    // Step 2: Flip Y axis (DOM: Y down, WebGL: Y up)
    pixelXY.y = u_resolution.y - pixelXY.y;

    // Step 3: Scale by element size (position.xy is in [-0.5, 0.5])
    pixelXY += position.xy * u_domWH;

    // Step 4: Convert pixel coords to NDC [-1, 1]
    vec2 xy = pixelXY / u_resolution * 2.0 - 1.0;

    v_uv = uv;
    v_pixelCoord = pixelXY;
    gl_Position = vec4(xy, 0.0, 1.0);
}
`;

export default vertexShader;
