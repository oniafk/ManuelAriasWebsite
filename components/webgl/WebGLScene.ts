import * as THREE from "three";
import domProjectVert from "./shaders/dom-project.vert";
import basicFrag from "./shaders/basic.frag";
import cubeRaymarchVert from "./shaders/cube-raymarch.vert";
import cubeRaymarchFrag from "./shaders/cube-raymarch.frag";

// ─── Types ───────────────────────────────────────────────────────────
export interface WebGLItem {
  domContainer: HTMLElement;
  mesh: THREE.Mesh;
  x: number;
  y: number;
  width: number;
  height: number;
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

    this.onResize();
    this.addRaymarchCube();

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
  };

  // ═══════════════════════════════════════════════════════════════
  // SCROLL
  // ═══════════════════════════════════════════════════════════════

  private onScroll = () => {
    // Captured in animate via window.scrollY
  };

  private updateScrollOffset() {
    this.scrollOffset.set(
      window.scrollX,
      window.scrollY - this.viewportHeight * PADDING,
    );
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
  // MOUSE — Hover detection for raymarch cube
  // ═══════════════════════════════════════════════════════════════

  private onMouseMove = (e: MouseEvent) => {
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

  addItem(domElement: HTMLElement): WebGLItem {
    const mesh = new THREE.Mesh(
      this.sharedGeometry,
      new THREE.ShaderMaterial({
        uniforms: {
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
        },
        vertexShader: domProjectVert,
        fragmentShader: basicFrag,
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
    };

    this.itemList.push(item);
    this.updateSingleItemBounds(item);
    return item;
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
    const canvasTop = this.scrollOffset.y;
    const canvasBottom = canvasTop + this.resolution.y;

    for (const item of this.itemList) {
      const material = item.mesh.material as THREE.ShaderMaterial;
      material.uniforms.u_domXY.value.set(item.x, item.y);

      // Manual frustum culling
      const inView = item.y + item.height > canvasTop && item.y < canvasBottom;
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

    // ── Update scroll offset (includes padding) ─────────────────
    this.updateScrollOffset();

    // ── Canvas transform — Lusion technique ─────────────────────
    // Canvas is absolute, scrolls with page. Transform snaps it
    // back to the viewport origin each frame.
    this.canvas.style.transform = `translateY(${
      window.scrollY - this.viewportHeight * PADDING
    }px)`;

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

    // ── Update DOM-synced meshes ────────────────────────────────
    this.updateMeshPositions();

    // ── Render ──────────────────────────────────────────────────
    this.renderer.render(this.scene, this.camera);
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

    this.removeRaymarchCube();
    this.sharedGeometry.dispose();
    this.renderer.dispose();
  }
}
