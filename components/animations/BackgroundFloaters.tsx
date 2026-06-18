import type { ComponentType } from "react";
import {
  CloudNapCharacter,
  RocketBuddyCharacter,
  SnailCharacter,
  StarBuddyCharacter,
} from "@/components/animations/CartoonCharacters";

type FloaterConfig = {
  top: string;
  left: string;
  delay: string;
  duration: string;
  size: number;
  Character: ComponentType<{ size?: number }>;
  className?: string;
};

const FLOATERS: FloaterConfig[] = [
  { top: "18%", left: "12%", delay: "0s", duration: "7s", size: 22, Character: StarBuddyCharacter },
  { top: "62%", left: "82%", delay: "1.4s", duration: "8s", size: 18, Character: StarBuddyCharacter },
  { top: "38%", left: "88%", delay: "2.8s", duration: "6s", size: 20, Character: StarBuddyCharacter },
  { top: "72%", left: "6%", delay: "0.6s", duration: "9s", size: 20, Character: SnailCharacter, className: "bg-floater-snail" },
  { top: "10%", left: "78%", delay: "1.8s", duration: "10s", size: 24, Character: CloudNapCharacter, className: "bg-floater-cloud" },
  { top: "52%", left: "4%", delay: "3.2s", duration: "7.5s", size: 18, Character: RocketBuddyCharacter, className: "bg-floater-rocket" },
  { top: "28%", left: "6%", delay: "2.2s", duration: "8.5s", size: 22, Character: CloudNapCharacter, className: "bg-floater-cloud" },
  { top: "80%", left: "68%", delay: "4s", duration: "9.5s", size: 16, Character: RocketBuddyCharacter, className: "bg-floater-rocket" },
];

export default function BackgroundFloaters() {
  return (
    <div className="bg-floaters" aria-hidden>
      {FLOATERS.map((floater, index) => {
        const { Character } = floater;
        return (
          <span
            key={index}
            className={`bg-floater${floater.className ? ` ${floater.className}` : ""}`}
            style={{
              top: floater.top,
              left: floater.left,
              animationDelay: floater.delay,
              animationDuration: floater.duration,
            }}
          >
            <Character size={floater.size} />
          </span>
        );
      })}
    </div>
  );
}
