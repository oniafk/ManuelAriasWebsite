export default function ZoneA() {
  return (
    <section id="home" className="relative w-full min-h-screen pt-[58px] bg-void flex flex-col justify-between px-[20px] pb-[40px]">
      {/* Zone A - Title Block */}
      <div className="flex flex-col w-full mt-[20px] gap-[40px]">
        {/* H1 - Title Block */}
        <div className="w-full @container relative z-[1]">
          {/* Mobile 3D Canvas Placeholder (Hidden on Desktop) */}
          <div className="absolute inset-0 z-[-1] flex md:hidden border border-secondary items-center justify-center p-[20px] bg-container-low/20 overflow-hidden">
            <span className="font-mono text-secondary text-[11px] uppercase tracking-[2px] text-center opacity-50">3D Canvas (Appears Behind Title on Mobile)</span>
          </div>

          <div className="flex flex-col w-full font-orbitron font-bold text-primary uppercase leading-[0.75] tracking-[-0.04em] gap-[3cqw]">
            <h1 className="text-[12cqw] whitespace-nowrap animate-brutalist" style={{ animationDelay: '100ms' }}>intentional</h1>
            <div className="relative w-max">
              <h1 className="text-[14.5cqw] text-secondary whitespace-nowrap animate-brutalist" style={{ animationDelay: '300ms' }}>mis</h1>
              <div className="absolute left-full ml-[4cqw] top-1/2 -translate-y-1/2 w-[60cqw] flex items-center gap-[4cqw]">
                <p className="font-mono font-normal text-[2.5cqw] leading-[1.6] text-primary normal-case tracking-normal max-w-[50%] animate-brutalist" style={{ animationDelay: '600ms' }}>
                   Engineering premium 3d experiences for the bold
                </p>
                {/* Desktop 3D Canvas Placeholder (Hidden on Mobile) */}
                <div className="relative z-[-1] hidden md:flex flex-1 aspect-video border border-secondary items-center justify-center p-[20px] bg-container-low/50">
                  <span className="font-mono text-secondary text-[11px] uppercase tracking-[2px] text-center">3D Canvas Setup</span>
                </div>
              </div>
            </div>
            <h1 className="text-[14.0cqw] whitespace-nowrap animate-brutalist" style={{ animationDelay: '500ms' }}>alignment</h1>
          </div>
        </div>
      </div>

      {/* Bottom Containers */}
      <div className="flex flex-col md:flex-row gap-[10px] w-full mt-[20px] md:mt-[40px] flex-1 min-h-[400px] md:min-h-0">
        {/* Container 1 - Media */}
        <div className="flex-1 border border-variant-border flex flex-col items-center justify-center p-[24px] bg-container-low relative overflow-hidden">
          <p className="font-space text-primary font-bold text-[20px] mb-4 uppercase text-center">
            terminal mock up <br /> terminal code moving
          </p>
          <span className="font-mono text-[9px] text-on-dark-dim uppercase tracking-[1.5px]">IMAGE / VIDEO PLACEHOLDER</span>
        </div>

        {/* Container 2 - Media */}
        <div className="flex-1 border border-variant-border flex flex-col items-center justify-center p-[24px] bg-container-low relative overflow-hidden">
          <p className="font-space text-magenta font-bold text-[20px] mb-4 uppercase text-center">
            glsl code looping and moving
          </p>
          <span className="font-mono text-[9px] text-on-dark-dim uppercase tracking-[1.5px]">IMAGE / VIDEO PLACEHOLDER</span>
        </div>
      </div>
    </section>
  );
}
