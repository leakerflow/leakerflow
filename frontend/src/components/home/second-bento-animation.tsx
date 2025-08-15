import { Icons } from '@/components/home/icons';
import { OrbitingCircles } from '@/components/home/ui/orbiting-circle';

export function SecondBentoAnimation() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <div className="pointer-events-none absolute bottom-0 left-0 h-20 w-full bg-gradient-to-t from-background to-transparent z-20"></div>
      <div className="pointer-events-none absolute top-0 left-0 h-20 w-full bg-gradient-to-b from-background to-transparent z-20"></div>

      <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 size-16 bg-black p-2 rounded-full z-30 md:bottom-0 md:top-auto">
        <img 
          src="/leakerflow-symbol.svg" 
          alt="LeakerFlow Symbol" 
          className="size-10 filter brightness-0 invert"
        />
      </div>
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
        <div className="relative flex h-full w-full items-center justify-center translate-y-0 md:translate-y-32">
          <OrbitingCircles
            index={0}
            iconSize={60}
            radius={100}
            reverse
            speed={1}
          >
            <div className="size-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100">
              <img src="https://cdn.simpleicons.org/instagram" alt="Instagram" className="size-8" />
            </div>
            <div className="size-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100">
              <img src="https://cdn.simpleicons.org/tiktok" alt="TikTok" className="size-8" />
            </div>
            <div className="size-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100">
              <img src="https://cdn.simpleicons.org/x" alt="X (Twitter)" className="size-8" />
            </div>
          </OrbitingCircles>

          <OrbitingCircles index={1} iconSize={60} speed={0.5}>
            <div className="size-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100">
              <img src="https://cdn.simpleicons.org/youtube" alt="YouTube" className="size-8" />
            </div>
            <div className="size-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100">
              <img src="https://cdn.simpleicons.org/twitch" alt="Twitch" className="size-8" />
            </div>
            <div className="size-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100">
              <img src="https://cdn.simpleicons.org/reddit" alt="Reddit" className="size-8" />
            </div>
          </OrbitingCircles>

          <OrbitingCircles
            index={2}
            iconSize={60}
            radius={230}
            reverse
            speed={0.5}
          >
            <div className="size-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100">
              <img src="https://cdn.simpleicons.org/discord" alt="Discord" className="size-8" />
            </div>
            <div className="size-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100">
              <img src="https://cdn.simpleicons.org/rockstargames" alt="Rockstar Games" className="size-8" />
            </div>
            <div className="size-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100">
              <img src="https://cdn.simpleicons.org/gamespot" alt="Gaming News" className="size-8" />
            </div>
          </OrbitingCircles>
        </div>
      </div>
    </div>
  );
}
