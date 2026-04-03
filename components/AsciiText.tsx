'use client';
import { useEffect, useRef } from 'react';
import { createASCIIShift } from '@/utils/asciiShift';

interface AsciiTextProps {
  text: string;
  className?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
  style?: React.CSSProperties;
}

export default function AsciiText({ text, className = '', tag = 'span', style }: AsciiTextProps) {
  const ref = useRef<HTMLElement>(null);
  const instanceRef = useRef<any>(null);

  useEffect(() => {
    if (!ref.current) return;
    
    // Initialize the ASCII shift instance with standard brutalist configuration
    instanceRef.current = createASCIIShift(ref.current, { 
        dur: 1000, 
        spread: 1 
    });
    
    return () => {
      // Cleanup event listeners and animation loop when unmounted
      if (instanceRef.current?.destroy) {
        instanceRef.current.destroy();
      }
    };
  }, []);

  // Use the HTML tag specified by the developer, or fallback to span
  const Tag = tag as any;

  return (
    <Tag ref={ref} className={`as ${className}`} style={style}>
      {text}
    </Tag>
  );
}
