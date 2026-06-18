import type { ReactNode } from "react";
import FrameCornerBuddies from "@/components/animations/FrameCornerBuddies";
import { FashionCorner, SparkleStar } from "@/components/svg/FashionDecor";

export default function FashionFrame({ children }: { children: ReactNode }) {
  return (
    <div className="fashion-frame fashion-frame-funky relative flex min-h-0 flex-1 flex-col">
      <div className="fashion-frame-playful" aria-hidden>
        <FashionCorner className="fashion-frame-corner fashion-frame-tl" />
        <FashionCorner className="fashion-frame-corner fashion-frame-tr fashion-frame-mirror-x" />
        <FashionCorner className="fashion-frame-corner fashion-frame-bl fashion-frame-mirror-y" />
        <FashionCorner className="fashion-frame-corner fashion-frame-br fashion-frame-mirror-xy" />
        <SparkleStar size={12} className="fashion-sparkle fashion-sparkle-1 text-cyan-600 dark:text-cyan-400" />
        <SparkleStar size={10} className="fashion-sparkle fashion-sparkle-2 text-violet-600 dark:text-fuchsia-400" />
        <SparkleStar size={8} className="fashion-sparkle fashion-sparkle-3 text-amber-600 dark:text-amber-400" />
        <FrameCornerBuddies />
      </div>
      <div className="fashion-frame-content">{children}</div>
    </div>
  );
}
