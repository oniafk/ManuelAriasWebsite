'use client';

import { useEffect, useRef } from 'react';

// Random images from picsum for demonstration
const PROJECT_IMAGES = [
  'https://picsum.photos/800/600?random=1',
  'https://picsum.photos/800/600?random=2',
  'https://picsum.photos/800/600?random=3',
  'https://picsum.photos/800/600?random=4',
  'https://picsum.photos/800/600?random=5',
  'https://picsum.photos/800/600?random=6',
];

interface Project {
  id: string;
  title: string;
  tags: string[];
}

function ProjectCard({ p, index, isOdd }: { p: Project, index: number, isOdd: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    let timer: number;
    let registered = false;

    const tryRegister = () => {
      const scene = (window as any).WebGLSceneInstance;
      if (scene && !registered) {
        scene.addItem(containerRef.current, { 
          shaderId: 'pixel-reveal', 
          imageUrl: PROJECT_IMAGES[index] 
        });
        registered = true;
      } else if (!registered) {
        timer = requestAnimationFrame(tryRegister);
      }
    };
    
    tryRegister();

    return () => {
      cancelAnimationFrame(timer);
      if (registered && (window as any).WebGLSceneInstance && containerRef.current) {
        (window as any).WebGLSceneInstance.removeItem(containerRef.current);
      }
    };
  }, [index]);

  return (
    <div 
      ref={containerRef}
      onMouseEnter={() => {
        (window as any).WebGLSceneInstance?.setHoverItem(containerRef.current, true);
      }}
      onMouseLeave={() => {
        (window as any).WebGLSceneInstance?.setHoverItem(containerRef.current, false);
      }}
      className={`group cursor-pointer border-b-[2px] border-void/50 p-[40px] flex flex-col justify-between min-h-[270px] bg-[#799800] hover:bg-transparent transition-colors duration-500 relative overflow-hidden ${isOdd ? 'md:border-l-[2px]' : ''}`}
    >
      {/* Content sits on top of WebGL Canvas visually because canvas is z-index: -1 */}
      <div className="flex items-start justify-between relative z-10 pointer-events-none">
        <span className="font-orbitron font-bold text-[60px] leading-[60px] text-void group-hover:text-white select-none tracking-[-1px] transition-colors duration-500">
          {p.id}
        </span>
        <div className="flex flex-col items-end gap-2">
           <span className="font-space font-bold text-[20px] text-void group-hover:text-white text-right max-w-full uppercase tracking-[0.5px] transition-colors duration-500 drop-shadow-sm">
             {p.title}
           </span>
           {/* Brutalist terminal indicator hidden until hover */}
           <span className="font-mono text-[14px] text-white opacity-0 group-hover:opacity-100 font-bold tracking-[4px] uppercase transition-opacity duration-500 drop-shadow-sm">
             [ INIT_{p.id} ]
           </span>
        </div>
      </div>
      
      <div className="w-full h-[2px] bg-void/50 group-hover:bg-white/40 my-[24px] relative z-10 transition-colors duration-500 pointer-events-none" />

      <div className="flex flex-wrap gap-[12px] relative z-10 pointer-events-none">
        {p.tags.map(tag => (
          <div key={tag} className="flex items-center gap-2">
            <span className="inline-block px-3 py-1 bg-void/10 group-hover:bg-void border border-void/40 group-hover:border-transparent font-mono text-[9px] font-medium tracking-[1px] uppercase text-void group-hover:text-white transition-colors duration-500">
               {tag}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ZoneD() {
  const projects: Project[] = [
    { id: '01', title: 'PROJECT_ONE', tags: ['HTML', 'CSS'] },
    { id: '02', title: 'PROJECT_TWO', tags: ['JS', 'WEBGL'] },
    { id: '03', title: 'KINETIC_FLOW_PROTOCOL', tags: ['WEBGL', 'RUST', 'WASM'] },
    { id: '04', title: 'SYNTH_OS_INTERFACE', tags: ['UNREAL', 'SWIFT', 'METAL'] },
    { id: '05', title: 'MAGMA_CORE_NODE', tags: ['GO', 'K8S', 'PROMETHEUS'] },
    { id: '06', title: 'VOID_ZERO_SYSTEM', tags: ['TYPESCRIPT', 'NEXT.JS', 'TAILWIND'] },
  ];

  return (
    <section id="projects" className="relative w-full min-h-screen pt-[58px] bg-void flex flex-col border-t border-variant-border">
      {/* Grid of Projects */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 w-full">
        {projects.map((p, i) => (
          <ProjectCard key={p.id} p={p} index={i} isOdd={i % 2 !== 0} />
        ))}
      </div>

      {/* Status Bar */}
      <div className="w-full h-[32px] border-t border-variant-border bg-void flex items-center justify-between px-[20px] font-mono text-[11px] text-tertiary shrink-0 opacity-80">
        <span className="tracking-[1px] uppercase">● SYSTEM_STATUS: NOMINAL // CORE_TEMP: 3C // NODE: PORT_8080</span>
        <span className="tracking-[1px] uppercase text-on-dark-dim hidden md:block">_GIT _X_COM _OS_INTEL</span>
      </div>
    </section>
  );
}
