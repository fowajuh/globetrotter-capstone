import { useEffect, useRef } from "react";

type Props = { tiltTo?: { lat: number; lng: number } | null; className?: string };

/**
 * Low-poly wireframe globe rendered on canvas (no WebGL dependency).
 * Slowly rotates; tilts toward the region the user selects.
 */
export function Globe({ tiltTo, className }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const target = useRef({ lat: 18, lng: 0 });
  const cur = useRef({ lat: 18, lng: 0 });

  useEffect(() => {
    if (tiltTo) target.current = { lat: -tiltTo.lat, lng: -tiltTo.lng };
  }, [tiltTo]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let spin = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const project = (lat: number, lng: number, R: number) => {
      const la = (lat * Math.PI) / 180;
      const lo = (lng * Math.PI) / 180;
      const tl = (cur.current.lat * Math.PI) / 180;
      let x = Math.cos(la) * Math.sin(lo);
      let y = Math.sin(la);
      let z = Math.cos(la) * Math.cos(lo);
      const y2 = y * Math.cos(tl) - z * Math.sin(tl);
      const z2 = y * Math.sin(tl) + z * Math.cos(tl);
      return { x: x * R, y: -y2 * R, z: z2 };
    };

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const R = Math.min(w, h) * 0.36;
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(w / 2, h / 2);

      cur.current.lat += (target.current.lat - cur.current.lat) * 0.05;
      spin += reduced ? 0 : 0.12;
      const off = cur.current.lng + spin;

      ctx.lineWidth = dpr;
      // parallels
      for (let lat = -60; lat <= 60; lat += 20) {
        ctx.beginPath();
        let started = false;
        for (let lng = 0; lng <= 360; lng += 6) {
          const p = project(lat, lng + off, R);
          if (p.z < 0) {
            started = false;
            continue;
          }
          if (!started) {
            ctx.moveTo(p.x, p.y);
            started = true;
          } else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = "rgba(231,220,197,0.28)";
        ctx.stroke();
      }
      // meridians
      for (let lng = 0; lng < 360; lng += 20) {
        ctx.beginPath();
        let started = false;
        for (let lat = -90; lat <= 90; lat += 5) {
          const p = project(lat, lng + off, R);
          if (p.z < 0) {
            started = false;
            continue;
          }
          if (!started) {
            ctx.moveTo(p.x, p.y);
            started = true;
          } else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = "rgba(231,220,197,0.18)";
        ctx.stroke();
      }
      // beacon nodes
      const nodes = [
        [35.0, 135.8],
        [40.7, -74.0],
        [-33.9, 151.2],
        [48.85, 2.35],
        [-13.16, -72.5],
        [64.1, -21.8],
      ];
      for (const [la, lo] of nodes) {
        const p = project(la, lo + off, R);
        if (p.z < 0) continue;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = "#F2A03D";
        ctx.fill();
      }
      // horizon ring
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(242,160,61,0.25)";
      ctx.stroke();
      ctx.restore();
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden />;
}
