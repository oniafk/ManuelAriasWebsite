'use client';

import { useEffect, useRef } from 'react';
import { WebGLScene } from './WebGLScene';

export default function WebGLCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<WebGLScene | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (sceneRef.current) return;

    sceneRef.current = new WebGLScene(canvasRef.current);

    return () => {
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  return (
    <div
      id="webgl-wrapper"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 10,
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        id="webgl-canvas"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
