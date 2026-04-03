import Navbar from '@/components/Navbar';
import WebGLCanvas from '@/components/webgl/WebGLCanvas';
import ZoneA from '@/components/zones/ZoneA';
import ZoneB from '@/components/zones/ZoneB';
import ZoneC from '@/components/zones/ZoneC';
import ZoneD from '@/components/zones/ZoneD';
import ZoneE from '@/components/zones/ZoneE';

export default function Home() {
  return (
    <>
      <WebGLCanvas />
      <Navbar />
      <main className="flex flex-col w-full relative">
        <ZoneA />
        <ZoneB />
        <ZoneC />
        <ZoneD />
        <ZoneE />
      </main>
    </>
  );
}
