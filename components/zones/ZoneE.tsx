export default function ZoneE() {
  return (
    <section id="contact" className="relative w-full min-h-screen pt-[58px] bg-transparent flex flex-col border-t border-variant-border">
      {/* 3D Contact Helmet Anchor */}
      <div id="contact-helmet-anchor" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 pointer-events-none" />
      {/* Grid of 2 Columns */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 w-full">
        
        {/* Left Side */}
        <div className="py-[40px] pr-[40px] pl-[80px] md:pl-[120px] lg:pl-[160px] flex justify-start items-center bg-transparent min-h-screen md:min-h-0 pointer-events-none">
          <div className="flex flex-col items-center gap-y-2 border-4 rounded-[24px] box-neon-magenta px-[40px] py-[40px] pointer-events-auto">
            <span className="text-[6vh] md:text-[8vh] font-orbitron font-bold neon-magenta tracking-[-2px] leading-none select-none">C</span>
            <span className="text-[6vh] md:text-[8vh] font-orbitron font-bold neon-magenta tracking-[-2px] leading-none select-none flicker-slow">O</span>
            <span className="text-[6vh] md:text-[8vh] font-orbitron font-bold neon-magenta tracking-[-2px] leading-none select-none">N</span>
            <span className="text-[6vh] md:text-[8vh] font-orbitron font-bold neon-magenta tracking-[-2px] leading-none select-none flicker-fast">T</span>
            <span className="text-[6vh] md:text-[8vh] font-orbitron font-bold neon-magenta tracking-[-2px] leading-none select-none">A</span>
            <span className="text-[6vh] md:text-[8vh] font-orbitron font-bold neon-magenta tracking-[-2px] leading-none select-none">C</span>
            <span className="text-[6vh] md:text-[8vh] font-orbitron font-bold neon-magenta tracking-[-2px] leading-none select-none flicker-slow">T</span>
          </div>
        </div>

        {/* Right Side - Social Links */}
        <div className="flex flex-col justify-center items-end gap-y-[80px] md:gap-y-[120px] pr-[40px] md:pr-[80px] lg:pr-[120px] h-full bg-transparent pointer-events-none w-full">
          
          {/* X (Twitter) Logo */}
          <div className="border-4 rounded-[24px] box-neon-magenta p-[30px] md:p-[40px] text-[#FFD5FF] flicker-slow cursor-pointer pointer-events-auto hover:bg-magenta/20 transition-colors">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-[50px] h-[50px] md:w-[80px] md:h-[80px]">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </div>
          
          {/* LinkedIn Logo */}
          <div className="border-4 rounded-[24px] box-neon-magenta p-[30px] md:p-[40px] text-[#FFD5FF] flicker-fast cursor-pointer pointer-events-auto hover:bg-magenta/20 transition-colors">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-[50px] h-[50px] md:w-[80px] md:h-[80px]">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </div>
          
        </div>
      </div>
    </section>
  );
}
