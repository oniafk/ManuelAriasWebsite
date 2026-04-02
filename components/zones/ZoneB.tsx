export default function ZoneB() {
  return (
    <section id="work" className="relative w-full min-h-screen pt-[58px] bg-void flex flex-col px-[20px] border-t border-variant-border">
      {/* Title Block */}
      <div className="w-full @container relative z-[1] py-[40px]">
        <div className="flex flex-row items-center w-full font-orbitron font-bold uppercase leading-[0.75] tracking-[-0.04em] gap-[4cqw]">
          <h2 className="text-[12cqw] text-primary whitespace-nowrap">WHAT I</h2>
          <h2 className="text-[12cqw] text-secondary whitespace-nowrap">BUILD</h2>
        </div>
      </div>

      {/* Columns wrapper */}
      <div className="flex flex-col lg:flex-row w-full flex-1">
        {/* Left Column - Empty (For 3D content) */}
        <div className="flex-1 min-h-[400px] border-r border-variant-border flex items-center justify-center relative p-[40px]">
          {/* Reserved for Three.js Agent */}
          <span className="font-mono text-on-dark-dim text-[11px] tracking-[1px] uppercase border border-ghost-border p-4 bg-container-low">
            Visual / 3D Content Area
          </span>
        </div>

        {/* Right Column - Tech Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2">
          {/* Cell - Languages */}
          <div className="group cursor-default border-b border-variant-border md:border-r p-[20px] flex flex-col gap-[8px] bg-container-high/20 min-h-[200px] transition-all duration-300 hover:cyan-bloom">
            <h3 className="font-space font-medium text-[20px] text-primary uppercase group-hover:[text-shadow:0_0_10px_var(--color-primary)] transition-all duration-300">Languages</h3>
            <div className="w-full h-[1px] bg-primary/20 my-2 group-hover:bg-primary transition-all duration-300" />
            <p className="font-mono text-[14px] text-primary/80 leading-[22px] group-hover:text-primary group-hover:[text-shadow:0_0_8px_var(--color-primary)] transition-all duration-300">JavaScript<br/>Python<br/>TypeScript</p>
          </div>

          {/* Cell - Front */}
          <div className="group cursor-default border-b border-variant-border p-[20px] flex flex-col gap-[8px] bg-container-highest/20 min-h-[200px] transition-all duration-300 hover:cyan-bloom">
            <h3 className="font-space font-medium text-[20px] text-primary uppercase group-hover:[text-shadow:0_0_10px_var(--color-primary)] transition-all duration-300">Front</h3>
            <div className="w-full h-[1px] bg-primary/20 my-2 group-hover:bg-primary transition-all duration-300" />
            <p className="font-mono text-[14px] text-primary/80 leading-[22px] group-hover:text-primary group-hover:[text-shadow:0_0_8px_var(--color-primary)] transition-all duration-300">React<br/>Next.js<br/>WebGL<br/>Three.js</p>
          </div>

          {/* Cell - Back */}
          <div className="group cursor-default border-b border-variant-border md:border-b-0 md:border-r p-[20px] flex flex-col gap-[8px] bg-container-high/20 min-h-[200px] transition-all duration-300 hover:cyan-bloom">
            <h3 className="font-space font-medium text-[20px] text-primary uppercase group-hover:[text-shadow:0_0_10px_var(--color-primary)] transition-all duration-300">Back</h3>
            <div className="w-full h-[1px] bg-primary/20 my-2 group-hover:bg-primary transition-all duration-300" />
            <p className="font-mono text-[14px] text-primary/80 leading-[22px] group-hover:text-primary group-hover:[text-shadow:0_0_8px_var(--color-primary)] transition-all duration-300">Node.js<br/>Express.js<br/>Hono.js</p>
          </div>

          {/* Cell - Data */}
          <div className="group cursor-default border-b border-variant-border md:border-b-0 p-[20px] flex flex-col gap-[8px] bg-container-low/20 min-h-[200px] transition-all duration-300 hover:cyan-bloom">
            <h3 className="font-space font-medium text-[20px] text-primary uppercase group-hover:[text-shadow:0_0_10px_var(--color-primary)] transition-all duration-300">Data</h3>
            <div className="w-full h-[1px] bg-primary/20 my-2 group-hover:bg-primary transition-all duration-300" />
            <p className="font-mono text-[14px] text-primary/80 leading-[22px] group-hover:text-primary group-hover:[text-shadow:0_0_8px_var(--color-primary)] transition-all duration-300">SQL<br/>Supabase</p>
          </div>

          {/* Cell - Tools */}
          <div className="group cursor-default border-r border-t border-variant-border p-[20px] flex flex-col gap-[8px] bg-container-low/20 min-h-[200px] transition-all duration-300 hover:cyan-bloom">
            <h3 className="font-space font-medium text-[20px] text-primary uppercase group-hover:[text-shadow:0_0_10px_var(--color-primary)] transition-all duration-300">Tools</h3>
            <div className="w-full h-[1px] bg-primary/20 my-2 group-hover:bg-primary transition-all duration-300" />
            <p className="font-mono text-[14px] text-primary/80 leading-[22px] group-hover:text-primary group-hover:[text-shadow:0_0_8px_var(--color-primary)] transition-all duration-300">Git<br/>Figma<br/>Claude<br/>Blender</p>
          </div>

          {/* Cell - Develop */}
          <div className="group cursor-default border-t border-variant-border p-[20px] flex flex-col gap-[8px] bg-container-high/20 min-h-[200px] transition-all duration-300 hover:cyan-bloom">
            <h3 className="font-space font-medium text-[20px] text-primary uppercase group-hover:[text-shadow:0_0_10px_var(--color-primary)] transition-all duration-300">Develop</h3>
            <div className="w-full h-[1px] bg-primary/20 my-2 group-hover:bg-primary transition-all duration-300" />
            <p className="font-mono text-[14px] text-primary/80 leading-[22px] group-hover:text-primary group-hover:[text-shadow:0_0_8px_var(--color-primary)] transition-all duration-300">Agile<br/>CI / CD</p>
          </div>
        </div>
      </div>
    </section>
  );
}
