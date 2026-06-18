import { RocketBuddyCharacter, SnailCharacter } from "@/components/animations/CartoonCharacters";

export default function FrameCornerBuddies() {
  return (
    <>
      <span className="frame-corner-buddy frame-corner-buddy-tl" aria-hidden>
        <RocketBuddyCharacter size={18} />
      </span>
      <span className="frame-corner-buddy frame-corner-buddy-br" aria-hidden>
        <SnailCharacter size={16} />
      </span>
    </>
  );
}
