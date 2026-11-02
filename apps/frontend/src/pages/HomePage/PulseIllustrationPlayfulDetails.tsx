import { useEffect, useRef, useState } from 'react';

const BLOW_MS = 900;
const TRAIL_MAX = 6;
const TRAIL_INTERVAL_MS = 80;
const TRAIL_LIFE_MS = 480;
/** Drop / restart trail if consecutive samples jump farther than this (px). */
const TRAIL_MAX_GAP_PX = 56;

/**
 * Foot anchors on circular nodes: left higher on the rising arm, center on valley, right on rim.
 */
const PINWHEEL_SPOTS = [
  { id: 'a', left: '16%', top: '48%' },
  { id: 'b', left: '52%', top: '82%' },
  { id: 'c', left: '79%', top: '62%' },
] as const;

type PinId = (typeof PINWHEEL_SPOTS)[number]['id'];

type TrailDot = { id: number; planeId: string; x: number; y: number; born: number };

/**
 * Mixed directions: LTR, RTL, and paths that reverse mid-flight.
 * Coords ≈ px inside the illustration wrap.
 */
const PLANE_PATHS = [
  /* left → right, gentle wave */
  'M -40,200 C 200,175 420,220 640,190 C 860,160 1080,200 1300,175 C 1480,155 1620,180 1750,170',
  /* right → left */
  'M 1750,230 C 1550,210 1320,250 1100,220 C 880,190 660,240 440,210 C 260,190 80,220 -40,200',
  /* left → right then turn back left */
  'M -40,170 C 180,150 400,190 620,160 C 820,135 980,150 1080,180 C 1180,210 1120,250 920,255 C 700,260 420,240 180,220 C 60,210 -20,200 -40,195',
  /* right → left then swing right again */
  'M 1750,190 C 1500,170 1280,210 1050,185 C 860,165 740,155 620,175 C 480,200 520,245 720,250 C 960,255 1280,230 1580,210 C 1680,200 1740,195 1750,192',
  /* diagonal-ish LTR with height change */
  'M -40,280 C 220,240 480,160 760,150 C 1000,142 1240,180 1500,220 C 1620,240 1700,250 1750,255',
  /* RTL higher corridor */
  'M 1750,140 C 1480,155 1200,130 940,160 C 700,185 460,150 240,175 C 100,190 20,200 -40,205',
] as const;

type PlaneConfig = {
  id: string;
  path: string;
  durationSec: number;
  delaySec: number;
};

function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i];
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}

