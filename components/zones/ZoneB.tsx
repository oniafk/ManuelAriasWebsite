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

export default function ZoneB() {
  return (
    <section
      id="work"
      className="relative w-full min-h-screen  overflow-hidden z-20"
    >
      {/* Video background anchor — WebGLScene renders the video here */}
      <div
        id="video-bg-anchor"
        className="absolute inset-0 w-full h-full "
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
        <div className="flex-1 flex flex-col md:flex-row justify-between items-start w-full px-[10px] md:px-[60px] lg:px-[100px] mt-[20px] pb-[40px]">
          
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-[40px] w-[50%] md:w-[25%] lg:w-[15%]">
            {/* Cell - Languages */}
            <div className="group cursor-default p-[20px] md:px-[30px] md:py-[20px] flex flex-col gap-[8px] min-h-[150px] rounded-[20px] transition-all duration-500 hologram z-10 hover:scale-105">
              <div className="scan-line" style={{ animationDelay: "-2540ms", animationDuration: "3.1s" }} />
              <AsciiText
                tag="h3"
                text="LANGUAGES"
                className="font-space font-medium text-[20px] text-white uppercase group-hover:cyan-text-glow transition-all duration-500"
              />
              <div className="w-full h-[1px] bg-primary/20 my-2 group-hover:bg-primary transition-all duration-500" />
              <ul className="flex flex-col gap-[8px]">
                {techData.languages.map((item, idx) => (
                  <li key={idx} className="flex flex-row items-center gap-[10px] group/item">
                    <item.Icon className="text-[18px] text-white/50 group-hover/item:text-primary transition-all duration-500" />
                    <AsciiText
                      tag="span"
                      text={item.name}
                      className="font-mono text-[14px] text-white/80 group-hover/item:text-white transition-all duration-500"
                    />
                  </li>
                ))}
              </ul>
            </div>

            {/* Cell - Front */}
            <div className="group cursor-default p-[20px] md:px-[30px] md:py-[20px] flex flex-col gap-[8px] min-h-[150px] rounded-[20px] transition-all duration-500 hologram z-10 hover:scale-105">
              <div className="scan-line" style={{ animationDelay: "-120ms", animationDuration: "1.7s" }} />
              <AsciiText
                tag="h3"
                text="FRONT"
                className="font-space font-medium text-[20px] text-white uppercase group-hover:cyan-text-glow transition-all duration-500"
              />
              <div className="w-full h-[1px] bg-primary/20 my-2 group-hover:bg-primary transition-all duration-500" />
              <ul className="flex flex-col gap-[8px]">
                {techData.front.map((item, idx) => (
                  <li key={idx} className="flex flex-row items-center gap-[10px] group/item">
                    <item.Icon className="text-[18px] text-white/50 group-hover/item:text-primary transition-all duration-500" />
                    <AsciiText
                      tag="span"
                      text={item.name}
                      className="font-mono text-[14px] text-white/80 group-hover/item:text-white transition-all duration-500"
                    />
                  </li>
                ))}
              </ul>
            </div>

            {/* Cell - Back */}
            <div className="group cursor-default p-[20px] md:px-[30px] md:py-[20px] flex flex-col gap-[8px] min-h-[150px] rounded-[20px] transition-all duration-500 hologram z-10 hover:scale-105">
              <div className="scan-line" style={{ animationDelay: "-4500ms", animationDuration: "4.2s" }} />
              <AsciiText
                tag="h3"
                text="BACK"
                className="font-space font-medium text-[20px] text-white uppercase group-hover:cyan-text-glow transition-all duration-500"
              />
              <div className="w-full h-[1px] bg-primary/20 my-2 group-hover:bg-primary transition-all duration-500" />
              <ul className="flex flex-col gap-[8px]">
                {techData.back.map((item, idx) => (
                  <li key={idx} className="flex flex-row items-center gap-[10px] group/item">
                    <item.Icon className="text-[18px] text-white/50 group-hover/item:text-primary transition-all duration-500" />
                    <AsciiText
                      tag="span"
                      text={item.name}
                      className="font-mono text-[14px] text-white/80 group-hover/item:text-white transition-all duration-500"
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-[40px] w-[50%] md:w-[25%] lg:w-[15%] items-end md:items-stretch self-end md:self-auto">
            {/* Cell - Data */}
            <div className="group cursor-default p-[20px] md:px-[30px] md:py-[20px] flex flex-col gap-[8px] min-h-[150px] rounded-[20px] transition-all duration-500 hologram z-10 hover:scale-105">
              <div className="scan-line" style={{ animationDelay: "-3100ms", animationDuration: "2.5s" }} />
              <div className="flex w-full justify-end md:justify-start">
                <AsciiText
                  tag="h3"
                  text="DATA"
                  className="font-space font-medium text-[20px] text-white uppercase group-hover:cyan-text-glow transition-all duration-500"
                />
              </div>
              <div className="w-full h-[1px] bg-primary/20 my-2 group-hover:bg-primary transition-all duration-500" />
              <ul className="flex flex-col gap-[8px] items-end md:items-start">
                {techData.data.map((item, idx) => (
                  <li key={idx} className="flex flex-row items-center gap-[10px] group/item">
                    <div className="flex md:hidden">
                      <AsciiText
                        tag="span"
                        text={item.name}
                        className="font-mono text-[14px] text-white/80 group-hover/item:text-white transition-all duration-500"
                      />
                    </div>
                    <item.Icon className="text-[18px] text-white/50 group-hover/item:text-primary transition-all duration-500" />
                    <div className="hidden md:flex">
                      <AsciiText
                        tag="span"
                        text={item.name}
                        className="font-mono text-[14px] text-white/80 group-hover/item:text-white transition-all duration-500"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cell - Tools */}
            <div className="group cursor-default p-[20px] md:px-[30px] md:py-[20px] flex flex-col gap-[8px] min-h-[150px] rounded-[20px] transition-all duration-500 hologram z-10 hover:scale-105">
              <div className="scan-line" style={{ animationDelay: "-800ms", animationDuration: "5.0s" }} />
              <div className="flex w-full justify-end md:justify-start">
                <AsciiText
                  tag="h3"
                  text="TOOLS"
                  className="font-space font-medium text-[20px] text-white uppercase group-hover:cyan-text-glow transition-all duration-500"
                />
              </div>
              <div className="w-full h-[1px] bg-primary/20 my-2 group-hover:bg-primary transition-all duration-500" />
              <ul className="flex flex-col gap-[8px] items-end md:items-start">
                {techData.tools.map((item, idx) => (
                  <li key={idx} className="flex flex-row items-center gap-[10px] group/item">
                    <div className="flex md:hidden">
                      <AsciiText
                        tag="span"
                        text={item.name}
                        className="font-mono text-[14px] text-white/80 group-hover/item:text-white transition-all duration-500"
                      />
                    </div>
                    <item.Icon className="text-[18px] text-white/50 group-hover/item:text-primary transition-all duration-500" />
                    <div className="hidden md:flex">
                      <AsciiText
                        tag="span"
                        text={item.name}
                        className="font-mono text-[14px] text-white/80 group-hover/item:text-white transition-all duration-500"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cell - Develop */}
            <div className="group cursor-default p-[20px] md:px-[30px] md:py-[20px] flex flex-col gap-[8px] min-h-[150px] rounded-[20px] transition-all duration-500 hologram z-10 hover:scale-105">
              <div className="scan-line" style={{ animationDelay: "-2200ms", animationDuration: "2.1s" }} />
              <div className="flex w-full justify-end md:justify-start">
                <AsciiText
                  tag="h3"
                  text="DEVELOP"
                  className="font-space font-medium text-[20px] text-white uppercase group-hover:cyan-text-glow transition-all duration-500"
                />
              </div>
              <div className="w-full h-[1px] bg-primary/20 my-2 group-hover:bg-primary transition-all duration-500" />
              <ul className="flex flex-col gap-[8px] items-end md:items-start">
                {techData.develop.map((item, idx) => (
                  <li key={idx} className="flex flex-row items-center gap-[10px] group/item">
                    <div className="flex md:hidden">
                      <AsciiText
                        tag="span"
                        text={item.name}
                        className="font-mono text-[14px] text-white/80 group-hover/item:text-white transition-all duration-500"
                      />
                    </div>
                    <item.Icon className="text-[18px] text-white/50 group-hover/item:text-primary transition-all duration-500" />
                    <div className="hidden md:flex">
                      <AsciiText
                        tag="span"
                        text={item.name}
                        className="font-mono text-[14px] text-white/80 group-hover/item:text-white transition-all duration-500"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
