export default function ZoneC() {
  return (
    <section id="about-me" className="relative w-full min-h-screen pt-[58px] bg-void flex flex-col border-t border-variant-border">
      {/* 3D Model Anchor - Centered inside Zone C */}
      <div id="helmet-anchor" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 pointer-events-none" />
      <div className="flex flex-col lg:flex-row w-full flex-1">
        
        {/* Left Column - List of Inspirations */}
        <div className="flex-1 grid grid-rows-5 h-[400px] lg:h-auto p-[20px] lg:p-[40px] text-on-dark gap-y-4 relative z-20">
          {/* Row 1 */}
          <div className="flex items-center justify-center w-full h-full group cursor-default">
             <span data-text="post processing" className="font-bold text-[6xl] lg:text-[80px] xl:text-[96px] leading-none tracking-normal group-hover:text-on-dark transition-colors text-on-dark-dim cyber-glitch-hover" style={{ fontFamily: '"Pathway Gothic One", sans-serif' }}>post processing</span>
          </div>
          {/* Row 2 */}
          <div className="flex items-center justify-end w-full h-full group cursor-default">
             <span data-text="music" className="font-bold text-[6xl] lg:text-[80px] xl:text-[96px] leading-none tracking-normal group-hover:text-on-dark transition-colors text-on-dark-dim cyber-glitch-hover" style={{ fontFamily: '"Pixelify Sans", sans-serif' }}>music</span>
          </div>
          {/* Row 3 */}
          <div className="flex items-end justify-start w-full h-full group cursor-default">
             <span data-text="SPORTS" className="font-bold text-[3xl] lg:text-[48px] uppercase leading-none tracking-normal group-hover:text-on-dark transition-colors text-on-dark-dim cyber-glitch-hover" style={{ fontFamily: '"Porter Sans Block", sans-serif' }}>SPORTS</span>
          </div>
          {/* Row 4 */}
          <div className="flex items-start justify-start w-full h-full group cursor-default">
             <span data-text="cloths" className="font-bold text-[5xl] lg:text-[64px] leading-none tracking-normal group-hover:text-on-dark transition-colors text-on-dark-dim cyber-glitch-hover" style={{ fontFamily: '"Post No Bills Colombo", sans-serif' }}>cloths</span>
          </div>
          {/* Row 5 - Split in 2 */}
          <div className="flex items-center justify-between w-full h-full">
            <div className="flex items-center justify-start group cursor-default mt-4 lg:mt-8">
               <span data-text="ART" className="font-bold text-[6xl] lg:text-[96px] xl:text-[128px] uppercase leading-[0.8] group-hover:text-on-dark transition-colors text-on-dark-dim cyber-glitch-hover" style={{ fontFamily: '"Rubik Glitch", sans-serif' }}>ART</span>
            </div>
            <div className="flex flex-1 items-end justify-end group cursor-default pb-2">
               <span data-text="cities" className="font-bold text-[2xl] lg:text-[36px] tracking-[3.6px] leading-none group-hover:text-on-dark transition-colors text-on-dark-dim cyber-glitch-hover" style={{ fontFamily: '"Tektur", sans-serif' }}>cities</span>
            </div>
          </div>
        </div>

        {/* Right Column - Title Grid (3 Rows) */}
        <div className="flex-1 grid grid-rows-3 @container relative z-20">
          {/* Row 1 */}
          <div className="flex items-center justify-end p-[40px] bg-container-high/20 cursor-default group">
            <h2 data-text="WHAT" className="font-orbitron font-bold text-[16cqw] text-on-dark uppercase whitespace-nowrap leading-[0.8] tracking-[-0.04em] cyber-glitch-hover">WHAT</h2>
          </div>
          {/* Row 2 */}
          <div className="flex items-center justify-end p-[40px] bg-container-lowest cursor-default group">
            <h2 data-text="INSPIRES" className="font-orbitron font-bold text-[16cqw] text-on-dark uppercase whitespace-nowrap leading-[0.8] tracking-[-0.04em] cyber-glitch-hover">INSPIRES</h2>
          </div>
          {/* Row 3 */}
          <div className="flex items-center justify-end p-[40px] bg-container-highest/20 cursor-default group">
            <h2 data-text="ME" className="font-orbitron font-bold text-[16cqw] text-on-dark uppercase whitespace-nowrap leading-[0.8] tracking-[-0.04em] cyber-glitch-hover">ME</h2>
          </div>
        </div>
        
      </div>
    </section>
  );
}
