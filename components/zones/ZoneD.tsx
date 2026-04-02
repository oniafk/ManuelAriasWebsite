export default function ZoneD() {
  const projects = [
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
          <div key={p.id} className={`group cursor-pointer border-b border-variant-border p-[40px] flex flex-col justify-between min-h-[270px] bg-container-low hover:bg-tertiary transition-none relative overflow-hidden ${i % 2 !== 0 ? 'md:border-l' : ''}`}>
             <div className="flex items-start justify-between relative z-10">
                <span className="font-orbitron font-bold text-[60px] leading-[60px] text-variant-border group-hover:text-void select-none tracking-[-1px]">
                  {p.id}
                </span>
                <div className="flex flex-col items-end gap-2">
                   <span className="font-space font-bold text-[20px] text-on-dark group-hover:text-void text-right max-w-full uppercase tracking-[0.5px]">
                     {p.title}
                   </span>
                   {/* Brutalist terminal indicator hidden until hover */}
                   <span className="font-mono text-[14px] text-void opacity-0 group-hover:opacity-100 font-bold tracking-[4px] uppercase">
                     [ INIT_{p.id} ]
                   </span>
                </div>
             </div>
             
             <div className="w-full h-[1px] bg-ghost-border group-hover:bg-void/20 my-[24px] relative z-10" />

             <div className="flex flex-wrap gap-[12px] relative z-10">
                {p.tags.map(tag => (
                  <div key={tag} className="flex items-center gap-2">
                    <span className="inline-block px-3 py-1 bg-surface group-hover:bg-void border border-ghost-border group-hover:border-transparent font-mono text-[9px] font-medium tracking-[1px] uppercase text-on-dark-dim group-hover:text-tertiary">
                       {tag}
                    </span>
                  </div>
                ))}
             </div>
          </div>
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
