import { CatCharacter, MouseCharacter } from "@/components/animations/CartoonCharacters";

/** Edge-peeking chase duo — purely decorative, sits behind app content */
export default function AmbientCartoonPeeks() {
  return (
    <div className="ambient-peeks" aria-hidden>
      <span className="ambient-peek ambient-peek-cat">
        <CatCharacter size={26} running />
      </span>
      <span className="ambient-peek ambient-peek-mouse">
        <MouseCharacter size={22} running />
      </span>
    </div>
  );
}
