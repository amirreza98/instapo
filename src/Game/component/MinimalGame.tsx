import { useEffect, useRef, useState } from "react";

/**
 * Chrome Dino — React + TypeScript (single component)
 * - No external libraries
 * - Keyboard: Space/↑ jump, ↓ duck, R restart
 * - Buttons: Start/Pause, Slow (debug)
 * - Best score persists in localStorage (key: dino_best)
 */
export default function MinimalGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [running, setRunning] = useState(false);
  const [slow, setSlow] = useState(true);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState<number>(() => Number(localStorage.getItem("dino_best") || 0));
  const [speed, setSpeed] = useState(1);

  // Internal refs for game state (mutable, not causing rerenders)
  const tLastRef = useRef(0);
  const distRef = useRef(0);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number | null>(null);

  // Dimensions
  const WIDTH = 850;
  const HEIGHT = 300;
  const GROUND_Y = HEIGHT - 2;
  const GRAVITY = 0.5;
  const JUMP_VY = -15;
  const DUCK_HEIGHT = 32;

  // Player
  const dinoRef = useRef<Dino>({
    x: 60,
    y: 0,
    w: 44,
    h: 48,
    vy: 0,
    onGround: true,
    ducking: false,
  });
  // init dino Y
  useEffect(() => {
    dinoRef.current.y = GROUND_Y - dinoRef.current.h;
  }, []);

  // Start / Stop helpers
  const startGame = () => {
    const dino = dinoRef.current;
    dino.vy = 0; dino.onGround = true; dino.ducking = false; dino.h = 30; dino.y = GROUND_Y - dino.h;
    obstaclesRef.current = [];
    cloudsRef.current = [];
    keysRef.current.clear();
    distRef.current = 0;
    setScore(0);
    setSpeed(1);
    tLastRef.current = performance.now();
    spawnCloud();
    setRunning(true);
  };
  const pauseGame = () => setRunning(false);

  // Keyboard
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "Space", "ArrowDown"].includes(e.code)) e.preventDefault();
      if (["ArrowUp", "ArrowDown", "Space", "KeyR"].includes(e.code)) {
        keysRef.current.add(e.code);
      }
      if (!running && (e.code === "Space" || e.code === "ArrowUp")) startGame();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [running]);

  // Touch / Pointer controls for mobile
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const active = new Set<number>();
    let startT = 0;
    let startY = 0;
    let startX = 0;

    const addOnce = (code: "Space" | "ArrowUp") => {
      // pulse-like input (یک فریم)
      keysRef.current.add(code);
      // در اولین تیکِ رندر بعدی پاک شود تا فقط یک پرش انجام شود
      requestAnimationFrame(() => keysRef.current.delete(code));
    };

    const onPointerDown = (e: PointerEvent) => {
      // جلوگیری از اسکرول/زو‌م
      if (e.pointerType !== "mouse") e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      active.add(e.pointerId);

      const rect = canvas.getBoundingClientRect();
      const y = e.clientY - rect.top;

      startT = performance.now();
      startY = e.clientY;
      startX = e.clientX;

      // اگر بازی ران نیست، با اولین تپ شروع کن
      if (!running) startGame();

      // اگر پایین صفحه تپ شد و روی زمین هستیم → داک تا وقتی نگه‌داشته
      if (y > rect.height * 0.6 && dinoRef.current.onGround) {
        keysRef.current.add("ArrowDown");
      }

      // دو انگشتی تپ → ری‌استارت
      if (active.size >= 2) {
        keysRef.current.delete("ArrowDown");
        startGame();
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      // سوایپ رو به پایین (وقتی روی زمینه) → داک
      const dy = e.clientY - startY;
      if (dy > 30 && dinoRef.current.onGround) {
        keysRef.current.add("ArrowDown");
      }
    };

    const clearDuck = () => {
      keysRef.current.delete("ArrowDown");
    };

    const onPointerUp = (e: PointerEvent) => {
      canvas.releasePointerCapture(e.pointerId);
      active.delete(e.pointerId);

      const dt = performance.now() - startT;
      const dy = e.clientY - startY;
      const dx = e.clientX - startX;

      // اگر ژست خاصی نبود، داک را آزاد کن
      clearDuck();

      // سوایپ رو به بالا → پرش
      if (dy < -40 && Math.abs(dx) < 80) {
        addOnce("ArrowUp");
        return;
      }

      // تپ کوتاه → پرش
      if (dt < 220 && Math.abs(dy) < 30 && Math.abs(dx) < 40) {
        addOnce("Space");
        return;
      }
    };

    const onPointerCancel = () => {
      active.clear();
      clearDuck();
    };

    // غیرفعال‌سازی ژست‌های iOS Safari (پینچ/دابل‌تپ)
    const killGesture = (e: Event) => e.preventDefault();

    canvas.addEventListener("pointerdown", onPointerDown as any, { passive: false });
    canvas.addEventListener("pointermove", onPointerMove as any, { passive: false });
    canvas.addEventListener("pointerup", onPointerUp as any, { passive: false });
    canvas.addEventListener("pointercancel", onPointerCancel as any);
    canvas.addEventListener("gesturestart", killGesture as any);
    canvas.addEventListener("gesturechange", killGesture as any);
    canvas.addEventListener("gestureend", killGesture as any);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown as any);
      canvas.removeEventListener("pointermove", onPointerMove as any);
      canvas.removeEventListener("pointerup", onPointerUp as any);
      canvas.removeEventListener("pointercancel", onPointerCancel as any);
      canvas.removeEventListener("gesturestart", killGesture as any);
      canvas.removeEventListener("gesturechange", killGesture as any);
      canvas.removeEventListener("gestureend", killGesture as any);
    };
  }, [running]);

  // Main loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = (t: number) => {
      if (!running) return;
      const dtRaw = Math.min(40, t - tLastRef.current);
      const dt = dtRaw * (slow ? 0.5 : 1);
      tLastRef.current = t;

      update(dt);
      draw(ctx);
      rafRef.current = requestAnimationFrame(loop);
    };

    // Start when running toggles on
    if (running) {
      rafRef.current = requestAnimationFrame(loop);
    } else {
      // Draw a static frame so HUD shows correctly when paused
      draw(ctx);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [running, slow]);

  // Update world
  function update(dt: number) {
    const dino = dinoRef.current;

    // speed increases with score
    const v = (6 + Math.min(6, score / 250)) * speed;
    distRef.current += (v * dt) / 16.6667;

    // Score and speed bump
    setScore((s) => {
      const ns = s + Math.floor(dt * speed);
      if (ns && ns % 1000 === 0) setSpeed((sp) => Math.min(2.2, sp + 0.06));
      return ns;
    });

    // Input — duck
    const keys = keysRef.current;
    if (keys.has("ArrowDown") && dino.onGround) {
      dino.ducking = true;
      dino.h = DUCK_HEIGHT;
      dino.y = GROUND_Y - dino.h;
    } else {
      dino.ducking = false;
    }

    // Input — jump
    if ((keys.has("Space") || keys.has("ArrowUp")) && dino.onGround) {
      dino.vy = JUMP_VY;
      dino.onGround = false;
    }

    // Physics
    dino.vy += GRAVITY * (dino.ducking ? 1.1 : 1);
    dino.y += dino.vy;
    if (dino.y >= GROUND_Y - dino.h) {
      dino.y = GROUND_Y - dino.h;
      dino.vy = 0;
      dino.onGround = true;
    }

    // Spawns
    if (obstaclesRef.current.length === 0 || WIDTH - obstaclesRef.current.at(-1)!.x > rand(220, 420)) {
      spawnObstacle();
    }

    // Move & cull obstacles
    for (const o of obstaclesRef.current) o.x -= v * (o.fast ? 1.2 : 1) * dt / 16.6667;
    obstaclesRef.current = obstaclesRef.current.filter((o) => o.x + o.w > 0);

    // Clouds
    if (cloudsRef.current.length < 3 && Math.random() < 0.005) spawnCloud();
    for (const c of cloudsRef.current) c.x -= (c.s * dt) / 16.6;
    cloudsRef.current = cloudsRef.current.filter((c) => c.x + c.w > 0);

    // Collisions
    for (const o of obstaclesRef.current) {
      if (hit(dino, o)) {
        gameOver();
        break;
      }
    }
  }

  function gameOver() {
    setRunning(false);
    setBest((b) => {
      const newBest = Math.max(b, score);
      localStorage.setItem("dino_best", String(newBest));
      return newBest;
    });
  }

  // Drawing
  function draw(ctx: CanvasRenderingContext2D) {
    const W = WIDTH, H = HEIGHT;
    const dist = distRef.current;
    const dino = dinoRef.current;

    ctx.clearRect(0, 0, W, H);

    // Sky
    ctx.fillStyle = "#E1F6FF";
    ctx.fillRect(0, 0, W, H);

    // Clouds
    for (const c of cloudsRef.current) {
      ctx.fillStyle = "#fff";
      roundRect(ctx, c.x, c.y, c.w, c.h, 10, true);
    }

    // Ground baseline
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 0.5);
    ctx.lineTo(W, GROUND_Y + 0.5);
    ctx.stroke();

    // Ground ticks
    const gx = dist % 40;
    ctx.strokeStyle = "#eee";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = -gx; x < W; x += 40) {
      ctx.moveTo(x, GROUND_Y);
      ctx.lineTo(x + 12, GROUND_Y);
    }
    ctx.stroke();

    // Dino
    ctx.save();
    ctx.translate(dino.x, dino.y);
    ctx.fillStyle = "#222";
    roundRect(ctx, 0, 0, dino.w, dino.h, 6, true);
    // eye
    ctx.fillStyle = "#fff"; ctx.fillRect(dino.w - 14, 8, 8, 8);
    ctx.fillStyle = "#222"; ctx.fillRect(dino.w - 12, 10, 4, 4);
    // legs
    ctx.fillStyle = "#222";
    if (dino.onGround) {
      const s = Math.sin(dist / 6);
      ctx.fillRect(6, dino.h - 6, 10, 6 + (s > 0 ? 2 : 0));
      ctx.fillRect(24, dino.h - 6, 10, 6 + (s < 0 ? 2 : 0));
    } else {
      ctx.fillRect(6, dino.h - 6, 10, 6);
      ctx.fillRect(24, dino.h - 6, 10, 6);
    }
    ctx.restore();

    // Obstacles
    for (const o of obstaclesRef.current) drawObstacle(ctx, o, dist);
  }

  // Spawners & drawing helpers
  function spawnObstacle() {
    const t = Math.random();
    if (t < 0.75) {
      const count = Math.random() < 0.7 ? 1 : Math.random() < 0.5 ? 2 : 3;
      const w = 15 * count + (count - 1) * 1;
      obstaclesRef.current.push({ type: "cactus", x: WIDTH + 10, y: GROUND_Y - 22, w, h: 22, count });
    } else {
      const heights = [GROUND_Y - 80, GROUND_Y - 120, GROUND_Y - 60];
      obstaclesRef.current.push({ type: "bird", x: WIDTH + 10, y: heights[Math.floor(Math.random() * heights.length)], w: 30, h: 24, flap: 0, fast: true });
    }
  }

  function drawObstacle(ctx: CanvasRenderingContext2D, o: Obstacle, dist: number) {
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.fillStyle = "#111";
    if (o.type === "cactus") {
      for (let i = 0; i < o.count!; i++) {
        const x = i * 24;
        cactusAt(ctx, x, 0);
      }
    } else {
      ctx.fillRect(0, 8, o.w, 6);
      const wing = Math.sin((dist + o.x) / 10) > 0 ? -10 : 10;
      ctx.beginPath();
      ctx.moveTo(6, 8);
      ctx.lineTo(20, wing);
      ctx.lineTo(34, 8);
      ctx.fill();
      ctx.fillRect(o.w - 6, 12, 6, 4);
    }
    ctx.restore();
  }

  function cactusAt(ctx: CanvasRenderingContext2D, x: number, y: number) {
    roundRect(ctx, x, y, 12, 22, 3, true);
    ctx.fillRect(x - 4, y + 8, 4, 8);
    ctx.fillRect(x + 14, y + 4, 4, 10);
  }

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill = true) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    if (fill) ctx.fill(); else ctx.stroke();
  }

  function spawnCloud() {
    const w = rand(40, 90), h = rand(16, 26);
    cloudsRef.current.push({ x: WIDTH + 10, y: rand(16, 90), w, h, s: rand(0.4, 1.1) });
  }

  function rand(min: number, max: number) { return Math.random() * (max - min) + min; }

  function hit(a: Dino, b: Obstacle) {
    const ax = a.x + 4, ay = a.y + 2, aw = a.w - 8, ah = a.h - 4;
    const bx = b.x + 2, by = b.y + 2, bw = b.w - 4, bh = b.h - 4;
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  // UI
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2 text-sm text-black">
        <div>
          Press <kbd className="border px-1 rounded">Space</kbd> / <kbd className="border px-1 rounded">↑</kbd> to jump, <kbd className="border px-1 rounded">↓</kbd> to duck, <kbd className="border px-1 rounded">R</kbd> to restart.
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => (running ? pauseGame() : startGame())}
            className="border rounded-xl px-3 py-1 bg-blue-300"
          >{running ? "⏸️ Pause" : score > 0 ? "▶️ Restart" : "▶️ Start"}</button>
          <button onClick={() => setSlow((s) => !s)} className={`border rounded-xl px-3 py-1 ${ slow ? 'bg-amber-200 text-white' : 'bg-green-300 text-black'}`}> 
            {slow ? 'Slow mode' : 'Fast mode'}
          </button>
        </div>
      </div>

        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className="w-full rounded-2xl border shadow select-none"
          style={{ touchAction: "none", WebkitUserSelect: "none", userSelect: "none" }}
          onContextMenu={(e) => e.preventDefault()}
        />

      <div className="flex items-center justify-between gap-2 mt-2 text-sm text-black">
        <div>Score: {String(score).padStart(5, "0")} • Best: {String(best).padStart(5, "0")} • Speed: {speed.toFixed(2)}x</div>
      </div>
    </div>
  );
}

// Types
type Dino = {
  x: number; y: number; w: number; h: number; vy: number; onGround: boolean; ducking: boolean;
};

type Obstacle =
  | { type: "cactus"; x: number; y: number; w: number; h: number; count: number; fast?: boolean }
  | { type: "bird"; x: number; y: number; w: number; h: number; flap: number; fast: boolean };

type Cloud = { x: number; y: number; w: number; h: number; s: number };
