import CountdownOverlay from "@/components/CountdownOverlay";
import ElectronBodyClass from "@/components/ElectronBodyClass";
import SessionStatusRow from "@/components/SessionStatusRow";
import IntervalMismatchBanner from "@/components/IntervalMismatchBanner";
import IPhoneShell from "@/components/IPhoneShell";
import FashionFrame from "@/components/FashionFrame";
import TimerPanel from "@/components/TimerPanel";

export default function Home() {
  return (
    <div className="h-full w-full overflow-hidden">
      <ElectronBodyClass />
      <IPhoneShell>
        <FashionFrame>
          <div className="app-sections app-sections-funky">
            <section className="app-section-top">
              <IntervalMismatchBanner />
              <div className="animate-stagger-in" style={{ animationDelay: "0ms" }}>
                <SessionStatusRow />
              </div>
            </section>

            <section className="app-section-main">
              <div className="animate-stagger-in app-section-timer" style={{ animationDelay: "80ms" }}>
                <TimerPanel />
              </div>
            </section>
          </div>
        </FashionFrame>
      </IPhoneShell>
      <CountdownOverlay />
    </div>
  );
}
