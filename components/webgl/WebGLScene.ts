import * as THREE from "three";
import domProjectVert from "./shaders/dom-project.vert";
import basicFrag from "./shaders/basic.frag";
import cubeRaymarchVert from "./shaders/cube-raymarch.vert";
import cubeRaymarchFrag from "./shaders/cube-raymarch.frag";
import videoFrag from "./shaders/video.frag";
import pixelRevealFrag from "./shaders/pixel-reveal.frag";
import contactHelmetVert from "./shaders/contact-helmet.vert";
import contactHelmetFrag from "./shaders/contact-helmet.frag";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js';
import { DotScreenShader } from 'three/addons/shaders/DotScreenShader.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// ─── Types ───────────────────────────────────────────────────────────
export interface WebGLItem {
  domContainer: HTMLElement;
  mesh: THREE.Mesh;
  x: number;
  y: number;
  width: number;
  height: number;
  hoverState: number;
  isHovered: boolean;
  texture?: THREE.Texture;
}

// ─── Constants ───────────────────────────────────────────────────────
const PADDING = 0.25; // 25% extra canvas above & below viewport
const SCROLL_LERP = 0.07; // Smoothing factor for scroll delta decay

/**
 * WebGLScene — Core scene manager following the Lusion technique.
 *
 * Coordinate system:
 * - Orthographic camera maps 1:1 to CSS pixels
 * - Origin (0,0) is at the CENTER of the viewport
 * - X: right is positive, Y: up is positive
 * - Scroll offset adjusts the camera to track the viewport
 *
 * Scroll normalization:
 * - scrollNormalized = 0.0 when the page midpoint is at screen center
 * - scrollDelta = raw px change per frame
 * - scrollVelocity = smoothed |delta| (u_strength uniform)
 */
export class WebGLScene {
  // ─── Three.js core ──────────────────────────────────────────────
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.OrthographicCamera;
  private canvas: HTMLCanvasElement;

  // ─── Scroll state ───────────────────────────────────────────────
  private scrollOffset = new THREE.Vector2(0, 0);
  private scrollDelta = 0;
  private scrollVelocity = 0;
  private prevScrollY = 0;
  private scrollNormalized = 0;

  // ─── Resolution / sizing ────────────────────────────────────────
  private resolution = new THREE.Vector2();
  private viewportHeight = 0;
  private viewportWidth = 0;
  private pageHeight = 0;

  // ─── Shared uniforms (passed by reference to all shader materials) ─
  sharedUniforms = {
    u_resolution: { value: new THREE.Vector2() },
    u_scrollOffset: { value: new THREE.Vector2() },
    u_time: { value: 0 },
    u_strength: { value: 0 },
  };

  // ─── Items (DOM-synced meshes) ──────────────────────────────────
  private itemList: WebGLItem[] = [];
  private sharedGeometry!: THREE.PlaneGeometry;

  // ─── Animation ──────────────────────────────────────────────────
  private startTime = 0;
  private rafId = 0;
  private isRunning = false;

  // ─── Raymarch cube ──────────────────────────────────────────────
  private raymarchMesh: THREE.Mesh | null = null;
  private cubeAnchor: HTMLElement | null = null;
  private mouse = new THREE.Vector2(0.5, 0.5);
  private hoverTarget = 0;
  private hoverValue = 0;

  // ─── Video background ─────────────────────────────────────────
  private videoMesh: THREE.Mesh | null = null;
  private videoAnchor: HTMLElement | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private videoTexture: THREE.VideoTexture | null = null;

  // ─── Helmet model (3D perspective render) ─────────────────
  private scene3D: THREE.Scene | null = null;
  private camera3D: THREE.PerspectiveCamera | null = null;
  private helmetGroup: THREE.Group | null = null;
  private helmetAnchor: HTMLElement | null = null;
  private globalMouse = new THREE.Vector2(0, 0);
  private helmetComposer: EffectComposer | null = null;

