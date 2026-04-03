'use client';
import { useEffect, useRef } from 'react';

const DICTIONARY = "0123456789qwertyuiopasdfghjklzxcvbnm".split('');

export default function HackerBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    
    let isRunning = true;
    let resizeTimeout: NodeJS.Timeout;

    const setup = () => {
      if (!isRunning) return;
      container.innerHTML = '';

      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // Measure character dimensions to calculate grid scale
      const measureSpan = document.createElement('span');
      measureSpan.textContent = 'A';
      measureSpan.className = 'font-mono font-normal text-[2cqw] leading-[1.6] tracking-normal uppercase inline-block opacity-0';
      container.appendChild(measureSpan);
      const charW = measureSpan.getBoundingClientRect().width || 10;
      const charH = measureSpan.getBoundingClientRect().height || 20;
      container.removeChild(measureSpan);

      const cols = Math.max(10, Math.floor(rect.width / charW));
      const rows = Math.max(5, Math.floor(rect.height / charH));
      const totalLetters = cols * rows;

      const fragment = document.createDocumentFragment();
      const spans: HTMLSpanElement[] = [];

      // Create grid of invisible raw letters
      for (let i = 0; i < totalLetters; i++) {
        const span = document.createElement('span');
        span.textContent = DICTIONARY[Math.floor(Math.random() * DICTIONARY.length)];
        // Extremely subtle text opacity for a background aesthetic
        span.className = 'inline-block opacity-0 transition-opacity duration-1000 text-variant-border';
        spans.push(span);
        fragment.appendChild(span);
      }
      container.appendChild(fragment);

      const moves = {
        left: -1,
        right: 1,
        up: -cols,
        down: cols
      };

      class Bolt {
        position: number;
        lastDirection: string;
        interval: any;

        constructor() {
          // Start at a random location on the grid
          this.position = Math.floor(Math.random() * totalLetters);
          this.lastDirection = '';
        }

        move() {
          const keys = Object.keys(moves);
          let direction = keys[Math.floor(Math.random() * keys.length)];
          while (direction === this.lastDirection) {
            direction = keys[Math.floor(Math.random() * keys.length)];
          }
          this.lastDirection = direction;
          const moveVal = (moves as any)[direction];
          
          const current = spans[this.position];
          this.position += moveVal;
          const next = spans[this.position];

          // Subtly reveal the text, leaving a dark terminal trail
          if (next) {
            if (current) {
               current.style.opacity = '0.1'; // Ghost trail
               current.style.color = 'var(--text-variant-border)';
            }
            next.style.opacity = '0.3'; // Transient highlight, still dark
            next.style.color = 'var(--color-primary-dim)';
          } else {
            if (current) {
               current.style.opacity = '0.1';
            }
            return false; // hit boundary / edge of screen
          }
          return true;
        }

        strike() {
          this.interval = setInterval(() => {
            if (!isRunning) {
              clearInterval(this.interval);
              return;
            }
            const moved = this.move();
            if (!moved) clearInterval(this.interval);
          }, 30); // Slightly slower traversal than 16ms so it feels like matrix code loading
        }
      }

      // Chain lightning strikes to fill the screen progressively
      for (let i = 0; i < 35; i++) {
        setTimeout(() => {
          if (isRunning) new Bolt().strike();
        }, i * (10000 / 35)); // Stagger over 10 seconds
      }
    };

    setup();

    // Handle resize
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (isRunning) setup();
      }, 500);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      isRunning = false;
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      // 0.8 scale of the provided text size. Original was 2.5cqw, 2.5 * 0.8 = 2.0cqw
      className="absolute inset-0 z-[-2] overflow-hidden break-all uppercase pointer-events-none font-mono font-normal text-[2cqw] leading-[1.6] tracking-normal animate-brutalist select-none opacity-50"
      aria-hidden="true"
    />
  );
}
