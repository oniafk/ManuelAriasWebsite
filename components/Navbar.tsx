import Link from 'next/link';

export default function Navbar() {
  const links = ['HOME', 'WORK', 'STACK', 'ABOUT ME', 'CONTACT ME'];

  return (
    <nav className="fixed hidden md:flex top-0 left-0 w-full h-[58px] z-50 items-center justify-between px-[10px] md:px-[20px] font-mono text-[9px] md:text-[10px] lg:text-[11px] leading-[16px] bg-void/80 backdrop-blur-sm border-b border-ghost-border max-w-[100vw] overflow-x-hidden box-border">
      {/* Nav - Left */}
      <div className="flex items-center gap-1 md:gap-2 lg:gap-3 flex-shrink-0">
        <span className="text-primary font-medium tracking-normal md:tracking-[1px] lg:tracking-[2px]">MANUEL ARIAS</span>
        <span className="text-tertiary font-bold">·</span>
        <span className="text-secondary font-medium tracking-normal md:tracking-[1px] lg:tracking-[2px]">CREATIVE DEVELOPER</span>
      </div>

      {/* Nav - Links */}
      <div className="flex items-center gap-[8px] md:gap-[15px] lg:gap-[40px] xl:gap-[66px] uppercase font-medium flex-nowrap">
        {links.map((link) => (
          <Link 
            key={link} 
            href={`#${link.toLowerCase().replace(' ', '-')}`} 
            className="text-on-dark-dim hover:text-void hover:bg-tertiary px-[4px] md:px-2 py-1 transition-none tracking-normal md:tracking-[1px] lg:tracking-[2px] font-bold whitespace-nowrap"
          >
            {link}
          </Link>
        ))}
      </div>
    </nav>
  );
}