function pickPlanes(): PlaneConfig[] {
  const paths = shuffle(PLANE_PATHS).slice(0, 3);
  return paths.map((path, i) => ({
    id: `p${i}`,
    path,
    durationSec: 16 + Math.random() * 10,
    delaySec: i * (2.5 + Math.random() * 2) + Math.random() * 1.5,
  }));
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

/**
 * Small lively overlays on the Pulse home illustration: pinwheels on nodes + paper planes.
 */
export function PulseIllustrationPlayfulDetails() {
  const [blowingId, setBlowingId] = useState<PinId | null>(null);
  const [planes] = useState(pickPlanes);
  const [trail, setTrail] = useState<TrailDot[]>([]);
  const blowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const trailIdRef = useRef(0);
  const lastEmitRef = useRef(0);
  const lastPosRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  useEffect(() => {
    return () => {
      if (blowTimerRef.current != null) clearTimeout(blowTimerRef.current);
    };
  }, []);

  /* Emit short trail behind each plane; break on teleport / off-screen / animation loop */
  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    let raf = 0;
    const tick = (now: number) => {
      const root = rootRef.current;
      if (!root) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const shouldEmit = now - lastEmitRef.current >= TRAIL_INTERVAL_MS;
      setTrail((prev) => {
        const alive = prev.filter((d) => now - d.born < TRAIL_LIFE_MS);
        if (!shouldEmit && alive.length === prev.length) return prev;
        let next = alive;
        if (shouldEmit) {
          lastEmitRef.current = now;
          const wr = root.getBoundingClientRect();
          const planeEls = root.querySelectorAll<HTMLElement>('.pulse-illust-plane');
          planeEls.forEach((el, planeIdx) => {
            const planeId = el.dataset.planeId ?? `p${planeIdx}`;
            const r = el.getBoundingClientRect();
            if (r.width < 2) return;
            const x = r.left + r.width * 0.15 - wr.left;
            const y = r.top + r.height * 0.5 - wr.top;
            /* Skip while off-screen or parked before animation applies offset-path */
            const inView = x > 8 && x < wr.width - 8 && y > 0 && y < wr.height;
            if (!inView) {
              lastPosRef.current.delete(planeId);
              next = next.filter((d) => d.planeId !== planeId);
              return;
            }
            const last = lastPosRef.current.get(planeId);
            if (last && dist(last, { x, y }) > TRAIL_MAX_GAP_PX) {
              next = next.filter((d) => d.planeId !== planeId);
            }
            lastPosRef.current.set(planeId, { x, y });
            trailIdRef.current += 1;
            next = [
              ...next,
              {
                id: trailIdRef.current,
                planeId,
                x,
                y,
                born: now,
              },
            ];
          });
          const byPlane = new Map<string, TrailDot[]>();
          for (const dot of next) {
            const list = byPlane.get(dot.planeId) ?? [];
            list.push(dot);
            byPlane.set(dot.planeId, list);
          }
          next = [];
          for (const list of byPlane.values()) {
            next.push(...(list.length > TRAIL_MAX ? list.slice(-TRAIL_MAX) : list));
          }
        }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const triggerBlow = (id: PinId) => {
    setBlowingId(id);
    if (blowTimerRef.current != null) clearTimeout(blowTimerRef.current);
    blowTimerRef.current = setTimeout(() => {
      setBlowingId(null);
      blowTimerRef.current = null;
    }, BLOW_MS);
  };

  return (
    <div className="pulse-illust-playful" ref={rootRef}>
      <svg className="pulse-illust-trail-layer" aria-hidden>
        {trail.map((d, i, arr) => {
          const prevSame = [...arr.slice(0, i)].reverse().find((p) => p.planeId === d.planeId);
          if (!prevSame || dist(prevSame, d) > TRAIL_MAX_GAP_PX) {
            return (
              <circle
                key={d.id}
                className="pulse-illust-trail-dash"
                cx={d.x}
                cy={d.y}
                r={1.4}
                fill="var(--pulse-empty-9)"
              />
            );
          }
          return (
            <line
              key={d.id}
              className="pulse-illust-trail-dash"
              x1={prevSame.x}
              y1={prevSame.y}
              x2={d.x}
              y2={d.y}
              stroke="var(--pulse-empty-9)"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeDasharray="4 5"
            />
          );
        })}
      </svg>

      {planes.map((plane) => (
        <div
          key={plane.id}
          className="pulse-illust-plane"
          data-plane-id={plane.id}
          aria-hidden
          style={{
            offsetPath: `path('${plane.path}')`,
            animationDuration: `${plane.durationSec}s`,
            animationDelay: `${plane.delaySec}s`,
          }}
        >
          <svg
            className="pulse-illust-plane-svg"
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            focusable="false"
          >
            <g className="pulse-illust-plane-icon" transform="rotate(45 12 12)">
              <path
                d="M10 14l11 -11"
                stroke="var(--pulse-empty-9)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5"
                stroke="var(--pulse-empty-9)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </svg>
        </div>
      ))}

      {PINWHEEL_SPOTS.map((spot) => (
        <button
          key={spot.id}
          type="button"
          data-pin-id={spot.id}
          className={`pulse-illust-pinwheel${blowingId === spot.id ? ' pulse-illust-pinwheel--blow' : ''}`}
          style={{ left: spot.left, top: spot.top }}
          aria-label="Spin the pinwheel"
          onPointerEnter={() => triggerBlow(spot.id)}
          onClick={() => triggerBlow(spot.id)}
        >
          <svg viewBox="0 0 32 56" width="28" height="48" focusable="false" aria-hidden>
            <line
              className="pulse-illust-pinwheel-stick"
              x1="16"
              y1="18"
              x2="16"
              y2="54"
              stroke="var(--pulse-empty-9)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <g className="pulse-illust-pinwheel-vanes">
              <path d="M16 16 L16 2 Q25 6 24 15 Z" fill="var(--pulse-empty-9)" />
              <path d="M16 16 L30 16 Q26 25 17 24 Z" fill="var(--pulse-empty-9)" />
              <path d="M16 16 L16 30 Q7 26 8 17 Z" fill="var(--pulse-empty-9)" />
              <path d="M16 16 L2 16 Q6 7 15 8 Z" fill="var(--pulse-empty-9)" />
              <circle cx="16" cy="16" r="2.2" fill="var(--pulse-empty-9)" />
            </g>
          </svg>
        </button>
      ))}
    </div>
  );
}
