'use client';

import { useEffect, useRef } from 'react';

const PHRASES = [
  'crafting new realities from functional code',
  'one dream, multiple ways to make it true',
];

const CHARS = ['0', '1'];
const FONT_SIZE = 14;
const TYPE_DELAY = 40;
const ERASE_DELAY = 20;
const DISPLAY_TIME = 8000;

export default function MatrixTerminal() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const msgRef = useRef<HTMLSpanElement>(null);

  // ── Matrix rain ──────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;
    let columns = 0;
    let yPositions: number[] = [];

    const resize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      columns = Math.floor(canvas.width / FONT_SIZE);
      yPositions = new Array(columns).fill(0);
    };
    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(container);

    let lastFrame = 0;
    const draw = () => {
      if (!running) return;
      requestAnimationFrame(draw);

      const now = Date.now();
      if (now - lastFrame < 1000 / 30) return;
      lastFrame = now;

      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#00e700';
      ctx.shadowColor = '#00e700';
      ctx.font = `${FONT_SIZE}px monospace`;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.shadowBlur = 8;

      for (let i = 0; i < columns; i++) {
        const text = CHARS[Math.floor(Math.random() * CHARS.length)];
        ctx.fillText(text, i * FONT_SIZE, yPositions[i]);
        if (yPositions[i] > 100 + Math.random() * 10000) {
          yPositions[i] = 0;
        } else {
          yPositions[i] += FONT_SIZE;
        }
      }
    };
    draw();

    return () => {
      running = false;
      observer.disconnect();
    };
  }, []);

  // ── Typewriter ───────────────────────────────────────
  useEffect(() => {
    const span = msgRef.current;
    if (!span) return;

    let running = true;
    let phraseIdx = 0;
    let charIdx = 0;
    let phase: 'typing' | 'waiting' | 'erasing' = 'typing';
    let lastAction = 0;
    let phaseStart = 0;
    let cursorOn = true;
    let lastBlink = 0;

    const update = () => {
      if (!running) return;
      requestAnimationFrame(update);

      const now = Date.now();
      const phrase = PHRASES[phraseIdx];

      if (phase === 'typing') {
        if (now - lastAction >= TYPE_DELAY) {
          lastAction = now;
          charIdx++;
          span.textContent = '> ' + phrase.slice(0, charIdx) + '_';
          if (charIdx >= phrase.length) {
            phase = 'waiting';
            phaseStart = now;
          }
        }
      } else if (phase === 'waiting') {
        if (now - lastBlink >= 500) {
          lastBlink = now;
          cursorOn = !cursorOn;
          span.textContent = '> ' + phrase + (cursorOn ? '_' : ' ');
        }
        if (now - phaseStart >= DISPLAY_TIME) {
          phase = 'erasing';
          cursorOn = true;
        }
      } else {
        if (now - lastAction >= ERASE_DELAY) {
          lastAction = now;
          charIdx--;
          if (charIdx <= 0) {
            charIdx = 0;
            phraseIdx = (phraseIdx + 1) % PHRASES.length;
            phase = 'typing';
            span.textContent = '> _';
          } else {
            span.textContent = '> ' + phrase.slice(0, charIdx) + '_';
          }
        }
      }
    };

    span.textContent = '> _';
    update();
    return () => {
      running = false;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden bg-black"
    >
      {/* Scanlines */}
      <div
        className="absolute inset-0 z-30 pointer-events-none opacity-10"
        style={{
          backgroundImage:
            'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAADCAQAAAD41K0JAAAADklEQVQI12Ng+A+EQAQADfsC/pD7Z48AAAAASUVORK5CYII=)',
          backgroundRepeat: 'repeat',
        }}
      />
      {/* Message box */}
      <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
        <div
          className="font-mono"
          style={{
            color: '#d3ffd3',
            border: '2px solid rgba(211, 255, 211, 0.6)',
            background: 'rgba(45, 81, 45, 0.85)',
            textShadow: '0 0 10px rgba(211, 255, 211, 0.8)',
            boxShadow: '0 0 20px rgba(211, 255, 211, 0.3)',
            padding: '16px 20px',
            fontSize: '16px',
            lineHeight: '28px',
            fontWeight: 400,
            maxWidth: '90%',
            minHeight: '40px',
            wordBreak: 'break-word',
          }}
        >
          <span ref={msgRef}>{'> _'}</span>
        </div>
      </div>
      {/* Matrix canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-10 opacity-80" />
    </div>
  );
}
