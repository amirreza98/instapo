import { useEffect, useRef, useState, cloneElement } from "react";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FaReact, FaNode, FaDocker } from "react-icons/fa";
import { SiJavascript, SiTypescript, SiTailwindcss, SiMongodb, SiJest, SiGithub, SiExpress } from "react-icons/si";

/* =========================
   Logical playfield size
   ========================= */
const LOGICAL_W = 1000;
const LOGICAL_H = 700;
const FLOOR_Y = LOGICAL_H - 43; // هرچقدر می‌خوای بالاتر بیاد، این عددو زیاد کن
const RAMP_TOP_Y = LOGICAL_H - 260; // جایی که شیب‌ها از آن شروع می‌شوند
const DRAIN_GAP = 140;            // فاصلهٔ خالی وسط (دهانه‌ی درِین)
const PLATFORM_LEN = 200;         // طول سکوهای صاف کنار فلاپر
const DT = 1 / 60;            // گام زمانی ثابت برای کنترل نرم
const FLIPPER_MAX_SPEED = 8;  // rad/s حداکثر سرعت چرخش فلپر

/* =========================
   Physics tunables
   ========================= */
const BALL_R = 10;
const GRAVITY = 0.3;     // px / frame^2 (logical units)
const FRICTION = 0.995;  // velocity damping per frame
const RESTITUTION = 0.9; // bounciness on walls

// Bumper parameters
const BUMPER_R = 18;

const MAX_SPEED = 16;          // سقف سرعت (واحد: پیکسل منطقی در فریم)
const MAX_SPEED_AFTER_HIT = 30; // سقف تهاجمی‌تر بعدِ برخورد، اختیاری

function clampMag(vx: number, vy: number, max: number) {
  const s2 = vx*vx + vy*vy;
  const m2 = max*max;
  if (s2 > m2) {
    const m = Math.sqrt(s2) || 1e-6;
    const k = max / m;
    return { x: vx * k, y: vy * k };
  }
  return { x: vx, y: vy };
}


/* =========================
   Types
   ========================= */
type Vec2 = { x: number; y: number };
type Segment = { a: Vec2; b: Vec2; normal?: Vec2 };

export type Ball = {
  pos: Vec2;
  vel: Vec2;
  r: number;
};

export type SkillKey =
  | "TypeScript" | "JavaScript" | "React" | "Node.js" | "Express" | "MongoDB"
  | "PostgreSQL" | "Tailwind" | "Docker" | "GitHub" | "Jest";

export type Bumper = {
  pos: Vec2;
  r: number;
  skill: SkillKey;
  isActive: boolean;  // وقتی false شد، دیگر برخورد نمی‌گیرد و آیکن جایگزینش نشان داده می‌شود
  isLit: boolean;     // فقط برای جلوه‌ی نوری کوتاه، اگر بخواهی نگه داری
  litUntil: number;   // زمان پایان نور (ms)
  iconKey?: string;   // کلید آیکن جایگزین
  deactivatedAt?: number; // زمان غیرفعال شدن (برای انیمیشن اختیاری)
};

export type FlipperSide = "left" | "right";

export type Flipper = {
  side: FlipperSide;
  pivot: Vec2;
  length: number;
  thickness: number; // drawing only
  angle: number;       // current angle (rad)
  angleRest: number;   // rest angle
  angleActive: number; // max active angle
  angVel: number;      // rad/s
};

export type Wall = Segment;

type Controls = { left: boolean; right: boolean; nudge: boolean };

/* =========================
   Small math helpers
   ========================= */
function clamp01(t: number) {
  return Math.max(0, Math.min(1, t));
}

function closestPointAndNormal(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number
) {
  const vx = x2 - x1, vy = y2 - y1;
  const len2 = vx*vx + vy*vy || 1e-6;
  let t = ((px - x1)*vx + (py - y1)*vy) / len2;
  t = clamp01(t);
  const cx = x1 + t*vx, cy = y1 + t*vy;
  let nx = px - cx, ny = py - cy;
  const dist = Math.hypot(nx, ny) || 1e-6;
  nx /= dist; ny /= dist;
  return { cx, cy, nx, ny, dist, t };
}

