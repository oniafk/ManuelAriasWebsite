/**
 * Video background fragment shader.
 * Samples from a video texture with cover-fit, darkening, vignette,
 * and subtle cyan color grading to match the portfolio palette.
 */
const fragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D u_videoTexture;
uniform float u_time;
uniform vec2 u_domWH;

varying vec2 v_uv;

void main() {
    vec2 uv = v_uv;

    // Cover-fit: crop to fill (like CSS object-fit: cover)
    // Assumes 16:9 source video — adjust if ratio differs
    float videoAspect = 16.0 / 9.0;
    float containerAspect = u_domWH.x / u_domWH.y;

    if (containerAspect > videoAspect) {
        float scale = containerAspect / videoAspect;
        uv.y = (uv.y - 0.5) / scale + 0.5;
    } else {
        float scale = videoAspect / containerAspect;
        uv.x = (uv.x - 0.5) / scale + 0.5;
    }

    vec3 col = texture2D(u_videoTexture, uv).rgb;

    // Cyan color grading
    col.r *= 0.85;
    col.g *= 0.95;
    col.b *= 1.1;

    // Darken for text readability
    col *= 0.8;

    // Vignette
    float vignette = 1.0 - dot(v_uv - 0.5, v_uv - 0.5) * 1.5;
    col *= clamp(vignette, 0.0, 1.0);

    gl_FragColor = vec4(col, 1.0);
}
`;

export default fragmentShader;
