import { useRef, type ReactNode } from "react";
import "../landing.css";

export function HangRail({ children }: { children: ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, dragging: false, x: 0, left: 0 });

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const el = trackRef.current;
    if (!el) return;
    drag.current = {
      active: true,
      dragging: false,
      x: e.clientX,
      left: el.scrollLeft,
    };
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = trackRef.current;
    if (!el || !drag.current.active) return;
    const delta = e.clientX - drag.current.x;
    if (!drag.current.dragging && Math.abs(delta) < 8) return;
    drag.current.dragging = true;
    el.scrollLeft = drag.current.left - delta;
  }

  function onPointerUp() {
    drag.current.active = false;
    drag.current.dragging = false;
  }

  return (
    <div className="hp-rail-wrap ag-hang-wrap">
      <div className="hp-rail" />
      <div
        className="hp-track"
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <article className="hp-hang is-on ag-hang">
          <div className="hp-clip" />
          {children}
        </article>
      </div>
    </div>
  );
}