// برخورد توپ با سگمنت (فلپر/دیوار باریک)
function collideBallWithSegment(
  ball: Ball,
  x1: number, y1: number,
  x2: number, y2: number,
  effectiveRadius: number,         // شعاع مؤثر (توپ + ضخامت فلپر/۲)
  restitution = RESTITUTION
) {
  const { nx, ny, dist } = closestPointAndNormal(ball.pos.x, ball.pos.y, x1, y1, x2, y2);
  const overlap = effectiveRadius - dist;
  if (overlap > 0) {
    // هل دادن توپ به بیرون
    ball.pos.x += nx * overlap;
    ball.pos.y += ny * overlap;

    // بازتاب سرعت روی نرمال (فقط اگر به سمت داخل می‌رفت)
    const vn = ball.vel.x * nx + ball.vel.y * ny;
    if (vn < 0) {
      ball.vel.x -= (1 + restitution) * vn * nx;
      ball.vel.y -= (1 + restitution) * vn * ny;
    }
    return true;
  }
  return false;
}

/** 
 * ساده‌شده: فقط برخورد فیزیک را حل می‌کند و true/false برمی‌گرداند.
 * هیچ تغییر حالت (روشن/خاموش) در خودِ بامپر انجام نمی‌دهد.
 */
function collideBallWithBumper(ball: Ball, b: Bumper, restitution = 1.0) {
  const dx = ball.pos.x - b.pos.x;
  const dy = ball.pos.y - b.pos.y;
  const dist = Math.hypot(dx, dy) || 1e-6;
  const minDist = ball.r + b.r;

  if (dist < minDist) {
    const nx = dx / dist, ny = dy / dist;
    const overlap = minDist - dist;
    ball.pos.x += nx * overlap;
    ball.pos.y += ny * overlap;

    const vn = ball.vel.x * nx + ball.vel.y * ny;
    if (vn < 0) {
      ball.vel.x -= (1 + restitution) * vn * nx;
      ball.vel.y -= (1 + restitution) * vn * ny;
    }
    return true;
  }
  return false;
}

/* Skills registry (logos later) */
export const SKILLS: SkillKey[] = [
  "React",
  "Node.js",
  "Express",
  "MongoDB",
  "TypeScript",
  "JavaScript",
  "Tailwind",
  "Docker",
  "GitHub",
];

/* مپ مهارت → کلید آیکن */
const SKILL_ICON: Partial<Record<SkillKey, string>> = {
  React: "react",
  "Node.js": "node",
  Docker: "docker",
  JavaScript: "javascript",
  TypeScript: "typescript", // نمونه‌ی موقت
  Tailwind: "tailwindcss",
  MongoDB: "mongodb",
  Jest: "jest",
  GitHub: "github",
  Express: "express",
};


/* =========================
   Helpers to build geometry
   ========================= */
function buildWalls(): Wall[] {
  const cx = LOGICAL_W / 2;

  const leftPlatStart  = cx - DRAIN_GAP / 2 - PLATFORM_LEN;
  const leftPlatEnd    = cx - DRAIN_GAP / 2 - 50;
  const rightPlatStart = cx + DRAIN_GAP / 2 + 50;
  const rightPlatEnd   = cx + DRAIN_GAP / 2 + PLATFORM_LEN;

  return [
    { a: { x: 0, y: 0 }, b: { x: LOGICAL_W, y: 0 } },                   // TOP
    { a: { x: 0, y: 0 }, b: { x: 0, y: RAMP_TOP_Y } },                   // LEFT vertical
    { a: { x: LOGICAL_W, y: 0 }, b: { x: LOGICAL_W, y: RAMP_TOP_Y } },   // RIGHT vertical
    { a: { x: 0, y: RAMP_TOP_Y }, b: { x: leftPlatStart, y: FLOOR_Y } },        // ramp left
    { a: { x: LOGICAL_W, y: RAMP_TOP_Y }, b: { x: rightPlatEnd, y: FLOOR_Y } }, // ramp right
    { a: { x: leftPlatStart, y: FLOOR_Y }, b: { x: leftPlatEnd, y: FLOOR_Y } },   // platform left
    { a: { x: rightPlatStart, y: FLOOR_Y }, b: { x: rightPlatEnd, y: FLOOR_Y } }, // platform right
    { a: { x: leftPlatStart,  y: FLOOR_Y }, b: { x: leftPlatStart,  y: LOGICAL_H } },
    { a: { x: rightPlatEnd,   y: FLOOR_Y }, b: { x: rightPlatEnd,   y: LOGICAL_H } },
  ];
}

