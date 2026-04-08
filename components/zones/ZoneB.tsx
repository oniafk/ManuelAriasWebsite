'use client';

import { useState } from 'react';
import AsciiText from '@/components/AsciiText';
import {
  SiJavascript,
  SiPython,
  SiTypescript,
  SiReact,
  SiNextdotjs,
  SiWebgl,
  SiThreedotjs,
  SiNodedotjs,
  SiExpress,
  SiSupabase,
  SiGit,
  SiFigma,
  SiBlender,
} from 'react-icons/si';
import { FaServer, FaDatabase, FaRobot, FaSyncAlt, FaInfinity } from 'react-icons/fa';
import { RiArrowUpDoubleFill, RiArrowDownDoubleFill } from 'react-icons/ri';

const techData = {
  languages: [
    { name: "JavaScript", Icon: SiJavascript },
    { name: "Python", Icon: SiPython },
    { name: "TypeScript", Icon: SiTypescript },
  ],
  front: [
    { name: "React", Icon: SiReact },
    { name: "Next.js", Icon: SiNextdotjs },
    { name: "WebGL", Icon: SiWebgl },
    { name: "Three.js", Icon: SiThreedotjs },
  ],
  back: [
    { name: "Node.js", Icon: SiNodedotjs },
    { name: "Express.js", Icon: SiExpress },
    { name: "Hono.js", Icon: FaServer }, 
  ],
  data: [
    { name: "SQL", Icon: FaDatabase },
    { name: "Supabase", Icon: SiSupabase },
  ],
  tools: [
    { name: "Git", Icon: SiGit },
    { name: "Figma", Icon: SiFigma },
    { name: "Claude", Icon: FaRobot },
    { name: "Blender", Icon: SiBlender },
  ],
  develop: [
    { name: "Agile", Icon: FaSyncAlt },
    { name: "CI / CD", Icon: FaInfinity },
  ]
};

function TechCard({ title, items, delay, duration }: { title: string, items: any[], delay: string, duration: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`group cursor-default flex flex-col gap-[8px] md:min-h-[150px] rounded-[20px] transition-all duration-500 hologram z-10 hover:scale-[1.02] md:hover:scale-105 px-[20px] md:px-[30px] md:py-[20px] ${isOpen ? 'py-[20px]' : 'py-[12px]'}`}>
      <div className="scan-line" style={{ animationDelay: delay, animationDuration: duration }} />
      
      {/* Title & Toggle */}
      <div 
        className="flex w-full justify-between items-center cursor-pointer md:cursor-default"
        onClick={() => setIsOpen(!isOpen)}
      >
        <AsciiText
          tag="h3"
          text={title}
          className="font-space font-medium text-[20px] text-white uppercase group-hover:cyan-text-glow transition-all duration-500"
        />
        <div className="md:hidden text-white/50 group-hover:text-primary transition-all duration-500">
           {isOpen ? <RiArrowUpDoubleFill size={24} /> : <RiArrowDownDoubleFill size={24} />}
        </div>
      </div>
      
      <div className={`w-full h-[1px] bg-primary/20 group-hover:bg-primary transition-all duration-500 ${isOpen ? 'my-2' : 'mt-2 mb-0 md:my-2'}`} />
      
      {/* Mobile conditionally hidden, Desktop always visible */}
      <div 
        className={`overflow-hidden transition-all duration-500 flex flex-col ${isOpen ? 'max-h-[600px] opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0 md:mt-2 md:max-h-[600px] md:opacity-100'}`}
      >
        <ul className="flex flex-col gap-[12px] md:gap-[8px]">
          {items.map((item, idx) => (
            <li key={idx} className="flex flex-row items-center gap-[12px] md:gap-[10px] group/item py-[4px] md:py-0">
              <item.Icon className="text-[20px] md:text-[18px] text-white/50 group-hover/item:text-primary transition-all duration-500" />
              <AsciiText
                tag="span"
                text={item.name}
                className="font-mono text-[15.5px] md:text-[14px] text-white/80 group-hover/item:text-white transition-all duration-500"
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function ZoneB() {
  return (
    <section
      id="work"
      className="relative w-full min-h-screen overflow-hidden z-20"
    >
      {/* Video background anchor — WebGLScene renders the video here */}
      <div
        id="video-bg-anchor"
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      />

      {/* Content overlay */}
      <div className="relative z-[1] flex flex-col w-full min-h-screen pt-[58px]">
        {/* Title Block */}
        <div className="w-full @container relative py-[40px] px-[20px]">
          <div className="flex flex-row items-center w-full font-orbitron font-bold uppercase leading-[0.75] tracking-[-0.04em] gap-[4cqw]">
            <AsciiText
              tag="h2"
              text="WHAT I"
              className="text-[12cqw] text-primary whitespace-nowrap [text-shadow:0_0_8px_var(--color-primary),0_0_20px_var(--color-primary-dim)]"
            />
            <AsciiText
              tag="h2"
              text="BUILD"
              className="text-[12cqw] text-primary whitespace-nowrap [text-shadow:0_0_8px_var(--color-primary),0_0_20px_var(--color-primary-dim)]"
            />
          </div>
        </div>

        {/* Split Tech Layout */}
        <div className="flex-1 flex flex-col md:flex-row justify-between items-start w-full px-[10px] md:px-[60px] lg:px-[100px] mt-[20px] pb-[40px] gap-[20px] md:gap-0">
          
          {/* LEFT COLUMN - Top half of 75% stack on mobile */}
          <div className="flex flex-col gap-[30px] md:gap-[40px] w-[75%] mx-auto md:mx-0 md:w-[25%] lg:w-[15%]">
            <TechCard title="LANGUAGES" items={techData.languages} delay="-2540ms" duration="3.1s" />
            <TechCard title="FRONT" items={techData.front} delay="-120ms" duration="1.7s" />
            <TechCard title="BACK" items={techData.back} delay="-4500ms" duration="4.2s" />
          </div>

          {/* RIGHT COLUMN - Bottom half of 75% stack on mobile */}
          <div className="flex flex-col gap-[30px] md:gap-[40px] w-[75%] mx-auto md:mx-0 md:w-[25%] lg:w-[15%] items-stretch">
            <TechCard title="DATA" items={techData.data} delay="-3100ms" duration="2.5s" />
            <TechCard title="TOOLS" items={techData.tools} delay="-800ms" duration="5.0s" />
            <TechCard title="DEVELOP" items={techData.develop} delay="-2200ms" duration="2.1s" />
          </div>

        </div>
      </div>
    </section>
  );
}
