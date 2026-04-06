/**
 * Standard 3D vertex shader for the contact helmet.
 * Uses perspective projection (not DOM-projecting) since
 * this mesh lives in a perspective scene, not the ortho DOM-synced one.
 */
const vertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export default vertexShader;