function buildFlippers(): Flipper[] {
  const len = 120, thick = 16;
  const cx = LOGICAL_W / 2;
  const y  = LOGICAL_H - 35;

  return [
    {
      side: "left",
      pivot: { x: cx - len - 60, y },
      length: len, thickness: thick,
      angle: 0.2,
      angleRest: 0.2,
      angleActive: -0.6,
      angVel: 20,
    },
    {
      side: "right",
      pivot: { x: cx + len + 60, y },
      length: len, thickness: thick,
      angle: Math.PI - 0.2,
      angleRest: Math.PI - 0.2,
      angleActive: Math.PI + 0.6,
      angVel: 20,
    },
  ];
}

// گرید: 4 ردیف × 10 ستون (طبق ماسک زیر)
function buildBumpers(): Bumper[] {
  const items: Bumper[] = [];
  const MASK: number[][] = [
    [1,1,0,0,0,0,0,0,1,1], // ردیف 1 (بالا)
    [1,1,1,0,0,0,0,1,1,1], // ردیف 2
    [0,1,1,1,0,0,1,1,1,0], // ردیف 3
    [0,0,1,1,0,0,1,1,0,0], // ردیف 4 (پایین)
  ];
  const ROWS = MASK.length;
  const COLS = MASK[0].length;

  const PAD_X = 40;
  const PAD_Y = RAMP_TOP_Y - 100;

  const xs = Array.from({ length: COLS }, (_, c) => PAD_X + c * 100);
  const ys = Array.from({ length: ROWS }, (_, r) => PAD_Y + r * 90);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!MASK[r][c]) continue;
      items.push({
        pos: { x: xs[c], y: ys[r] },
        r: BUMPER_R,
        skill: SKILLS[items.length % SKILLS.length],
        isLit: false,
        litUntil: 0,
        isActive: true,
      });
    }
  }
  return items;
}

/* Compute the visible endpoints of a flipper segment for drawing */
function flipperEndpoints(f: Flipper) {
  const x2 = f.pivot.x + Math.cos(f.angle) * f.length;
  const y2 = f.pivot.y + Math.sin(f.angle) * f.length;
  return { x1: f.pivot.x, y1: f.pivot.y, x2, y2 };
}

/* =========================
   Component
   ========================= */
