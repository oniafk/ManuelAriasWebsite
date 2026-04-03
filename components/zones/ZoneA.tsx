import MatrixTerminal from '@/components/MatrixTerminal';
import GLSLTerminal from '@/components/GLSLTerminal';
import AsciiText from '@/components/AsciiText';
import HackerBackground from '@/components/HackerBackground';

export default function ZoneA() {
  return (
    <section
      id="home"
      className="relative w-full min-h-screen pt-0 md:pt-[58px] bg-black flex flex-col justify-between px-[20px] pb-[40px]"
    >
      {/* Zone A - Title Block */}
      <div className="flex flex-col w-full mt-[20px] gap-[40px] md:flex-1">
        {/* H1 - Title Block */}
        <div className="w-full @container relative z-[0] min-h-[100dvh] md:min-h-0 md:flex-1 flex flex-col justify-center">
          {/* Hacker Lightning Layout Layer */}
          <HackerBackground />

          <div className="flex flex-col w-full font-orbitron font-bold text-primary uppercase leading-[0.75] tracking-[-0.04em] gap-[3cqw]">
            <AsciiText
              tag="h1"
              text="intentional"
              className="text-[12cqw] whitespace-nowrap animate-brutalist"
              style={{ animationDelay: "100ms" }}
            />
            <div className="relative w-max">
              <AsciiText
                tag="h1"
                text="mis"
                className="text-[14.5cqw] text-secondary whitespace-nowrap animate-brutalist"
                style={{ animationDelay: "300ms" }}
              />
              <div className="absolute left-full ml-[4cqw] top-1/2 -translate-y-1/2 w-[60cqw] flex items-center gap-[4cqw]">
                <AsciiText
                  tag="p"
                  text="Engineering premium 3d experiences for the bold"
                  className="font-mono font-normal text-[2.5cqw] leading-[1.6] text-primary normal-case tracking-normal max-w-[50%] animate-brutalist"
                  style={{ animationDelay: "600ms" }}
                />
                {/* Desktop 3D Canvas Placeholder (Hidden on Mobile) */}
                <div
                  id="cube-anchor"
                  className="relative z-[-1] hidden md:flex flex-1 aspect-video items-center justify-center p-[20px]"
                ></div>
              </div>
            </div>
            <AsciiText
              tag="h1"
              text="alignment"
              className="text-[14.0cqw] whitespace-nowrap animate-brutalist z-10"
              style={{ animationDelay: "500ms" }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Containers */}
      <div className="flex flex-col md:flex-row gap-[10px] w-full mt-[20px] md:mt-[40px] h-[50vh] md:h-[25vh] md:max-h-[25vh]">
        {/* Container 1 - Matrix Terminal */}
        <div className="flex-1 border border-variant-border relative overflow-hidden">
          <MatrixTerminal />
        </div>

        {/* Container 2 - GLSL Terminal */}
        <div className="flex-1 border border-variant-border relative overflow-hidden">
          <GLSLTerminal />
        </div>
      </div>
    </section>
  );
}