  // ─── Contact helmet (ZoneE, text-mask shader, no post-processing) ───
  private sceneContact: THREE.Scene | null = null;
  private contactHelmetGroup: THREE.Group | null = null;
  private contactTextMaskTexture: THREE.Texture | null = null;
  private contactHelmetMaterial: THREE.ShaderMaterial | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.init();
  }

  // ═══════════════════════════════════════════════════════════════
  // INIT
  // ═══════════════════════════════════════════════════════════════

  private init() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);

    this.scene = new THREE.Scene();

    // Orthographic camera — sized in onResize to map 1:1 to CSS pixels
    // with origin at viewport center
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
    this.camera.position.z = 500;

    // Shared PlaneGeometry(1,1) for all DOM-synced elements
    this.sharedGeometry = new THREE.PlaneGeometry(1, 1);

    // Setup 3D Scene
    this.scene3D = new THREE.Scene();
    this.camera3D = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 3000);
    this.scene3D.add(new THREE.AmbientLight(0xffffff, 1.2));
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(200, 500, 300);
    dirLight.lookAt(0, 0, 0);
    this.scene3D.add(dirLight);

    const backLight = new THREE.DirectionalLight(0xaad600, 3);
    backLight.position.set(-200, -200, -200);
    this.scene3D.add(backLight);

    // ---- POST PROCESSING COMPOSER (HELMET ONLY) ----
    const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
    });
    this.helmetComposer = new EffectComposer(this.renderer, renderTarget);

    const renderPass = new RenderPass(this.scene3D, this.camera3D);
    renderPass.clearColor = new THREE.Color(0x000000);
    renderPass.clearAlpha = 0; // Pure transparent background for the isolated overlay!
    this.helmetComposer.addPass(renderPass);

    const effect1 = new ShaderPass(DotScreenShader);
    effect1.uniforms['scale'].value = 4;
    // The native DotScreenShader completely destroys the original color buffer and renders pure B/W dots.
    // We use a regex replace on the compiled shader string to force it to mix the dot math 
    // with the original RGB texture natively, creating a translucent 'alpha' effect!
    effect1.material.fragmentShader = effect1.material.fragmentShader.replace(
      'gl_FragColor = vec4( vec3( average * 10.0 - 5.0 + pattern() ), color.a );',
      `
      // 1. Calculate the halftone Dot Pattern. 
      // Tweak 6.0 (contrast) and 2.0 (brightness) to adjust the spread.
      float dotValue = clamp(average * 8.0 - 3.5 + pattern(), 0.0, 1.0);
      
      // 2. Control the fade/transparency using the dots!
      // Using 'dotValue' = Opaques dots in LIGHT, transparent fade in DARK.
      // Using '(1.0 - dotValue)' = Opaque dots in SHADOW, transparent fade in LIGHT.
      float maskAlpha = dotValue; 

      // 3. Render the helmet as pure Black & White Grayscale using the dot mask!
      gl_FragColor = vec4(vec3(average + 0.3), maskAlpha * color.a);
      `
    );
    this.helmetComposer.addPass(effect1);

    const effect2 = new ShaderPass(RGBShiftShader);
    effect2.uniforms['amount'].value = 0.0015;
    this.helmetComposer.addPass(effect2);

    const outputPass = new OutputPass();
    // Critical: enable blending and transparency on the final write to the screen buffer
    if ((outputPass as any).material) {
      (outputPass as any).material.transparent = true;
      (outputPass as any).material.blending = THREE.NormalBlending;
    }
    this.helmetComposer.addPass(outputPass);

    // ---- CONTACT HELMET SCENE (No post-processing) ----
    this.sceneContact = new THREE.Scene();

    this.onResize();
    this.addRaymarchCube();
    this.addVideoBackground();
    this.addHelmetModel();

    window.addEventListener("resize", this.onResize);
    window.addEventListener("scroll", this.onScroll, { passive: true });
    window.addEventListener("mousemove", this.onMouseMove);

    this.isRunning = true;
    this.startTime = performance.now();
    this.animate();
  }

  // ═══════════════════════════════════════════════════════════════
  // RESIZE — Camera maps 1:1 to CSS pixels, origin at center
  // ═══════════════════════════════════════════════════════════════

  private onResize = () => {
    this.viewportWidth = window.innerWidth;
    this.viewportHeight = window.innerHeight;
    this.pageHeight = document.documentElement.scrollHeight;

    // Canvas with padding (extra render area above & below)
    const canvasHeight = this.viewportHeight * (1 + PADDING * 2);
    const canvasWidth = this.viewportWidth;

    this.renderer.setSize(canvasWidth, canvasHeight);
    this.resolution.set(canvasWidth, canvasHeight);

    // u_resolution in CSS pixels for the DOM-projecting shader
    this.sharedUniforms.u_resolution.value.set(canvasWidth, canvasHeight);

    // Ortho camera: 1 unit = 1 CSS pixel, origin at center
    const halfW = this.viewportWidth / 2;
    const halfH = this.viewportHeight / 2;
    this.camera.left = -halfW;
    this.camera.right = halfW;
    this.camera.top = halfH;
    this.camera.bottom = -halfH;
    this.camera.updateProjectionMatrix();

    this.updateScrollOffset();
    this.updateItemBounds();

    if (this.camera3D) {
      this.camera3D.aspect = this.viewportWidth / this.viewportHeight;
      // To map 1 3D unit to 1 CSS pixel at Z=0, push the camera back precisely:
      this.camera3D.position.z = (this.viewportHeight / 2) / Math.tan((this.camera3D.fov * Math.PI / 180) / 2);
      this.camera3D.updateProjectionMatrix();
    }
    
    if (this.helmetComposer) {
      this.helmetComposer.setSize(this.viewportWidth, this.viewportHeight);
    }

    // Static canvas offset — just centers the padding around the viewport
    this.canvas.style.transform = `translateY(${-this.viewportHeight * PADDING}px)`;

    this.updateHelmetScales();
  };

  // ═══════════════════════════════════════════════════════════════
  // SCROLL
  // ═══════════════════════════════════════════════════════════════

  private onScroll = () => {
    // Captured in animate via window.scrollY
  };

  private updateScrollOffset() {
    // Static padding offset — canvas is fixed, not scroll-dependent.
    // Viewport-relative coords from getBoundingClientRect() already
    // account for scroll, so only the padding offset is needed.
    this.scrollOffset.set(0, -this.viewportHeight * PADDING);
    this.sharedUniforms.u_scrollOffset.value.copy(this.scrollOffset);
  }

  /**
   * Normalized scroll: 0.0 when page midpoint is at screen center.
   * Range: -0.5 (top) to +0.5 (bottom) for single-viewport pages.
   */
  private computeNormalizedScroll(): number {
    const maxScroll = this.pageHeight - this.viewportHeight;
    if (maxScroll <= 0) return 0;
    return window.scrollY / maxScroll - 0.5;
  }

  // ═══════════════════════════════════════════════════════════════
  // RAYMARCH CUBE — Rendered entirely in the fragment shader
  // ═══════════════════════════════════════════════════════════════

  private addRaymarchCube() {
    this.cubeAnchor = document.getElementById("cube-anchor");

    const material = new THREE.ShaderMaterial({
      uniforms: {
        u_time: this.sharedUniforms.u_time,
        u_resolution: this.sharedUniforms.u_resolution,
        u_scrollOffset: this.sharedUniforms.u_scrollOffset,
        u_domXY: { value: new THREE.Vector2(0, 0) },
        u_domWH: { value: new THREE.Vector2(1, 1) },
        u_hover: { value: 0 },
        u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
      },
      vertexShader: cubeRaymarchVert,
      fragmentShader: cubeRaymarchFrag,
      transparent: true,
    });

    this.raymarchMesh = new THREE.Mesh(this.sharedGeometry, material);
    this.raymarchMesh.frustumCulled = false;
    this.scene.add(this.raymarchMesh);
  }

  // ═══════════════════════════════════════════════════════════════
  // VIDEO BACKGROUND — Fullscreen video on a DOM-synced plane
  // ═══════════════════════════════════════════════════════════════

  private addVideoBackground() {
    this.videoAnchor = document.getElementById("video-bg-anchor");
    if (!this.videoAnchor) return;

    const video = document.createElement("video");
    video.src = "/video_ship.mp4";
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.setAttribute("playsinline", "");
    video.style.display = "none";
    document.body.appendChild(video);

    video.play().catch(() => {
      const resume = () => {
        video.play();
        document.removeEventListener("click", resume);
        document.removeEventListener("touchstart", resume);
      };
      document.addEventListener("click", resume);
      document.addEventListener("touchstart", resume);
    });

    this.videoElement = video;

    this.videoTexture = new THREE.VideoTexture(video);
    this.videoTexture.minFilter = THREE.LinearFilter;
    this.videoTexture.magFilter = THREE.LinearFilter;
    this.videoTexture.format = THREE.RGBAFormat;
    this.videoTexture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.ShaderMaterial({
      uniforms: {
        u_videoTexture: { value: this.videoTexture },
        u_time: this.sharedUniforms.u_time,
        u_resolution: this.sharedUniforms.u_resolution,
        u_scrollOffset: this.sharedUniforms.u_scrollOffset,
        u_domXY: { value: new THREE.Vector2(0, 0) },
        u_domWH: { value: new THREE.Vector2(1, 1) },
      },
      vertexShader: domProjectVert,
      fragmentShader: videoFrag,
      transparent: false,
      depthWrite: false,
      depthTest: false,
    });

    this.videoMesh = new THREE.Mesh(this.sharedGeometry, material);
    this.videoMesh.frustumCulled = false;
    this.videoMesh.renderOrder = -1;
    this.scene.add(this.videoMesh);
  }

  removeVideoBackground() {
    if (this.videoMesh) {
      (this.videoMesh.material as THREE.Material).dispose();
      this.scene.remove(this.videoMesh);
      this.videoMesh = null;
    }
    if (this.videoTexture) {
      this.videoTexture.dispose();
      this.videoTexture = null;
    }
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.src = "";
      this.videoElement.load();
      this.videoElement.remove();
      this.videoElement = null;
    }
    this.videoAnchor = null;
  }

  // ═══════════════════════════════════════════════════════════════
  // HELMET MODEL 3D
  // ═══════════════════════════════════════════════════════════════

  private addHelmetModel() {
    this.helmetGroup = new THREE.Group();
    if (this.scene3D) this.scene3D.add(this.helmetGroup);

    const loader = new GLTFLoader();
    loader.load("/sci-fi_helmet.glb", (gltf) => {
      // The helmet is usually quite small/large, so scaling it up or down to fill DOM footprint roughly
      gltf.scene.scale.set(225, 225, 225);
      
      // Orient it nicely
      gltf.scene.rotation.y = Math.PI;

      // Automatically center the imported geometry so local pivot errors don't cause high/low offset issues
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const center = box.getCenter(new THREE.Vector3());
      gltf.scene.position.x -= center.x;
      gltf.scene.position.y -= center.y;
      gltf.scene.position.z -= center.z;

      if (this.helmetGroup) {
        this.helmetGroup.add(gltf.scene);
      }

      // Clone for Contact Helmet (ZoneE)
      this.setupContactHelmet(gltf.scene);

      // Apply responsive scale for initial load
      this.updateHelmetScales();
    });
  }

  private getHelmetScale(): number {
    const w = this.viewportWidth;
    if (w >= 1080) return 1.0;
    if (w >= 640) return 0.75;
    return 0.55;
  }

  private updateHelmetScales() {
    const s = this.getHelmetScale();
    if (this.helmetGroup) this.helmetGroup.scale.setScalar(s);
    if (this.contactHelmetGroup) this.contactHelmetGroup.scale.setScalar(s);
  }

  private setupContactHelmet(sourceModel: THREE.Object3D) {
    if (!this.sceneContact) return;

    // Clone — geometry is shared by reference (no extra GPU vertex memory)
    const clone = sourceModel.clone(true);

    // Load the text mask texture with RepeatWrapping (UVs exceed [0,1])
    const textureLoader = new THREE.TextureLoader();
    this.contactTextMaskTexture = textureLoader.load("/ContactMe.png");
    this.contactTextMaskTexture.wrapS = THREE.RepeatWrapping;
    this.contactTextMaskTexture.wrapT = THREE.RepeatWrapping;
    this.contactTextMaskTexture.minFilter = THREE.LinearFilter;
    this.contactTextMaskTexture.magFilter = THREE.LinearFilter;

    // Create the custom ShaderMaterial
    this.contactHelmetMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTextMask: { value: this.contactTextMaskTexture },
        uTime: { value: 0 },
      },
      vertexShader: contactHelmetVert,
      fragmentShader: contactHelmetFrag,
      transparent: true,
    });

    // Traverse the clone and replace every mesh material
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
        mesh.material = this.contactHelmetMaterial!;
      }
    });

    // Wrap in a group for independent positioning
    this.contactHelmetGroup = new THREE.Group();
    this.contactHelmetGroup.add(clone);
    this.sceneContact.add(this.contactHelmetGroup);
  }

  // ═══════════════════════════════════════════════════════════════
  // MOUSE — Hover detection for raymarch cube & global parallax
  // ═══════════════════════════════════════════════════════════════

  private onMouseMove = (e: MouseEvent) => {
    // Global mouse tracking from -1 to 1 for 3D helmet rotation
    this.globalMouse.set(
      (e.clientX / window.innerWidth - 0.5) * 2,
      -(e.clientY / window.innerHeight - 0.5) * 2
    );

    if (!this.cubeAnchor) return;
    const rect = this.cubeAnchor.getBoundingClientRect();

    const isOver =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;
    this.hoverTarget = isOver ? 1 : 0;

    if (isOver) {
      this.mouse.set(
        (e.clientX - rect.left) / rect.width,
        (e.clientY - rect.top) / rect.height,
      );
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // DOM ITEM MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  addItem(domElement: HTMLElement, options?: { shaderId?: string, imageUrl?: string }): WebGLItem {
    let fragmentShader = basicFrag;
    let texture: THREE.Texture | undefined;

    const uniforms = {
      u_domXY: { value: new THREE.Vector2(0, 0) },
      u_domWH: { value: new THREE.Vector2(1, 1) },
      u_id: { value: this.itemList.length },
      u_rands: {
        value: new THREE.Vector4(
          Math.random(),
          Math.random(),
          Math.random(),
          Math.random(),
        ),
      },
      u_resolution: this.sharedUniforms.u_resolution,
      u_scrollOffset: this.sharedUniforms.u_scrollOffset,
      u_time: this.sharedUniforms.u_time,
      u_strength: this.sharedUniforms.u_strength,
      // Default extra uniforms
      u_texture: { value: null as THREE.Texture | null },
      u_textureSize: { value: new THREE.Vector2(0, 0) },
      u_opacity: { value: 0 },
    };

    if (options?.shaderId === "pixel-reveal") {
      fragmentShader = pixelRevealFrag;
      
      if (options.imageUrl) {
        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin('anonymous');
        texture = loader.load(options.imageUrl, (tex) => {
          uniforms.u_textureSize.value.set(tex.image.width, tex.image.height);
        });
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        uniforms.u_texture.value = texture;
      }
    }

    const mesh = new THREE.Mesh(
      this.sharedGeometry,
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: domProjectVert,
        fragmentShader,
        transparent: true,
        side: THREE.DoubleSide,
      }),
    );

    mesh.frustumCulled = false;
    this.scene.add(mesh);

    const item: WebGLItem = {
      domContainer: domElement,
      mesh,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      hoverState: 0,
      isHovered: false,
      texture
    };

    this.itemList.push(item);
    this.updateSingleItemBounds(item);
    return item;
  }

  removeItem(domElement: HTMLElement) {
    const index = this.itemList.findIndex(item => item.domContainer === domElement);
    if (index === -1) return;
    const item = this.itemList[index];
    if (item.texture) item.texture.dispose();
    (item.mesh.material as THREE.Material).dispose();
    this.scene.remove(item.mesh);
    this.itemList.splice(index, 1);
  }

  setHoverItem(domElement: HTMLElement, isHovered: boolean) {
    const item = this.itemList.find(i => i.domContainer === domElement);
    if (item) {
      item.isHovered = isHovered;
    }
  }

  private updateSingleItemBounds(item: WebGLItem) {
    const rect = item.domContainer.getBoundingClientRect();
    item.x = rect.left + window.scrollX;
    item.y = rect.top + window.scrollY;
    item.width = rect.width;
    item.height = rect.height;

    const material = item.mesh.material as THREE.ShaderMaterial;
    material.uniforms.u_domWH.value.set(item.width, item.height);
  }

  private updateItemBounds() {
    for (const item of this.itemList) {
      this.updateSingleItemBounds(item);
    }
  }

  private updateMeshPositions() {
    const margin = this.viewportHeight * PADDING;

    for (const item of this.itemList) {
      const rect = item.domContainer.getBoundingClientRect();
      const material = item.mesh.material as THREE.ShaderMaterial;
      material.uniforms.u_domXY.value.set(rect.left, rect.top);
      material.uniforms.u_domWH.value.set(rect.width, rect.height);

      // Frustum culling with padding margin
      const inView = rect.bottom > -margin && rect.top < this.viewportHeight + margin;
      item.mesh.visible = inView;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ANIMATE
  // ═══════════════════════════════════════════════════════════════

  private animate = () => {
    if (!this.isRunning) return;
    this.rafId = requestAnimationFrame(this.animate);

    const elapsed = (performance.now() - this.startTime) / 1000;

    // ── Scroll delta & velocity ─────────────────────────────────
    const currentScrollY = window.scrollY;
    this.scrollDelta = currentScrollY - this.prevScrollY;
    this.prevScrollY = currentScrollY;

    // Smooth velocity: lerps toward |delta| when scrolling, decays to 0 when idle
    this.scrollVelocity +=
      (Math.abs(this.scrollDelta) - this.scrollVelocity) * SCROLL_LERP;

    // Normalized scroll: 0.0 = page center at screen center
    this.scrollNormalized = this.computeNormalizedScroll();

    // ── Update scroll offset ───────────────────────────────────
    this.updateScrollOffset();

    // ── Shared uniforms ─────────────────────────────────────────
    this.sharedUniforms.u_time.value = elapsed;
    this.sharedUniforms.u_strength.value = this.scrollVelocity;

    // ── Raymarch cube: sync with DOM anchor ────────────────────
    this.hoverValue += (this.hoverTarget - this.hoverValue) * 0.08;
    if (this.raymarchMesh && this.cubeAnchor) {
      const rect = this.cubeAnchor.getBoundingClientRect();
      const mat = this.raymarchMesh.material as THREE.ShaderMaterial;
      mat.uniforms.u_domXY.value.set(rect.left, rect.top);
      mat.uniforms.u_domWH.value.set(rect.width, rect.height);
      mat.uniforms.u_hover.value = this.hoverValue;
      mat.uniforms.u_mouse.value.copy(this.mouse);
    }

    // ── Video background: sync with DOM anchor ──────────────────
    if (this.videoMesh && this.videoAnchor) {
      const vRect = this.videoAnchor.getBoundingClientRect();
      const vMat = this.videoMesh.material as THREE.ShaderMaterial;
      vMat.uniforms.u_domXY.value.set(vRect.left, vRect.top);
      vMat.uniforms.u_domWH.value.set(vRect.width, vRect.height);
    }

    // ── Update DOM-synced meshes ────────────────────────────────
    this.updateMeshPositions();

    // ── Update custom hover states ──────────────────────────────
    for (const item of this.itemList) {
      const targetHover = item.isHovered ? 1.0 : 0.0;
      item.hoverState += (targetHover - item.hoverState) * 0.05;
      const mat = item.mesh.material as THREE.ShaderMaterial;
      if (mat.uniforms.u_opacity) {
        mat.uniforms.u_opacity.value = item.hoverState;
      }
    }

    // ── 3D Helmet Position Sync ─────────────────────────────────
    if (this.helmetGroup) {
      const section = document.getElementById("about-me");
      if (section) {
        const rect = section.getBoundingClientRect();
        
        // Use normalized section values (0.0 to 1.0)
        // 0.5 places it exactly in the center of the section height/width
        const normX = 0.5;
        const normY = 0.5;
        
        const centerX = rect.left + rect.width * normX;
        const centerY = rect.top + rect.height * normY;

        // Map DOM Center to 3D center at Z=0
        this.helmetGroup.position.x = centerX - this.viewportWidth / 2;
        this.helmetGroup.position.y = -(centerY - this.viewportHeight / 2);

        // React to mouse cursor parallax smoothly (Inverted to follow cursor physically)
        const targetRotX = -this.globalMouse.y * 1.5;
        const targetRotY = Math.PI + this.globalMouse.x * 1.5;
        
        this.helmetGroup.rotation.x += (targetRotX - this.helmetGroup.rotation.x) * 0.05;
        this.helmetGroup.rotation.y += (targetRotY - this.helmetGroup.rotation.y) * 0.05;
      }
    }

    // ── Contact Helmet (ZoneE) Position Sync + Auto-Rotation ────
    if (this.contactHelmetGroup) {
      const contactSection = document.getElementById("contact");
      if (contactSection) {
        const rect = contactSection.getBoundingClientRect();

        const centerX = rect.left + rect.width * 0.5;
        const centerY = rect.top + rect.height * 0.5;

        this.contactHelmetGroup.position.x = centerX - this.viewportWidth / 2;
        this.contactHelmetGroup.position.y = -(centerY - this.viewportHeight / 2);

        // Slow auto-rotate counter to texture scroll direction
        this.contactHelmetGroup.rotation.y = Math.PI + elapsed * 0.15;
      }
    }

    // Update contact helmet shader time
    if (this.contactHelmetMaterial) {
      this.contactHelmetMaterial.uniforms.uTime.value = elapsed;
    }

    // ── Render Multi-Scene ──────────────────────────────────────
    this.renderer.autoClear = false;
    this.renderer.clear();

    // Pass 1: Orthographic 2D DOM elements
    this.renderer.render(this.scene, this.camera);

    // Pass 2: True 3D Perspective overlay via filtered Composer
    if (this.helmetComposer) {
      this.renderer.clearDepth(); // Prevent UI depths from overlapping
      this.helmetComposer.render();
    }

    // Pass 3: Contact helmet (text-mask shader, no post-processing)
    if (this.sceneContact && this.camera3D) {
      this.renderer.clearDepth();
      this.renderer.render(this.sceneContact, this.camera3D);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════

  get normalized() {
    return this.scrollNormalized;
  }
  get velocity() {
    return this.scrollVelocity;
  }
  get delta() {
    return this.scrollDelta;
  }

  /** Remove the raymarch cube (call when adding real content) */
  removeRaymarchCube() {
    if (!this.raymarchMesh) return;
    (this.raymarchMesh.material as THREE.Material).dispose();
    this.scene.remove(this.raymarchMesh);
    this.raymarchMesh = null;
    this.cubeAnchor = null;
  }

  // ═══════════════════════════════════════════════════════════════
  // DISPOSE
  // ═══════════════════════════════════════════════════════════════

  dispose() {
    this.isRunning = false;
    cancelAnimationFrame(this.rafId);

    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("scroll", this.onScroll);
    window.removeEventListener("mousemove", this.onMouseMove);

    for (const item of this.itemList) {
      (item.mesh.material as THREE.ShaderMaterial).dispose();
      this.scene.remove(item.mesh);
    }
    this.itemList = [];

    this.removeVideoBackground();
    this.removeRaymarchCube();

    // Contact helmet cleanup (do NOT dispose geometry — shared with ZoneC)
    if (this.contactHelmetMaterial) {
      this.contactHelmetMaterial.dispose();
      this.contactHelmetMaterial = null;
    }
    if (this.contactTextMaskTexture) {
      this.contactTextMaskTexture.dispose();
      this.contactTextMaskTexture = null;
    }
    if (this.contactHelmetGroup && this.sceneContact) {
      this.sceneContact.remove(this.contactHelmetGroup);
      this.contactHelmetGroup = null;
    }
    this.sceneContact = null;

    this.sharedGeometry.dispose();
    this.renderer.dispose();
  }
}