export default function PinballGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  function resetWorld({ keepIcons = true }: { keepIcons?: boolean } = {}) {
    // ریست توپ
    ballRef.current.pos.x = LOGICAL_W/2 +100;
    ballRef.current.pos.y = 40;
    ballRef.current.vel.x = 0;
    ballRef.current.vel.y = 0;
    drainedRef.current = false;

    // ریست بامپرها
    if (!keepIcons) {
      bumpersRef.current = buildBumpers();
    }
  }
  const [showReset, setShowReset] = useState(false);

  // game state in refs
  const ballRef = useRef<Ball>({
    pos: { x: LOGICAL_W/2 +100, y: 40 },
    vel: { x: 0, y: 0 },
    r: BALL_R,
  });
  const bumpersRef = useRef<Bumper[]>([]);
  const flippersRef = useRef<Flipper[]>([]);
  const wallsRef = useRef<Wall[]>([]);
  const controlsRef = useRef<Controls>({ left: false, right: false, nudge: false });
  const drainedRef = useRef(false);
  const initializedRef = useRef(false);

  // canvas icon atlas (react-icons → <img>)
  const iconImgsRef = useRef<Map<string, HTMLImageElement>>(new Map());

  const rootRef = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  // ====== preload icons once ======
  function preloadIcons() {
    if (iconImgsRef.current.size) return;

    const defs: Array<[string, ReactElement]> = [
      ["react", <FaReact size={64} color="#ffffff" />],
      ["node",  <FaNode size={64} color="#ffffff" />],
      ["docker",<FaDocker size={64} color="#ffffff" />],
      ["javascript",<SiJavascript size={64} color="#ffffff" />],
      ["typescript",<SiTypescript size={64} color="#ffffff" />],
      ["tailwindcss",<SiTailwindcss size={64} color="#ffffff" />],
      ["mongodb",<SiMongodb size={64} color="#ffffff" />],
      ["jest", <SiJest size={64} color="#ffffff" />],
      ["express", <SiExpress size={64} color="#ffffff" />],
      ["github", <SiGithub size={64} color="#ffffff" />],
    ];

    for (const [key, el] of defs) {
      // اندازه و رنگ SVG خروجی؛ می‌تونی بعداً پارامتریک کنی
      const svg = renderToStaticMarkup(cloneElement(el));
      const img = new Image();
      img.src = "data:image/svg+xml;utf8," + encodeURIComponent(svg);
      iconImgsRef.current.set(key, img);
    }
  }

  function isBallInDrain(b: Ball) {
    const margin = 13.5;
    return (
      b.pos.y > LOGICAL_H + margin ||
      b.pos.y < -margin ||
      b.pos.x < -margin ||
      b.pos.x > LOGICAL_W + margin
    );
  }

  // تشخیص در دید بودن سکشن
  useEffect(() => {
    if (!rootRef.current) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.35 }
    );
    io.observe(rootRef.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    if (!initializedRef.current) {
      wallsRef.current = buildWalls();
      flippersRef.current = buildFlippers();
      bumpersRef.current = buildBumpers();
      preloadIcons(); // ← آیکن‌ها را یکبار بساز
      initializedRef.current = true;
    }

    // Fullscreen canvas
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    // Keyboard
    const onKey = (e: KeyboardEvent, down: boolean) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") controlsRef.current.left = down;
      if (e.code === "ArrowRight" || e.code === "KeyL") controlsRef.current.right = down;
      if (e.code === "ArrowUp") controlsRef.current.nudge = down;
    };
    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);

    // Touch / Pointer
    let leftCount = 0, rightCount = 0;
    const pointerSide = new Map<number, "left" | "right">();
    const getSide = (clientX: number) => {
      const r = canvas.getBoundingClientRect();
      const mid = r.left + r.width / 2;
      return clientX < mid ? "left" : "right";
    };
    const touchStarts = new Map<number, { x: number; y: number; t: number }>();
    const onPointerDown = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
      canvas.setPointerCapture?.(e.pointerId);
      const side = getSide(e.clientX);
      pointerSide.set(e.pointerId, side);
      if (side === "left") { leftCount++; controlsRef.current.left = true; }
      else { rightCount++; controlsRef.current.right = true; }
      touchStarts.set(e.pointerId, { x: e.clientX, y: e.clientY, t: performance.now() });
    };
    const onPointerMove = (e: PointerEvent) => {
      const st = touchStarts.get(e.pointerId);
      if (!st) return;
      const dy = e.clientY - st.y;
      const dt = performance.now() - st.t;
      if (dy < -40 && dt < 200) {
        controlsRef.current.nudge = true;
        setTimeout(() => (controlsRef.current.nudge = false), 120);
        touchStarts.delete(e.pointerId);
      }
    };
    const onPointerUpOrCancel = (e: PointerEvent) => {
      const side = pointerSide.get(e.pointerId);
      if (side === "left") {
        leftCount = Math.max(0, leftCount - 1);
        if (leftCount === 0) controlsRef.current.left = false;
      } else if (side === "right") {
        rightCount = Math.max(0, rightCount - 1);
        if (rightCount === 0) controlsRef.current.right = false;
      }
      pointerSide.delete(e.pointerId);
      touchStarts.delete(e.pointerId);
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUpOrCancel);
    canvas.addEventListener("pointercancel", onPointerUpOrCancel);
    canvas.addEventListener("pointerleave", onPointerUpOrCancel);

    /* =========================
              STEP
       ========================= */
    let raf = 0;
    const step = () => {
      const b = ballRef.current;
      // physics
      // physics
      b.vel.y += GRAVITY;
      b.vel.x *= FRICTION; 
      b.vel.y *= FRICTION;

      // ⛔️ سقف سرعت عمومی
      {
        const v = clampMag(b.vel.x, b.vel.y, MAX_SPEED);
        b.vel.x = v.x; 
        b.vel.y = v.y;
      }

      b.pos.x += b.vel.x;  
      b.pos.y += b.vel.y;


      // flippers update
      for (const f of flippersRef.current) {
        const pressed = f.side === "left" ? controlsRef.current.left : controlsRef.current.right;
        const target = pressed ? f.angleActive : f.angleRest;
        const prev = f.angle;
        const maxDelta = FLIPPER_MAX_SPEED * DT;
        const want = target - prev;
        const delta = Math.max(-maxDelta, Math.min(maxDelta, want));
        f.angle = prev + delta;
        f.angVel = (f.angle - prev) / DT;
      }

      // walls
      for (const w of wallsRef.current) {
        if (
          collideBallWithSegment(
            ballRef.current,
            w.a.x, w.a.y, w.b.x, w.b.y,
            ballRef.current.r,
            1.2
          )
        ) {
          // ✅ محدود کردن سرعت بعد از برخورد با دیوار
          const v = clampMag(ballRef.current.vel.x, ballRef.current.vel.y, MAX_SPEED_AFTER_HIT);
          ballRef.current.vel.x = v.x;
          ballRef.current.vel.y = v.y;
        }
      }


      // bumpers: برخورد → غیر فعال + تعیین آیکن
      const now = performance.now();
      for (const bp of bumpersRef.current) {
        if (!bp.isActive) continue;
        // (اگر جلوه‌ی نور کوتاه می‌خواهی، این دو خط را نگه دار)
        if (bp.isLit && now > bp.litUntil) bp.isLit = false;

        if (collideBallWithBumper(b, bp, 1.0)) {
          bp.isActive = false;
          bp.isLit = false;
          bp.iconKey = SKILL_ICON[bp.skill] ?? "react";
          bp.deactivatedAt = now;

          // محدود کردن سرعت بعد از برخورد با بامپر
          const v = clampMag(b.vel.x, b.vel.y, MAX_SPEED_AFTER_HIT);
          b.vel.x = v.x; 
          b.vel.y = v.y;
        }
      }

      // flippers collisions
      for (const f of flippersRef.current) {
        const { x1, y1, x2, y2 } = flipperEndpoints(f);
        const effR = ballRef.current.r + f.thickness * 0.5;

        if (collideBallWithSegment(ballRef.current, x1, y1, x2, y2, effR, 2)) {
          // ✅ محدود کردن سرعت بعد از برخورد با فلپر
          const v = clampMag(ballRef.current.vel.x, ballRef.current.vel.y, MAX_SPEED_AFTER_HIT);
          ballRef.current.vel.x = v.x;
          ballRef.current.vel.y = v.y;
        }
      }


      // drain
      if (!drainedRef.current && isBallInDrain(b)) {
        drainedRef.current = true;
        window.location.hash = "#contact?anim=drain";
        setShowReset(true); // 👈 دکمه‌ی ریست ظاهر می‌شود
        return;
      }

      // ============= RENDER =============
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.scale(W / LOGICAL_W, H / LOGICAL_H);

      // outline
      ctx.strokeStyle = "#8A3324";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, FLOOR_Y);
      ctx.moveTo(LOGICAL_W, 0);
      ctx.lineTo(LOGICAL_W, FLOOR_Y);
      ctx.stroke();

      // bottom shapes
      const PLATFORM_HEIGHT = 43;
      const cx = LOGICAL_W / 2;
      const leftPlatStart  = cx - DRAIN_GAP / 2 - PLATFORM_LEN;
      const leftPlatEnd    = cx - DRAIN_GAP;
      const rightPlatStart = cx + DRAIN_GAP;
      const rightPlatEnd   = cx + DRAIN_GAP / 2 + PLATFORM_LEN;

      ctx.fillStyle = "#8A3324";
      // left slope
      ctx.beginPath();
      ctx.moveTo(2, RAMP_TOP_Y);
      ctx.lineTo(leftPlatStart, FLOOR_Y);
      ctx.lineTo(leftPlatStart, LOGICAL_H);
      ctx.lineTo(0, LOGICAL_H);
      ctx.closePath();
      ctx.fill();
      // right slope
      ctx.beginPath();
      ctx.moveTo(LOGICAL_W, RAMP_TOP_Y);
      ctx.lineTo(rightPlatEnd, FLOOR_Y);
      ctx.lineTo(rightPlatEnd, LOGICAL_H);
      ctx.lineTo(LOGICAL_W, LOGICAL_H);
      ctx.closePath();
      ctx.fill();
      // platforms
      ctx.fillRect(leftPlatStart,  FLOOR_Y, leftPlatEnd  - leftPlatStart,  PLATFORM_HEIGHT);
      ctx.fillRect(rightPlatStart, FLOOR_Y, rightPlatEnd - rightPlatStart, PLATFORM_HEIGHT);

      // flippers
      for (const f of flippersRef.current) {
        const { x1, y1, x2, y2 } = flipperEndpoints(f);
        ctx.lineCap = "round";
        ctx.lineWidth = f.thickness;
        ctx.strokeStyle = "#86efac";
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // bumpers
      for (const bp of bumpersRef.current) {
        // اگر غیرفعال است و آیکن دارد ⇒ آیکن را بکش و ادامه
        if (!bp.isActive && bp.iconKey) {
          const img = iconImgsRef.current.get(bp.iconKey);
          // انیمیشن ظاهر شدن (اختیاری): از 0→1 در 250ms
          let alpha = 1;
          if (bp.deactivatedAt) {
            const t = (now - bp.deactivatedAt) / 250;
            alpha = Math.max(0, Math.min(1, t));
          }
          ctx.save();
          ctx.globalAlpha = alpha;

          if (img && img.complete) {
            const size = bp.r * 2.2; // اندازه‌ی آیکن نسبت به شعاع بامپر
            ctx.drawImage(img, bp.pos.x - size / 2, bp.pos.y - size / 2, size, size);
          } else {
            // placeholder تا لود شود
            ctx.beginPath();
            ctx.arc(bp.pos.x, bp.pos.y, bp.r * 0.9, 0, Math.PI * 2);
            ctx.fillStyle = "#999";
            ctx.fill();
          }
          ctx.restore();
          continue;
        }

        // حالت فعال: دایره + glow (اگر isLit بود)
        if (bp.isLit) {
          ctx.beginPath();
          ctx.arc(bp.pos.x, bp.pos.y, bp.r * 1.6, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(80,120,255,0.25)";
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(bp.pos.x, bp.pos.y, bp.r, 0, Math.PI * 2);
        ctx.fillStyle = bp.isLit ? "#5b7cff" : "#2f47b9";
        ctx.fill();
      }

      // ball
      ctx.beginPath();
      ctx.arc(b.pos.x, b.pos.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = "#e43a2f";
      ctx.fill();

      ctx.restore();

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUpOrCancel);
      canvas.removeEventListener("pointercancel", onPointerUpOrCancel);
      canvas.removeEventListener("pointerleave", onPointerUpOrCancel);
    };
  }, [inView]);

  return (
    <div ref={rootRef} className=" relative">
      <canvas
        ref={canvasRef}
        style={{
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          zIndex: 0,
          background: "",
          touchAction: "none", // جلوی اسکرول/زوم لمسی را می‌گیرد
        }}
      />
      {showReset && (
        <button
          onClick={() => {
            resetWorld({ keepIcons: false }); // یا true اگر بخوای آیکن‌ها بمونن
            setShowReset(false); // دکمه رو پنهان کن
          }}
          className="
            absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
            px-6 py-3 rounded-xl text-white text-lg font-semibold
            bg-white/30 hover:bg-blue-400 transition-all
            shadow-lg backdrop-blur-md bg-opacity-90
          "
        >
          🔄 Restart Game
        </button>
      )}
    </div>
  );
}
