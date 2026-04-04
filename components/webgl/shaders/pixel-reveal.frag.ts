/**
 * Pixelated reveal fragment shader based on noise grid.
 */
const fragmentShader = /* glsl */ `
uniform vec2 u_domWH;
uniform sampler2D u_texture;
uniform float u_opacity;
uniform vec2 u_textureSize;

varying vec2 v_uv;

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

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

void main() {
    float gridSize = 20.0;
    vec2 gridUV = floor(v_uv * vec2(gridSize, gridSize)) / vec2(gridSize, gridSize);
    vec2 pixel = gridUV + vec2(1.0/gridSize, 1.0/gridSize);

    float rand = random(pixel);
    
    // Pixel threshold based on u_opacity and random offset
    float reveal = step(rand, u_opacity);

    // Apply texture with object-fit: cover logic if texture size is provided
    vec2 finalUV = v_uv;
    if (u_textureSize.x > 0.0 && u_textureSize.y > 0.0) {
        finalUV = coverUV(v_uv, u_domWH, u_textureSize);
    }
    
    vec4 color = texture2D(u_texture, finalUV);
    gl_FragColor = vec4(color.rgb, reveal);
}
`;

export default fragmentShader;
