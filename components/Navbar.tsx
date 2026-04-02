import Link from 'next/link';

export default function Navbar() {
  const links = ['HOME', 'WORK', 'STACK', 'ABOUT ME', 'CONTACT ME'];

  return (
    <nav className="fixed top-0 left-0 w-full h-[58px] z-50 flex items-center justify-between px-5 font-mono text-[11px] leading-[16px] bg-void/80 backdrop-blur-sm border-b border-ghost-border">
      {/* Nav - Left */}
      <div className="flex items-center gap-3">
        <span className="text-primary font-medium tracking-[2px]">MANUEL ARIAS</span>
        <span className="text-tertiary font-bold">·</span>
        <span className="text-secondary font-medium tracking-[2px]">CREATIVE DEVELOPER</span>
      </div>

      {/* Nav - Links */}
      <div className="flex items-center gap-[40px] md:gap-[66px] uppercase font-medium">
        {links.map((link) => (
          <Link 
            key={link} 
            href={`#${link.toLowerCase().replace(' ', '-')}`} 
            className="text-on-dark-dim hover:text-void hover:bg-tertiary px-2 py-1 -mx-2 transition-none tracking-[2px] font-bold"
          >
            {link}
          </Link>
        ))}
      </div>
    </nav>
  );
}
