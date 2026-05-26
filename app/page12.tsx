"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ACCOUNTS, ACCOUNTS_DETAIL, CORRECT_CODE, STORAGE_KEY, TTL_MS, POLAROID_DATA, VIDEO_SCENES } from "@/lib/constants";

function triggerFlash() {
  const flash = document.createElement("div");
  Object.assign(flash.style, {
    position: "fixed", inset: "0",
    background: "rgba(255,230,240,0.6)",
    zIndex: "9999", pointerEvents: "none",
    animation: "flashIn 0.4s ease forwards",
  });
  if (!document.getElementById("flashStyle")) {
    const s = document.createElement("style");
    s.id = "flashStyle";
    s.textContent = "@keyframes flashIn{0%{opacity:1}100%{opacity:0}}";
    document.head.appendChild(s);
  }
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 450);
}

export default function Page() {
  const router = useRouter();
  const photoPanelInnerRef = useRef<HTMLDivElement>(null);
  const boothScene1Ref = useRef<HTMLDivElement>(null);
  const boothWrap1Ref = useRef<HTMLDivElement>(null);

  // ── Modal / unlock state ─────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [passcode, setPasscode]   = useState("");
  const [shake, setShake]         = useState(false);
  const [passcodeError, setPasscodeError] = useState("");
  const [success, setSuccess]     = useState(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);

  function openModal() {
    setPasscode("");
    setPasscodeError("");
    setSuccess(false);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setPasscode("");
    setPasscodeError("");
  }

  function handlePasscodeInput(key: string) {
    if (key === "⌫") {
      setPasscode((p) => p.slice(0, -1));
      setPasscodeError("");
      return;
    }
    if (passcode.length >= 4) return;
    const next = passcode + key;
    setPasscode(next);
    setPasscodeError("");
    if (next.length === 4) {
      if (next === CORRECT_CODE) {
        setSuccess(true);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: Date.now() }));
        } catch { /* ignore */ }
        setTimeout(() => {
          setIsUnlocked(true);
          setShowModal(false);
          setSuccess(false);
          setPasscode("");
        }, 800);
      } else {
        setPasscodeError("รหัสไม่ถูกต้อง ลองอีกครั้งนะคะ 💔");
        setShake(true);
        setTimeout(() => { setShake(false); setPasscode(""); }, 600);
      }
    }
  }
// ── Background / Confetti ────────────────────────────────────────────────
  // Check localStorage after client mount (avoids SSR hydration mismatch)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { ts } = JSON.parse(raw) as { ts: number };
        if (Date.now() - ts < TTL_MS) {
          setIsUnlocked(true);
        }
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const bokehEl = document.getElementById("bokeh");
    const bokehColors = ["#ffd6e0","#ffe4b5","#e8d5f5","#d4eeff","#d4f5e9","#ffb3c6"];
    if (bokehEl) {
      for (let i = 0; i < 28; i++) {
        const d = document.createElement("div");
        d.className = "bokeh-dot";
        const sz = 10 + Math.random() * 30;
        Object.assign(d.style, {
          left:              `${Math.random() * 100}%`,
          top:               `${100 + Math.random() * 30}%`,
          width:             `${sz}px`,
          height:            `${sz}px`,
          background:        bokehColors[Math.floor(Math.random() * bokehColors.length)],
          animationDuration: `${8 + Math.random() * 14}s`,
          animationDelay:    `${Math.random() * 12}s`,
        });
        bokehEl.appendChild(d);
      }
    }

    const confEl = document.getElementById("confetti");
    const confs  = ["💕","⭐","✨","💛","🌸","💗","🌟","💖"];
    if (confEl) {
      for (let i = 0; i < 18; i++) {
        const c = document.createElement("div");
        c.className   = "conf-item";
        c.textContent = confs[Math.floor(Math.random() * confs.length)];
        Object.assign(c.style, {
          left:              `${Math.random() * 100}%`,
          animationDuration: `${10 + Math.random() * 15}s`,
          animationDelay:    `${Math.random() * 14}s`,
          fontSize:          `${0.8 + Math.random() * 0.8}rem`,
        });
        confEl.appendChild(c);
      }
    }

    return () => {
      if (bokehEl)  bokehEl.innerHTML  = "";
      if (confEl)   confEl.innerHTML   = "";
    };
  }, []);

  // ── Hero Booth ───────────────────────────────────────────────────────────
  useEffect(() => {
    let playing1 = true;

    const playBtn1  = document.getElementById("playBtn1");
    const playIcon1 = document.getElementById("playIcon1");
    const startBtn1 = document.getElementById("startBtn1");
    const boothWrap1 = boothWrap1Ref.current;

    const handlePlay = () => {
      playing1 = !playing1;
      if (playIcon1) {
        playIcon1.style.cssText = playing1
          ? "width:0;height:0;border-style:solid;border-width:4px 0 4px 7px;border-color:transparent transparent transparent #fff;"
          : "width:8px;height:10px;background:#fff;border-radius:1px;box-shadow:3px 0 0 #fff;";
      }
    };
    playBtn1?.addEventListener("click", handlePlay);

    const handleCoin = () => {
      const boothBody = document.querySelector<HTMLElement>("#boothScene1 .booth-body");
      if (boothBody) {
        boothBody.style.transition = "transform 0.1s";
        boothBody.style.transform  = "scale(0.97)";
        setTimeout(() => { boothBody.style.transform = ""; }, 150);
      }
      triggerFlash();
    };
    startBtn1?.addEventListener("click", handleCoin);

    const handleScroll = () => {
      const sy = window.scrollY;
      if (boothWrap1 && sy < window.innerHeight) {
        const tilt = Math.min(sy * 0.02, 8);
        boothWrap1.style.transform =
          `rotateY(${tilt - 4}deg) rotateX(${1 - tilt * 0.2}deg) translateY(${sy * 0.08}px)`;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      playBtn1?.removeEventListener("click", handlePlay);
      startBtn1?.removeEventListener("click", handleCoin);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // ── Zoom Booth ───────────────────────────────────────────────────────────
  useEffect(() => {
    let currentZoom: string | null = null;
    let videoPlaying = true;
    let videoFrame   = 0;
    let videoTimer: ReturnType<typeof setInterval> | null = null;
    let isMobile     = window.innerWidth < 768;

    const onResize = () => {
      isMobile = window.innerWidth < 768;
      // recalculate zoom ถ้ากำลัง zoom อยู่
      if (currentZoom) applyZoom();
    };
    window.addEventListener("resize", onResize, { passive: true });

    const boothEl       = document.getElementById("boothInteractive");
    const backdrop      = document.getElementById("zoomBackdrop");
    const backBtn       = document.getElementById("backBtn");
    const dock          = document.getElementById("zoomDock");
    const badges        = document.querySelectorAll<HTMLElement>(".hint-badge-new");
    const panelScreen   = document.getElementById("panel-screen");
    const panelPhotos   = document.getElementById("panel-photos");
    const panelControls = document.getElementById("panel-controls");
    const videoScene    = document.getElementById("videoScene");
    const videoEmoji    = document.getElementById("videoEmoji");
    const videoOverlay  = document.getElementById("videoControlsOverlay");
    const videoPlayBtn  = document.getElementById("videoPlayBtn");
    const progressBar   = document.getElementById("progressBar");
    const polaroidPreview = document.getElementById("polaroidPreview");

    // Build polaroid cards
    if (photoPanelInnerRef.current) {
      POLAROID_DATA.forEach((p) => {
        const inner = photoPanelInnerRef.current!;
        inner.appendChild(buildPolaroidCard(p));
      });
    }

    function buildPolaroidCard(p: typeof POLAROID_DATA[0]) {
      const wrap = document.createElement("div");
      Object.assign(wrap.style, {
        background: "#fffdf9", borderRadius: "4px",
        padding: "8px 8px 24px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12),0 2px 8px rgba(0,0,0,0.06)",
        transform: `rotate(${p.rotate}deg)`,
        position: "relative", width: "110px", flexShrink: "0",
        border: "1px solid rgba(0,0,0,0.05)",
      });
      const tape = document.createElement("div");
      Object.assign(tape.style, {
        position: "absolute", top: "-8px", left: "50%",
        transform: "translateX(-50%) rotate(-2deg)",
        width: "36px", height: "16px",
        background: p.tape, opacity: "0.8",
        borderRadius: "3px", zIndex: "2",
      });
      const photo = document.createElement("div");
      Object.assign(photo.style, {
        background: "linear-gradient(135deg,#ffe4ee 0%,#ffd6e8 100%)",
        borderRadius: "2px", height: "90px",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "42px",
      });
      photo.textContent = p.emoji;
      const cap = document.createElement("p");
      Object.assign(cap.style, {
        fontFamily: "'Caveat',cursive,'Sarabun',sans-serif",
        fontSize: "12px", color: "#7a3450",
        textAlign: "center", marginTop: "8px",
        lineHeight: "1.2", fontWeight: "600",
      });
      cap.textContent = p.caption;
      wrap.append(tape, photo, cap);
      return wrap;
    }

    function startVideo() {
      if (videoTimer) clearInterval(videoTimer);
      videoTimer = setInterval(() => {
        videoFrame = (videoFrame + 1) % VIDEO_SCENES.length;
        applyVideoFrame();
        if (progressBar) {
          progressBar.style.width = "0%";
          requestAnimationFrame(() => { progressBar.style.width = "100%"; });
        }
      }, 2000);
    }
    function stopVideo() {
      if (videoTimer) { clearInterval(videoTimer); videoTimer = null; }
    }
    function applyVideoFrame() {
      const s = VIDEO_SCENES[videoFrame];
      if (videoScene) videoScene.style.background = s.bg;
      if (videoEmoji) videoEmoji.textContent       = s.emoji;
    }
    startVideo();

    const handleVideoPlay = (e: Event) => {
      e.stopPropagation();
      videoPlaying = !videoPlaying;
      if (videoPlayBtn) videoPlayBtn.textContent = videoPlaying ? "⏸" : "▶";
      if (videoPlaying) {
        startVideo();
        videoEmoji?.classList.remove("video-paused");
      } else {
        stopVideo();
        videoEmoji?.classList.add("video-paused");
      }
    };
    videoPlayBtn?.addEventListener("click", handleVideoPlay);

    const ZOOM_CFG: Record<string, {
      svgX: number; svgY: number;
      scaleD: number; scaleM: number;
    }> = {
      // Screen (วิดีโอ): rect x=98 y=122 w=186 h=200 → center (191, 222)
      screen:   { svgX: 191, svgY: 222, scaleD: 3.0, scaleM: 2.2 },
      // Photo slot: rect x=112 y=345 w=158 h=80 → center (191, 385)
      photos:   { svgX: 191, svgY: 385, scaleD: 2.6, scaleM: 2.0 },
      // Controls: rect x=308 y=130 w=52 h=200 → center (334, 230)
      controls: { svgX: 334, svgY: 230, scaleD: 3.2, scaleM: 2.4 },
    };

    function handleZoom(section: string) {
      if (section === currentZoom) return;
      currentZoom = section;
      applyZoom();
    }
    (window as Window & typeof globalThis & { handleZoom: (s: string) => void }).handleZoom = handleZoom;

    function applyZoom() {
      const isZoomed = currentZoom !== null;
      const zoomTarget = currentZoom; // capture ก่อน setTimeout

      backdrop?.classList.toggle("active", isZoomed);
      backBtn?.classList.toggle("show", isZoomed);
      dock?.classList.toggle("hide", isZoomed);
      badges.forEach((b) => b.classList.toggle("hide", isZoomed));
      [panelScreen, panelPhotos, panelControls].forEach((p) => p?.classList.remove("show"));
      videoOverlay?.classList.remove("show");
      if (polaroidPreview) polaroidPreview.style.opacity = "1";

      // lock/unlock horizontal scroll
      document.body.style.overflowX = isZoomed ? "hidden" : "";
      document.documentElement.style.overflowX = isZoomed ? "hidden" : "";

      if (!isZoomed) {
        if (boothEl) {
          boothEl.style.transform       = "";
          boothEl.style.transformOrigin = "50% 50%";
        }
        return;
      }

      const cfg   = ZOOM_CFG[zoomTarget!];
      const scale = isMobile ? cfg.scaleM : cfg.scaleD;

      if (boothEl) {
        const rect = boothEl.getBoundingClientRect();
        const elW  = rect.width;
        const elH  = rect.height;

        const originXpx  = (cfg.svgX / 400) * elW;
        const originYpx  = (cfg.svgY / 580) * elH;
        const originXpct = (originXpx / elW) * 100;
        const originYpct = (originYpx / elH) * 100;

        const vpCX = window.innerWidth  / 2;
        const vpCY = window.innerHeight / 2;

        const originVpX = rect.left + originXpx;
        const originVpY = rect.top  + originYpx;

        const txPx = vpCX - originVpX;
        const tyPx = vpCY - originVpY;

        boothEl.style.transformOrigin = `${originXpct}% ${originYpct}%`;
        boothEl.style.transform = `scale(${scale}) translate(${txPx / scale}px, ${tyPx / scale}px)`;
      }

      // ใช้ zoomTarget แทน currentZoom เพื่อป้องกัน race condition
      setTimeout(() => {
        if (zoomTarget === "screen") {
          panelScreen?.classList.add("show");
          videoOverlay?.classList.add("show");
        } else if (zoomTarget === "photos") {
          panelPhotos?.classList.add("show");
          if (polaroidPreview) polaroidPreview.style.opacity = "0";
        } else if (zoomTarget === "controls") {
          panelControls?.classList.add("show");
        }
      }, 320);
    }

    const zoneScreen   = document.getElementById("zone-screen");
    const zoneControls = document.getElementById("zone-controls");
    const zonePhotos   = document.getElementById("zone-photos");

    const onZoneScreen   = () => { if (!currentZoom) handleZoom("screen");   };
    const onZoneControls = () => { if (!currentZoom) handleZoom("controls"); };
    const onZonePhotos   = () => { if (!currentZoom) handleZoom("photos");   };
    const onBack         = () => { currentZoom = null; applyZoom(); };

    zoneScreen?.addEventListener("click", onZoneScreen);
    zoneControls?.addEventListener("click", onZoneControls);
    zonePhotos?.addEventListener("click", onZonePhotos);
    backBtn?.addEventListener("click", onBack);
    backdrop?.addEventListener("click", onBack);

    return () => {
      stopVideo();
      window.removeEventListener("resize", onResize);
      videoPlayBtn?.removeEventListener("click", handleVideoPlay);
      zoneScreen?.removeEventListener("click", onZoneScreen);
      zoneControls?.removeEventListener("click", onZoneControls);
      zonePhotos?.removeEventListener("click", onZonePhotos);
      backBtn?.removeEventListener("click", onBack);
      backdrop?.removeEventListener("click", onBack);
      // cleanup scroll lock
      document.body.style.overflowX = "";
      document.documentElement.style.overflowX = "";
    };
  }, []);

  // ── Scroll Reveal ─────────────────────────────────────────────────────────
  

  // ── Accounts handled in JSX (ACCOUNTS.map) ──────────────────────────────

  // ── Particles ────────────────────────────────────────────────────────────
  useEffect(() => {
    const zoomSection = document.querySelector<HTMLElement>(".zoom-section");
    if (!zoomSection) return;
    const colors = ["#ffb3c6","#ffd6e0","#ffc9a0","#d4b0ff","#b0e0ff"];
    const particles: HTMLElement[] = [];
    for (let i = 0; i < 18; i++) {
      const p = document.createElement("div");
      const sz = 4 + (i % 4) * 3;
      Object.assign(p.style, {
        position:       "absolute",
        borderRadius:   "50%",
        opacity:        "0.5",
        pointerEvents:  "none",
        left:           `${(i * 5.8 + Math.sin(i) * 10 + 5) % 95}%`,
        top:            `${(i * 4.7 + Math.cos(i) * 8  + 5) % 90}%`,
        width:          `${sz}px`,
        height:         `${sz}px`,
        background:     colors[i % 5],
        animation:      `confettiFall ${6 + i * 0.4}s ease-in-out infinite`,
        animationDelay: `${i * 0.4}s`,
      });
      zoomSection.appendChild(p);
      particles.push(p);
    }
    return () => { particles.forEach((p) => p.remove()); };
  }, []);



  useEffect(() => {
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("vis");
            }
          });
        },
        { threshold: 0.15 }
      );
      document
        .querySelectorAll(".reveal, .story-step, .section-label, .account-card")
        .forEach((el) => observer.observe(el));
      return () => observer.disconnect();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>(".photo-card");
    const cleanup: (() => void)[] = [];
    cards.forEach((card) => {
      const onMove = (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const rx = ((y - cy) / cy) * -15;
        const ry = ((x - cx) / cx) * 15;
        card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.05, 1.05, 1.05)`;
        card.style.zIndex = "10";
      };
      const onLeave = () => {
        card.style.transform = "";
        card.style.zIndex = "1";
      };
      card.addEventListener("mousemove", onMove);
      card.addEventListener("mouseleave", onLeave);
      cleanup.push(() => {
        card.removeEventListener("mousemove", onMove);
        card.removeEventListener("mouseleave", onLeave);
      });
    });
    return () => cleanup.forEach((fn) => fn());
  }, []);
// ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .zone-screen { container-type: size; }
        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        :root {
          --cream: #fff8f0;
          --blush: #ffd6e0;
          --blush-deep: #ffb3c6;
          --rose: #ff85a1;
          --rose-dark: #e05c7a;
          --gold: #ffd89b;
          --gold-deep: #f5c062;
          --gold-rose: #e8a598;
          --lavender: #e8d5f5;
          --sky: #d4eeff;
          --mint: #d4f5e9;
          --text-dark: #3d2235;
          --text-mid: #7a4060;
          --text-light: #b06080;
        }

        html { overflow-x: hidden; scroll-behavior: smooth; }

        body {
          font-family: 'Nunito', 'Sarabun', sans-serif;
          background: var(--cream);
          color: var(--text-dark);
          overflow-x: hidden;
          overflow-y: auto;
          min-height: 100vh;
        }

        .bokeh-layer {
          position: fixed; inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }
        .bokeh-dot {
          position: absolute;
          border-radius: 50%;
          opacity: 0.35;
          animation: floatBokeh linear infinite;
          filter: blur(2px);
        }
        @keyframes floatBokeh {
          0%   { transform: translateY(0) scale(1); opacity: 0.2; }
          50%  { opacity: 0.5; }
          100% { transform: translateY(-110vh) scale(1.3); opacity: 0; }
        }

        .confetti-layer {
          position: fixed; inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }
        .conf-item {
          position: absolute;
          animation: confettiFall linear infinite;
          opacity: 0;
        }
        @keyframes confettiFall {
          0%   { transform: translateY(-10vh) rotate(0deg); opacity: 0; }
          10%  { opacity: 0.8; }
          90%  { opacity: 0.6; }
          100% { transform: translateY(105vh) rotate(360deg); opacity: 0; }
        }

        .hero {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem 4rem;
          text-align: center;
        }

        .hero-tag {
          display: inline-block;
          background: linear-gradient(135deg, var(--blush), var(--gold));
          color: var(--text-dark);
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 0.4rem 1.2rem;
          border-radius: 999px;
          margin-bottom: 1.5rem;
          animation: fadeDown 0.8s ease both;
        }

        .hero-title {
          font-family: 'Pacifico', cursive;
          font-size: clamp(2.2rem, 7vw, 4.5rem);
          line-height: 1.15;
          color: var(--text-dark);
          margin-bottom: 0.75rem;
          animation: fadeDown 0.9s 0.1s ease both;
          text-shadow: 3px 4px 0 rgba(255,133,161,0.25);
        }
        .hero-title span { color: var(--rose); }

        .hero-sub {
          font-family: 'Caveat', cursive;
          font-size: clamp(1.1rem, 3vw, 1.6rem);
          color: var(--text-mid);
          margin-bottom: 3rem;
          animation: fadeDown 1s 0.2s ease both;
        }

        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .booth-scene {
          position: relative;
          width: min(340px, 90vw);
          margin: 0 auto;
          perspective: 1000px;
        }

        .booth-wrap {
          transform-style: preserve-3d;
          animation: boothFloat 4s ease-in-out infinite;
        }
        @keyframes boothFloat {
          0%,100% { transform: rotateY(-3deg) rotateX(1deg) translateY(0px); }
          50%      { transform: rotateY(3deg)  rotateX(-1deg) translateY(-12px); }
        }

        .booth-body {
          background: linear-gradient(160deg, #fff0f5 0%, #ffd6e0 50%, #ffe4b5 100%);
          border-radius: 32px 32px 24px 24px;
          border: 4px solid var(--gold-rose);
          box-shadow:
            0 0 0 8px rgba(255,181,196,0.2),
            0 24px 60px rgba(224,92,122,0.22),
            inset 0 2px 8px rgba(255,255,255,0.6);
          padding: 1.25rem 1.25rem 1.5rem;
          position: relative;
        }

        .booth-deco {
          position: absolute;
          font-size: 1.1rem;
          pointer-events: none;
          animation: decoSpin 6s ease-in-out infinite;
        }
        @keyframes decoSpin {
          0%,100% { transform: scale(1) rotate(-8deg); }
          50%      { transform: scale(1.15) rotate(8deg); }
        }

        .booth-flash { display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 0.75rem; }
        .flash-heart {
          font-size: 1.4rem;
          filter: drop-shadow(0 0 6px rgba(255,133,161,0.7));
          animation: flashPulse 1.2s ease-in-out infinite;
        }
        .flash-heart:nth-child(2) { animation-delay: 0.2s; font-size: 1.8rem; }
        .flash-heart:nth-child(3) { animation-delay: 0.4s; }
        @keyframes flashPulse {
          0%,100% { transform: scale(1); }
          50%      { transform: scale(1.25); filter: drop-shadow(0 0 14px rgba(255,133,161,0.95)); }
        }

        .booth-brand {
          font-family: 'Pacifico', cursive;
          font-size: 0.95rem;
          color: var(--rose-dark);
          text-align: center;
          margin-bottom: 0.75rem;
        }

        .screen-frame {
          background: linear-gradient(135deg, #2d1b2e, #1a0a1e);
          border-radius: 16px;
          border: 3px solid var(--gold-deep);
          box-shadow:
            0 0 0 3px rgba(245,192,98,0.3),
            inset 0 0 20px rgba(255,133,161,0.15);
          overflow: hidden;
          position: relative;
          aspect-ratio: 4/3;
        }

        .cartoon-scene {
          width: 100%; height: 100%;
          background: linear-gradient(180deg,
            #1a3a6b 0%, #2d6a9f 40%, #e8a070 70%, #f4c07a 100%);
          position: relative; overflow: hidden;
        }
        .scene-sun {
          position: absolute; bottom: 32%; right: 15%;
          width: 48px; height: 48px;
          background: radial-gradient(circle, #ffe082, #ffb300);
          border-radius: 50%;
          animation: sunPulse 3s ease-in-out infinite;
          box-shadow: 0 0 20px rgba(255,200,50,0.6);
        }
        @keyframes sunPulse {
          0%,100% { box-shadow: 0 0 20px rgba(255,200,50,0.6); }
          50%      { box-shadow: 0 0 40px rgba(255,200,50,0.9); }
        }
        .scene-sea {
          position: absolute; bottom: 0; left: 0; right: 0; height: 35%;
          background: linear-gradient(180deg, #3ea8e0, #1565a0);
          border-radius: 60% 60% 0 0 / 20% 20% 0 0;
          animation: waveRock 2.5s ease-in-out infinite;
        }
        @keyframes waveRock {
          0%,100% { transform: scaleX(1) translateY(0); }
          50%      { transform: scaleX(1.02) translateY(-4px); }
        }
        .couple {
          position: absolute; bottom: 32%; left: 50%;
          transform: translateX(-50%);
          display: flex; gap: 8px; align-items: flex-end;
        }
        .figure {
          display: flex; flex-direction: column; align-items: center;
          animation: figureSway 3s ease-in-out infinite;
        }
        .figure:last-child { animation-delay: 0.3s; }
        @keyframes figureSway {
          0%,100% { transform: rotate(-2deg); }
          50%      { transform: rotate(2deg); }
        }
        .fig-head {
          width: 22px; height: 22px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.5);
          position: relative;
        }
        .fig-body { width: 16px; height: 26px; border-radius: 6px 6px 2px 2px; margin-top: 2px; }
        .fig1 .fig-head { background: #ffc5a0; }
        .fig1 .fig-body { background: #ff6b9d; }
        .fig2 .fig-head { background: #ffe0b2; }
        .fig2 .fig-body { background: #5b8af5; }
        .heart-pop {
          position: absolute; top: -16px; left: 50%;
          transform: translateX(-50%);
          font-size: 14px;
          animation: heartPopUp 1.5s ease-in-out infinite;
        }
        @keyframes heartPopUp {
          0%   { transform: translateX(-50%) translateY(0) scale(0.8); opacity: 0; }
          40%  { opacity: 1; transform: translateX(-50%) translateY(-10px) scale(1.2); }
          100% { transform: translateX(-50%) translateY(-22px) scale(0.6); opacity: 0; }
        }
        .scene-star {
          position: absolute; width: 4px; height: 4px;
          background: #fffde7; border-radius: 50%;
          animation: twinkle 1.5s ease-in-out infinite;
        }
        @keyframes twinkle {
          0%,100% { opacity: 0.3; transform: scale(0.8); }
          50%      { opacity: 1; transform: scale(1.3); }
        }

        .screen-controls {
          position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%);
          display: flex; gap: 8px; align-items: center;
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(4px);
          border-radius: 999px; padding: 4px 12px;
          border: 1px solid rgba(255,255,255,0.15);
        }
        .ctrl-btn {
          width: 20px; height: 20px;
          background: rgba(255,255,255,0.2);
          border-radius: 50%; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; color: #fff;
          transition: background 0.2s, transform 0.1s;
        }
        .ctrl-btn:hover { background: rgba(255,133,161,0.5); transform: scale(1.15); }
        .ctrl-play-icon {
          width: 0; height: 0;
          border-style: solid;
          border-width: 4px 0 4px 7px;
          border-color: transparent transparent transparent #fff;
        }

        .booth-stars {
          display: flex; justify-content: space-between;
          padding: 0.4rem 0.2rem; font-size: 0.75rem;
        }
        .booth-slot { text-align: center; margin-top: 0.75rem; }
        .coin-insert {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: rgba(255,255,255,0.6);
          border: 2px dashed var(--gold-rose);
          border-radius: 999px; padding: 0.4rem 1rem;
          font-size: 0.7rem; font-weight: 800; color: var(--text-mid);
          cursor: pointer; transition: all 0.2s;
          animation: coinPulse 2s ease-in-out infinite;
        }
        @keyframes coinPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(229,160,152,0.3); }
          50%      { box-shadow: 0 0 0 8px rgba(229,160,152,0); }
        }
        .spatial-label {
          position: absolute;
          background: rgba(255,255,255,0.8);
          backdrop-filter: blur(8px);
          border: 1.5px solid rgba(255,181,196,0.6);
          border-radius: 999px; padding: 0.4rem 1rem;
          font-size: 0.7rem; font-weight: 700; color: var(--text-mid);
          letter-spacing: 0.06em; white-space: nowrap; pointer-events: none;
          box-shadow: 0 4px 16px rgba(255,133,161,0.15);
          animation: labelFloat 3s ease-in-out infinite;
        }
        @keyframes labelFloat {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }

        .scroll-hint {
          position: absolute; bottom: 2rem; left: 50%; transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 0.4rem;
          font-family: 'Caveat', cursive; font-size: 0.95rem; color: var(--text-light);
          animation: fadeDown 1.2s 0.6s ease both;
        }
        .scroll-arrow { animation: bounce 1.5s ease-in-out infinite; }
        @keyframes bounce {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(6px); }
        }

        .zoom-section {
          position: relative;
          z-index: 1;
          min-height: 125vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          background: linear-gradient(160deg, #fff5f0 0%, #fde8f4 50%, #f0e8ff 100%);
          overflow: hidden; /* ป้องกัน SVG ล้นแนวนอน */
        }

        .zoom-header {
          text-align: center;
          margin-bottom: 2rem;
          position: relative;
          z-index: 2;
        }
        .zoom-header-tag {
          display: inline-block;
          background: linear-gradient(135deg, var(--blush), var(--gold));
          color: var(--text-dark);
          font-size: 0.75rem; font-weight: 800;
          letter-spacing: 0.15em; text-transform: uppercase;
          padding: 0.4rem 1.2rem; border-radius: 999px;
          margin-bottom: 1rem;
        }

        .zoom-canvas {
          position: relative;
          width: min(420px, 88vw);
          aspect-ratio: 400 / 580;
          /* ไม่ใส่ max-height เพราะจะทำให้ aspect-ratio พัง */
          margin: 0 auto;
        }

        .zoom-backdrop {
          position: fixed; inset: 0;
          z-index: 200;
          background: rgba(20,5,10,0.65);
          backdrop-filter: blur(6px);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }
        .zoom-backdrop.active {
          opacity: 1;
          pointer-events: all;
        }

        .booth-interactive {
          position: relative;
          width: 100%; height: 100%;
          transition: transform 0.5s cubic-bezier(0.34, 1.2, 0.64, 1),
                      transform-origin 0.3s ease;
          transform-origin: 50% 50%;
          z-index: 210;
        }

        .zone {
          position: absolute;
          cursor: pointer;
          border-radius: 12px;
          transition: background 0.2s;
          z-index: 220;
        }
        .zone:hover:not(.is-zoomed) {
          background: rgba(255,181,196,0.15);
          outline: 2px dashed rgba(255,133,161,0.4);
        }

        .booth-svg { width: 100%; height: 100%; overflow: visible; }

        .video-zone-content {
          width: 100%; height: 100%;
          border-radius: 8px; overflow: hidden;
          position: relative;
        }
        .video-scene {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          transition: background 1.5s ease;
          position: relative;
        }
        .video-emoji {
          font-size: clamp(2rem, 8cqw, 3rem);
          filter: drop-shadow(0 12px 24px rgba(0,0,0,0.2));
          animation: scenePulse 2s infinite;
        }
        @keyframes scenePulse {
          0%,100% { transform: scale(1); }
          50%      { transform: scale(1.05); }
        }
        .video-paused .video-emoji { animation: none; }

        .video-controls-overlay {
          position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%);
          width: 90%;
          background: rgba(255,255,255,0.25);
          backdrop-filter: blur(10px);
          border-radius: 8px; padding: 6px 10px;
          border: 0.5px solid rgba(255,255,255,0.4);
          opacity: 0; pointer-events: none;
          transition: opacity 0.3s 0.3s;
        }
        .video-controls-overlay.show { opacity: 1; pointer-events: all; }

        .polaroid-strip-preview {
          width: 32%; height: 80%;
          background: #f9f0f4;
          transform: rotate(-2deg);
          border: 1px solid rgba(200,150,160,0.3);
          display: flex; flex-direction: column; gap: 3px; padding: 4px;
          border-radius: 2px; transition: opacity 0.2s;
        }
        .polaroid-strip-preview div { flex: 1; background: #ffe4ee; border-radius: 1px; }

        .hint-badge-new {
          position: absolute;
          background: rgba(255,255,255,0.3);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,210,220,0.6);
          border-radius: 999px; padding: 4px 12px;
          display: flex; align-items: center; gap: 6px;
          box-shadow: 0 4px 12px rgba(220,100,120,0.15);
          white-space: nowrap; cursor: pointer;
          font-family: 'Sarabun', sans-serif;
          font-size: 11px; font-weight: 600; color: #7a3450;
          z-index: 230;
          transition: background 0.2s, transform 0.2s, opacity 0.3s;
          animation: badgeFloat 3s ease-in-out infinite;
        }
        .hint-badge-new:hover {
          background: rgba(255,255,255,0.7);
          transform: translate(-50%, -50%) scale(1.05) !important;
        }
        .hint-badge-new.hide { opacity: 0; pointer-events: none; }

        @keyframes badgeFloat {
          0%,100% { transform: translate(-50%,-50%) translateY(0); }
          50%      { transform: translate(-50%,-50%) translateY(-4px); }
        }

        .info-panel {
          position: fixed;
          z-index: 300;
          opacity: 0; pointer-events: none;
          transition: opacity 0.3s 0.35s, transform 0.3s 0.35s;
        }
        .info-panel.show { opacity: 1; pointer-events: all; }

        .info-panel-inner {
          background: rgba(255,255,255,0.28);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.5);
          border-radius: 20px; padding: 20px 24px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
        }

        #panel-screen {
          bottom: 8vh; left: 50%; transform: translateX(-50%) translateY(10px);
          text-align: center;
        }
        #panel-screen.show { transform: translateX(-50%) translateY(0); }

        #panel-photos {
          bottom: 3vh; left: 50%;
          transform: translateX(-50%) translateY(20px);
          width: min(560px, 96vw);
          max-height: 45vh;
        }
        #panel-photos.show { transform: translateX(-50%) translateY(0); }

        .panel-photos-inner {
          display: flex;
          gap: 10px;
          flex-wrap: nowrap;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 12px 16px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .panel-photos-inner::-webkit-scrollbar { display: none; }

        #panel-controls {
          top: 50%; right: 6vw;
          transform: translateY(-50%) translateX(20px);
          width: min(340px, 90vw);
        }
        #panel-controls.show { transform: translateY(-50%) translateX(0); }

        @media (max-width: 767px) {
          #panel-controls {
            top: auto; right: auto; left: 5vw;
            width: 90vw; bottom: 4vh;
            transform: translateY(20px);
          }
          #panel-controls.show { transform: translateY(0); }
        }

        .ctrl-item {
          display: flex; align-items: center; gap: 14px;
          padding: 12px; margin-bottom: 8px;
          background: rgba(255,255,255,0.5);
          border: 1px solid rgba(255,255,255,0.6);
          border-radius: 12px; cursor: pointer; width: 100%;
          font-family: 'Sarabun', sans-serif; text-align: left;
          transition: background 0.2s;
        }
        .ctrl-item:hover { background: rgba(255,255,255,0.75); }
        .ctrl-item:last-child { margin-bottom: 0; }

        .back-btn {
          position: fixed; top: 20px; left: 20px; z-index: 350;
          background: rgba(255,255,255,0.2);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.4);
          border-radius: 999px; padding: 8px 18px;
          cursor: pointer; font-family: 'Sarabun', sans-serif;
          font-size: 13px; font-weight: 600; color: #fff;
          opacity: 0; pointer-events: none;
          transition: opacity 0.3s 0.3s;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .back-btn.show { opacity: 1; pointer-events: all; }

        .zoom-dock {
          position: absolute; bottom: -60px; left: 50%; transform: translateX(-50%);
          display: flex; gap: 6px; padding: 8px 12px;
          background: rgba(255,255,255,0.3);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,200,210,0.5);
          border-radius: 999px;
          box-shadow: 0 8px 32px rgba(220,100,120,0.15);
          transition: opacity 0.3s, transform 0.3s;
          white-space: nowrap;
          z-index: 240;
        }
        .zoom-dock.hide { opacity: 0; pointer-events: none; transform: translateX(-50%) translateY(40px); }
        .dock-btn-new {
          background: transparent; border: none; cursor: pointer;
          font-family: 'Sarabun', sans-serif; font-size: 13px; font-weight: 600;
          color: #7a3450; padding: 6px 12px; border-radius: 999px;
          transition: background 0.2s;
        }
        .dock-btn-new:hover { background: rgba(255,255,255,0.4); }

        .dispenser-section {
          background: linear-gradient(160deg, #fff0f8, #fff8ee);
          padding: 5rem 1rem 4rem;
          position: relative; z-index: 1;
        }

        .strip-flow {
          display: flex; flex-direction: column;
          align-items: center; gap: 0;
          position: relative; margin-top: 2rem;
        }
        .dispenser-slot {
          width: min(300px, 85vw);
          background: linear-gradient(135deg, #3d2235, #2d1b2e);
          border-radius: 12px 12px 0 0; padding: 0.6rem 1rem 0;
          display: flex; justify-content: center;
          box-shadow: 0 -4px 20px rgba(60,20,40,0.2);
        }
        .slot-slit {
          width: 80%; height: 8px; background: #1a0a1e;
          border-radius: 999px; box-shadow: inset 0 2px 6px rgba(0,0,0,0.5);
        }
        .photos-cascade {
          display: flex; flex-direction: column; align-items: center;
          position: relative; padding-bottom: 2rem;
        }
        .photo-card {
          width: min(260px, 78vw); background: #fff; border-radius: 8px;
          padding: 0.75rem 0.75rem 2rem;
          box-shadow: 0 8px 24px rgba(60,20,40,0.15), 0 2px 8px rgba(60,20,40,0.1);
          position: relative; transition: transform 0.3s, box-shadow 0.3s;
          margin-top: -28px; cursor: pointer;
        }
        .photo-card:first-child { margin-top: 0; }
        .photo-card:hover {
          box-shadow: 0 20px 48px rgba(60,20,40,0.25);
          z-index: 10;
          transform: scale(1.04) rotate(0deg) !important;
        }
        .photo-img { width: 100%; aspect-ratio: 1; border-radius: 4px; overflow: hidden; }
        .thumb-scene {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          font-size: 3rem; border-radius: 4px;
        }
        .tape {
          position: absolute; width: 48px; height: 16px;
          background: rgba(255,213,160,0.55); border-radius: 2px; z-index: 2;
        }
        .tape-tl { top: -6px; left: 20px; transform: rotate(-8deg); }
        .tape-tr { top: -6px; right: 20px; transform: rotate(8deg); }
        .photo-caption {
          font-family: 'Caveat', cursive; font-size: 1rem;
          color: var(--text-mid); text-align: center;
          margin-top: 0.4rem; line-height: 1.3;
        }
        .doodle-hearts { font-size: 0.8rem; display: inline-block; animation: doodleWiggle 2s ease-in-out infinite; }
        @keyframes doodleWiggle {
          0%,100% { transform: rotate(-5deg); }
          50%      { transform: rotate(5deg); }
        }

        .story-outer { padding: 5rem 1rem; max-width: 560px; margin: 0 auto; position: relative; z-index: 1; }
        .story-step {
          display: flex; gap: 1.5rem; align-items: flex-start;
          opacity: 0; transform: translateX(-24px);
          transition: opacity 0.7s, transform 0.7s;
        }
        .story-step.vis { opacity: 1; transform: translateX(0); }
        .story-step.right { transform: translateX(24px); }
        .story-step.right.vis { transform: translateX(0); }
        .story-icon {
          flex-shrink: 0; width: 56px; height: 56px;
          background: linear-gradient(135deg, var(--blush), var(--gold));
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem; box-shadow: 0 6px 18px rgba(255,133,161,0.3);
        }
        .story-text h3 { font-family: 'Pacifico', cursive; font-size: 1.1rem; color: var(--text-dark); margin-bottom: 0.3rem; }
        .story-text p  { font-size: 0.9rem; color: var(--text-mid); line-height: 1.6; }

        .accounts-section {
          background: linear-gradient(160deg, #fff0fa, #fff9f0);
          padding: 5rem 1rem 4rem; position: relative; z-index: 1;
        }
        .accounts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 1rem; max-width: 680px; margin: 2rem auto 0;
        }
        .account-card {
          background: #fff; border-radius: 20px; border: 2px solid var(--blush);
          padding: 1.25rem 0.75rem; display: flex; flex-direction: column;
          align-items: center; gap: 0.75rem; cursor: pointer;
          transition: all 0.25s; position: relative; overflow: hidden;
        }
        .account-card::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,214,224,0.4), rgba(255,232,181,0.4));
          opacity: 0; transition: opacity 0.25s; border-radius: inherit;
        }
        .account-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(255,133,161,0.22); border-color: var(--rose); }
        .account-card:hover::before { opacity: 1; }
        .acc-avatar {
          width: 56px; height: 56px; border-radius: 16px;
          background: linear-gradient(135deg, var(--blush), var(--gold));
          overflow: hidden; box-shadow: 0 4px 12px rgba(255,133,161,0.3);
          display: flex; align-items: center; justify-content: center; font-size: 1.6rem; position: relative;
        }
        .acc-badge {
          position: absolute; bottom: -4px; right: -4px;
          width: 18px; height: 18px; background: #4ade80;
          border-radius: 50%; border: 2px solid #fff;
          font-size: 8px; display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 900;
        }
        .acc-name { font-size: 0.78rem; font-weight: 800; color: var(--text-dark); text-align: center; }
        .acc-niche { font-size: 0.7rem; color: var(--text-light); display: flex; align-items: center; gap: 0.25rem; }
        .acc-gen-count {
          font-size: 0.65rem; font-weight: 800;
          background: linear-gradient(135deg, var(--blush), var(--gold));
          color: var(--text-mid); padding: 0.15rem 0.6rem; border-radius: 999px;
        }

        .cta-section {
          padding: 5rem 1rem 6rem;
          display: flex; flex-direction: column; align-items: center; gap: 1.5rem;
          text-align: center; position: relative; z-index: 1;
        }
        .cta-btn {
          display: inline-flex; align-items: center; gap: 0.6rem;
          background: linear-gradient(135deg, var(--rose), #f5a0c0, var(--gold-deep));
          color: #fff; font-family: 'Nunito', sans-serif; font-size: 1rem; font-weight: 800;
          padding: 1rem 2.5rem; border-radius: 999px; border: none; cursor: pointer;
          box-shadow: 0 8px 28px rgba(224,92,122,0.4);
          transition: all 0.25s; text-decoration: none; letter-spacing: 0.04em;
        }
        .cta-btn:hover { transform: translateY(-3px) scale(1.03); box-shadow: 0 16px 40px rgba(224,92,122,0.5); }

        .section-title {
          font-family: 'Pacifico', cursive;
          font-size: clamp(1.5rem, 5vw, 2.5rem);
          color: var(--text-dark); text-align: center; margin-bottom: 0.5rem;
          text-shadow: 2px 3px 0 rgba(255,133,161,0.2);
        }
        .section-label {
          font-family: 'Caveat', cursive;
          font-size: 1rem; color: var(--rose); letter-spacing: 0.1em;
          margin-bottom: 0.5rem; opacity: 0;
          transition: opacity 0.6s, transform 0.6s; transform: translateY(12px);
        }
        .section-label.vis { opacity: 1; transform: translateY(0); }
        .squiggle {
          width: 80px; height: 12px; margin: 0.5rem auto;
          backgroundImage: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 12'%3E%3Cpath d='M0 6 Q10 0 20 6 Q30 12 40 6 Q50 0 60 6 Q70 12 80 6' fill='none' stroke='%23ff85a1' stroke-width='2.5' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-size: contain;
        }
        .glow-underline { display: inline-block; position: relative; }
        .glow-underline::after {
          content: ''; position: absolute; bottom: -4px; left: 0; right: 0;
          height: 4px; background: linear-gradient(90deg, var(--rose), var(--gold-deep));
          border-radius: 999px; filter: blur(2px); animation: underlineGlow 2s ease-in-out infinite;
        }
        @keyframes underlineGlow {
          0%,100% { opacity: 0.6; }
          50%      { opacity: 1; }
        }
        .reveal {
          opacity: 0; transform: translateY(24px);
          transition: opacity 0.7s, transform 0.7s;
        }
        .reveal.vis { opacity: 1; transform: translateY(0); }

        @media (max-width: 480px) {
          .accounts-grid { grid-template-columns: repeat(2, 1fr); }
          .story-step { flex-direction: column; align-items: center; text-align: center; }
        }

        /* ── Passcode Modal ── */
        .modal-backdrop {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(30, 8, 20, 0.55);
          backdrop-filter: blur(10px);
          display: flex; align-items: center; justify-content: center;
          animation: modalFadeIn 0.25s ease both;
        }
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .modal-box {
          background: linear-gradient(160deg, #fff8f5, #ffeef5);
          border: 2px solid rgba(255,181,196,0.5);
          border-radius: 28px;
          padding: 2.5rem 2rem 2rem;
          width: min(380px, 90vw);
          text-align: center;
          box-shadow: 0 32px 80px rgba(224,92,122,0.25), 0 0 0 1px rgba(255,255,255,0.6) inset;
          position: relative;
          animation: modalSlideUp 0.3s cubic-bezier(0.34,1.2,0.64,1) both;
        }
        @keyframes modalSlideUp {
          from { transform: translateY(32px) scale(0.95); opacity: 0; }
          to   { transform: translateY(0)    scale(1);    opacity: 1; }
        }
        .modal-box.shake {
          animation: modalShake 0.5s ease both;
        }
        @keyframes modalShake {
          0%,100% { transform: translateX(0); }
          15%     { transform: translateX(-10px); }
          35%     { transform: translateX(10px); }
          55%     { transform: translateX(-8px); }
          75%     { transform: translateX(8px); }
          90%     { transform: translateX(-4px); }
        }
        .modal-close {
          position: absolute; top: 14px; right: 16px;
          background: none; border: none; cursor: pointer;
          font-size: 1.1rem; color: var(--text-light);
          line-height: 1; padding: 4px;
          transition: transform 0.2s, color 0.2s;
        }
        .modal-close:hover { transform: scale(1.2); color: var(--rose); }
        .modal-icon {
          font-size: 2.8rem;
          margin-bottom: 0.75rem;
          display: block;
          animation: iconBounce 1.4s ease-in-out infinite;
        }
        @keyframes iconBounce {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
        .modal-title {
          font-family: 'Pacifico', cursive;
          font-size: 1.4rem;
          color: var(--text-dark);
          margin-bottom: 0.3rem;
        }
        .modal-sub {
          font-family: 'Caveat', cursive;
          font-size: 1rem;
          color: var(--text-mid);
          margin-bottom: 1.5rem;
        }
        .passcode-dots {
          display: flex; justify-content: center; gap: 12px;
          margin-bottom: 1.5rem;
        }
        .passcode-dot {
          width: 14px; height: 14px;
          border-radius: 50%;
          border: 2px solid var(--rose);
          background: transparent;
          transition: background 0.2s, transform 0.2s;
        }
        .passcode-dot.filled {
          background: var(--rose);
          transform: scale(1.1);
        }
        .numpad {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          max-width: 240px;
          margin: 0 auto 1rem;
        }
        .num-btn {
          background: rgba(255,255,255,0.8);
          border: 1.5px solid rgba(255,181,196,0.4);
          border-radius: 14px;
          padding: 0.9rem 0;
          font-family: 'Nunito', sans-serif;
          font-size: 1.2rem;
          font-weight: 800;
          color: var(--text-dark);
          cursor: pointer;
          transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
          box-shadow: 0 2px 8px rgba(255,133,161,0.1);
        }
        .num-btn:hover {
          background: var(--blush);
          transform: scale(1.06);
          box-shadow: 0 4px 16px rgba(255,133,161,0.2);
        }
        .num-btn:active { transform: scale(0.96); }
        .num-btn.del {
          font-size: 1rem;
          color: var(--text-mid);
        }
        .modal-error {
          font-family: 'Caveat', cursive;
          font-size: 1rem;
          color: var(--rose-dark);
          margin-bottom: 0.5rem;
          min-height: 1.4rem;
          animation: modalFadeIn 0.2s ease;
        }
        .modal-success-overlay {
          position: absolute; inset: 0;
          border-radius: 26px;
          background: linear-gradient(135deg, rgba(255,214,224,0.95), rgba(255,240,200,0.95));
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 0.5rem;
          animation: modalFadeIn 0.3s ease;
        }
        .success-icon {
          font-size: 3rem;
          animation: successPop 0.4s cubic-bezier(0.34,1.5,0.64,1) both;
        }
        @keyframes successPop {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        .success-text {
          font-family: 'Pacifico', cursive;
          font-size: 1.2rem;
          color: var(--text-dark);
        }

        /* ── Content Gate ── */
        .content-gate {
          position: relative;
        }
        .gate-blur {
          filter: blur(6px);
          pointer-events: none;
          user-select: none;
          transition: filter 0.6s ease;
        }
        .gate-wall {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          height: 220px;
          background: linear-gradient(to bottom,
            transparent 0%,
            rgba(255,248,240,0.7) 30%,
            rgba(255,248,240,0.97) 70%,
            #fff8f0 100%);
          z-index: 50;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          padding-bottom: 2rem;
          gap: 0.6rem;
          pointer-events: none;
        }
        .gate-wall-label {
          font-family: 'Caveat', cursive;
          font-size: 1rem;
          color: var(--text-mid);
          pointer-events: none;
        }
      `}</style>

      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400&family=Pacifico&family=Caveat:wght@400;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Sarabun:wght@300;400;600;700&display=swap"
        rel="stylesheet"
      />

      <div className="bokeh-layer" id="bokeh" />
      <div className="confetti-layer" id="confetti" />

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-tag">💕 Capture Every Moment Together</div>
        <h1 className="hero-title">
          Cute Cartoon<br />
          <span>Photo Booth</span>
        </h1>
        <p className="hero-sub">เก็บทุกความทรงจำแสนน่ารักของคู่รักไว้ตลอดไป ✨</p>

        <div className="booth-scene" id="boothScene1">
          <div className="spatial-label" style={{ top: "-28px", left: "-10px" }}>[ เลื่อนเพื่อสำรวจเรื่องราว ]</div>
          <div className="spatial-label" style={{ bottom: "20px", right: "-30px", animationDelay: "1.2s", fontSize: "0.65rem" }}>💛 รูปถ่ายสุดน่ารัก</div>

          <div className="booth-wrap" ref={boothWrap1Ref}>
            <div className="booth-body">
              <div className="booth-deco" style={{ top: "12px", left: "12px" }}>💛</div>
              <div className="booth-deco" style={{ top: "12px", right: "12px", animationDelay: "1s" }}>⭐</div>
              <div className="booth-flash">
                <div className="flash-heart">💗</div>
                <div className="flash-heart">💖</div>
                <div className="flash-heart">💗</div>
              </div>
              <div className="booth-brand">✨ Love Booth ✨</div>
              <div className="screen-frame">
                <div className="cartoon-scene">
                  <div className="scene-star" style={{ top: "10%", left: "15%", animationDelay: "0.3s" }} />
                  <div className="scene-star" style={{ top: "20%", left: "35%", animationDelay: "0.7s", width: "3px", height: "3px" }} />
                  <div className="scene-star" style={{ top: "8%", right: "20%", animationDelay: "1.1s" }} />
                  <div className="scene-star" style={{ top: "25%", right: "35%", animationDelay: "0.5s", width: "3px", height: "3px" }} />
                  <div className="scene-star" style={{ top: "15%", left: "55%", animationDelay: "1.5s" }} />
                  <div className="scene-sun" />
                  <div className="scene-sea" />
                  <div className="couple">
                    <div className="figure fig1">
                      <div className="heart-pop">💕</div>
                      <div className="fig-head" />
                      <div className="fig-body" />
                    </div>
                    <div className="figure fig2">
                      <div className="fig-head" />
                      <div className="fig-body" />
                    </div>
                  </div>
                </div>

                <div className="screen-controls">
                  <button className="ctrl-btn" id="playBtn1" title="เล่น/หยุด">
                    <div className="ctrl-play-icon" id="playIcon1" />
                  </button>
                  <div style={{ width: "1px", height: "14px", background: "rgba(255,255,255,0.2)" }} />
                  <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.7)", fontFamily: "'Caveat',cursive" }}>LIVE ♥</span>
                </div>
              </div>

              <div className="booth-stars">
                <span>⭐</span><span>💛</span><span>🌸</span><span>💛</span><span>⭐</span>
              </div>
              <div className="booth-slot">
                <div className="coin-insert" id="startBtn1">
                  <span>🪙</span> INSERT COIN TO START
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="scroll-hint">
          <span>เลื่อนลงเพื่อดูเพิ่มเติม</span>
          <span className="scroll-arrow">↓</span>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section" style={{ paddingTop: "3rem", paddingBottom: "3rem" }}>
        <div className="section-title">พร้อมแล้วหรือยัง? 💕</div>
        <p style={{ fontFamily: "'Caveat',cursive", fontSize: "1.2rem", color: "var(--text-mid)" }}>
          {isUnlocked ? "เริ่มต้นบทใหม่ของความรักกันเลย ✨" : "ใส่รหัสเพื่อปลดล็อกเนื้อหาทั้งหมด 🔒"}
        </p>
        <button className="cta-btn" onClick={isUnlocked ? undefined : openModal}
          style={isUnlocked ? { background: "linear-gradient(135deg,#4ade80,#22c55e)", cursor: "default" } : {}}>
          <span>{isUnlocked ? "✅" : "🔐"}</span>
          {isUnlocked ? "ปลดล็อกแล้ว — เลื่อนดูได้เลย!" : "ใส่รหัสผ่าน"}
        </button>
        <p style={{ fontSize: "0.75rem", color: "var(--text-light)", marginTop: "0.5rem", fontFamily: "'Caveat',cursive" }}>
          {isUnlocked ? "🔓 session ใช้งานได้อีก 24 ชั่วโมง" : "♡ Made with love · Photo Booth ♡"}
        </p>
      </section>

      {/* ── CONTENT (ซ่อนทั้งหมดถ้ายังไม่ unlock) ── */}
      <div style={{
        opacity: isUnlocked ? 1 : 0,
        pointerEvents: isUnlocked ? "auto" : "none",
        transition: isUnlocked ? "opacity 0.4s ease" : "none",
      }}>
        <div style={{ filter: isUnlocked ? "none" : "blur(8px)" }}>

      {/* ── DISPENSER ── */}
      <section className="dispenser-section">
        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <p className="section-label vis" style={{ opacity: 1, transform: "none" }}>📸 แกลเลอรีความทรงจำ</p>
          <div className="section-title reveal" id="r1">รูปถ่ายสุดน่ารัก</div>
          <div className="squiggle" />
        </div>

        <div className="strip-flow">
          <div className="dispenser-slot"><div className="slot-slit" /></div>
          <div className="photos-cascade">

            <div className="photo-card" style={{ transform: "rotate(-3deg)", zIndex: 5 }} data-rot="-3deg">
              <div className="tape tape-tl" /><div className="tape tape-tr" />
              <div className="photo-img">
                <div className="thumb-scene" style={{ background: "linear-gradient(135deg,#ffb3c6,#ff6b9d)" }}>🌅</div>
              </div>
              <div className="photo-caption">
                ริมทะเลพระอาทิตย์ตก 🌊<br />
                <span className="doodle-hearts">♡ ♡ ♡</span>
              </div>
            </div>

            <div className="photo-card" style={{ transform: "rotate(2.5deg)", zIndex: 4, marginTop: "-20px" }} data-rot="2.5deg">
              <div className="tape tape-tl" /><div className="tape tape-tr" />
              <div className="photo-img">
                <div className="thumb-scene" style={{ background: "linear-gradient(135deg,#d4eeff,#85c1e9)" }}>🌸</div>
              </div>
              <div className="photo-caption">
                ใต้ซากุระสีชมพู 🌸<br />
                <span className="doodle-hearts">✿ ✿ ✿</span>
              </div>
            </div>

            <div className="photo-card" style={{ transform: "rotate(-1.5deg)", zIndex: 3, marginTop: "-20px" }} data-rot="-1.5deg">
              <div className="tape tape-tl" /><div className="tape tape-tr" />
              <div className="photo-img">
                <div className="thumb-scene" style={{ background: "linear-gradient(135deg,#d4f5e9,#5dade2)" }}>☕</div>
              </div>
              <div className="photo-caption">
                คาเฟ่วันฝนตก ☕<br />
                <span className="doodle-hearts">☁ ☁ ☁</span>
              </div>
            </div>

            <div className="photo-card" style={{ transform: "rotate(3deg)", zIndex: 2, marginTop: "-20px" }} data-rot="3deg">
              <div className="tape tape-tl" /><div className="tape tape-tr" />
              <div className="photo-img">
                <div className="thumb-scene" style={{ background: "linear-gradient(135deg,#e8d5f5,#c39bd3)" }}>🎡</div>
              </div>
              <div className="photo-caption">
                งานเทศกาลสุดสนุก 🎡<br />
                <span className="doodle-hearts">★ ★ ★</span>
              </div>
            </div>

            <div className="photo-card" style={{ transform: "rotate(-2deg)", zIndex: 1, marginTop: "-20px" }} data-rot="-2deg">
              <div className="tape tape-tl" /><div className="tape tape-tr" />
              <div className="photo-img">
                <div className="thumb-scene" style={{ background: "linear-gradient(135deg,#fff8dc,#ffd89b)" }}>🌙</div>
              </div>
              <div className="photo-caption">
                คืนดาวพราว 🌙<br />
                <span className="doodle-hearts">✦ ✦ ✦</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── STORY ── */}
      <section className="story-outer">
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <p className="section-label" id="sl2">💕 เรื่องราวของเรา</p>
          <h2 className="section-title reveal" id="r2">การเดินทางแสนหวาน</h2>
          <div className="squiggle" />
        </div>

        <div className="story-step" id="s1">
          <div className="story-icon">🌷</div>
          <div className="story-text">
            <h3>พบกันครั้งแรก</h3>
            <p>ทุกเรื่องราวความรักเริ่มต้นจากการพบกัน ณ ตู้ถ่ายภาพแห่งนี้ เราจะเก็บทุกช่วงเวลาไว้ตลอดไป</p>
          </div>
        </div>

        <div className="story-step right" id="s2" style={{ marginTop: "2rem" }}>
          <div className="story-icon">📸</div>
          <div className="story-text">
            <h3>ถ่ายภาพด้วยกัน</h3>
            <p>สร้างความทรงจำสุดน่ารักผ่านเลนส์การ์ตูน ทุกรูปถ่ายคือความรักที่ถูกแช่แข็งไว้</p>
          </div>
        </div>

        <div className="story-step" id="s3" style={{ marginTop: "2rem" }}>
          <div className="story-icon">💌</div>
          <div className="story-text">
            <h3>ส่งต่อความรัก</h3>
            <p>แชร์ความสุขกับคนที่คุณรัก บอกเล่าเรื่องราวหวานๆ ผ่านแถบรูปโพลารอยด์ที่เต็มไปด้วยหัวใจ</p>
          </div>
        </div>
      </section>

            {/* ── ZOOM SECTION ── */}
      <section className="zoom-section">
        <div className="zoom-header">
          <div className="zoom-header-tag">🔍 Interactive Experience</div>
          <h2 className="section-title reveal" id="zr1">ซูมเข้าไปสำรวจตู้</h2>
          <div className="squiggle" />
          <p style={{ fontFamily: "'Caveat',cursive", fontSize: "1.1rem", color: "var(--text-mid)", marginTop: "0.5rem" }}
             className="reveal" id="zr2">
            กดที่ส่วนต่างๆ ของตู้เพื่อดูรายละเอียด ✨
          </p>
        </div>

        <div className="zoom-backdrop" id="zoomBackdrop" />
        <button className="back-btn" id="backBtn">← ถอยกลับ</button>

        <div className="zoom-canvas" id="zoomCanvas">
          <div className="booth-interactive" id="boothInteractive">

            <svg className="booth-svg" viewBox="0 0 400 580" overflow="visible">
              <defs>
                <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fff5f0" />
                  <stop offset="100%" stopColor="#fde8f0" />
                </linearGradient>
                <linearGradient id="top2" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f9c8d9" />
                  <stop offset="100%" stopColor="#f0a8c0" />
                </linearGradient>
                <linearGradient id="trim2" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#e8b4a0" />
                  <stop offset="100%" stopColor="#b07860" />
                </linearGradient>
                <linearGradient id="panelGrad2" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fce8f0" />
                  <stop offset="100%" stopColor="#f8d0e0" />
                </linearGradient>
                <linearGradient id="velvetGrad2" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"   stopColor="#6b1a2e" />
                  <stop offset="30%"  stopColor="#8b2040" />
                  <stop offset="60%"  stopColor="#7a1a34" />
                  <stop offset="100%" stopColor="#5a1426" />
                </linearGradient>
                <filter id="shadow2">
                  <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#c87090" floodOpacity="0.25" />
                </filter>
              </defs>

              <ellipse cx="195" cy="570" rx="130" ry="14" fill="rgba(120,40,70,0.12)" />

              <path d="M 30 60 Q 10 120 20 200 Q 15 280 25 360 Q 20 430 30 500 L 72 500 Q 62 430 68 360 Q 74 280 68 200 Q 72 120 72 60 Z"
                fill="url(#velvetGrad2)" />
              <path d="M 45 60 Q 35 130 38 220 Q 35 300 40 380 Q 37 450 42 500"
                stroke="rgba(40,0,15,0.3)" strokeWidth="2" fill="none" />
              <rect x="20" y="52" width="60" height="10" rx="5" fill="url(#trim2)" />

              <rect x="72" y="50" width="260" height="490" rx="20" fill="url(#bg2)" filter="url(#shadow2)" />
              <rect x="72" y="50" width="260" height="70"  rx="20" fill="url(#top2)" />
              <rect x="72" y="95" width="260" height="25"  fill="url(#top2)" />
              <rect x="72" y="115" width="260" height="8"  fill="url(#trim2)" opacity="0.8" />

              <rect x="94"  y="118" width="194" height="208" rx="12" fill="url(#trim2)" />
              <rect x="98"  y="122" width="186" height="200" rx="10" fill="#1a0d18" />

              <line x1="80" y1="335" x2="312" y2="335" stroke="url(#trim2)" strokeWidth="3" opacity="0.6" />

              <rect x="112" y="345" width="158" height="80" rx="8"
                fill="rgba(180,80,100,0.08)" stroke="url(#trim2)" strokeWidth="1.5" />
              <rect x="130" y="365" width="122" height="12" rx="6" fill="#2a1520" />
              <rect x="132" y="367" width="118" height="8"  rx="4" fill="#1a0d18" />
              <text x="191" y="358" fontSize="7" textAnchor="middle"
                fontFamily="'Sarabun',sans-serif" fill="#c47b8a" letterSpacing="1.5">PHOTO PRINTS</text>

              <rect x="308" y="130" width="52" height="200" rx="10"
                fill="url(#panelGrad2)" stroke="url(#trim2)" strokeWidth="1.5" />
              <rect x="310" y="132" width="48" height="196" rx="9" fill="rgba(255,255,255,0.5)" />
              <text x="334" y="148" fontSize="6" textAnchor="middle"
                fontFamily="'Sarabun',sans-serif" fill="#c47b8a" letterSpacing="1">CONTROLS</text>

              <circle cx="334" cy="162" r="14" fill="#ff4d6d" opacity="0.15" />
              <circle cx="334" cy="162" r="11" fill="#ff4d6d" opacity="0.9" />
              <text x="334" y="166" fontSize="11" textAnchor="middle">📸</text>

              <circle cx="334" cy="198" r="14" fill="#ff8fa3" opacity="0.15" />
              <circle cx="334" cy="198" r="11" fill="#ff8fa3" opacity="0.9" />
              <text x="334" y="202" fontSize="11" textAnchor="middle">🎨</text>

              <circle cx="334" cy="234" r="14" fill="#ffb3c6" opacity="0.15" />
              <circle cx="334" cy="234" r="11" fill="#ffb3c6" opacity="0.9" />
              <text x="334" y="238" fontSize="11" textAnchor="middle">⭐</text>

              <circle cx="334" cy="270" r="14" fill="#ffd6e0" opacity="0.15" />
              <circle cx="334" cy="270" r="11" fill="#ffd6e0" opacity="0.9" />
              <text x="334" y="274" fontSize="11" textAnchor="middle">🖨️</text>

              <text x="334" y="315" fontSize="16" textAnchor="middle" fill="#c47b8a">💰</text>
              <text x="334" y="330" fontSize="5"  textAnchor="middle"
                fontFamily="'Sarabun',sans-serif" fill="#c47b8a" letterSpacing="0.5">INSERT COIN</text>

              <rect x="80" y="530" width="244" height="20" rx="10" fill="url(#top2)" opacity="0.8" />
            </svg>

            {/* Zone: Screen — SVG rect x=98 y=122 w=186 h=200 → %of 400×580 */}
            <div className="zone zone-screen" id="zone-screen"
              style={{ left: "24.5%", top: "21%", width: "46.5%", height: "34.5%", borderRadius: "10px",
                       background: "#1a0d18", padding: "4px" }}>
              <div className="video-zone-content">
                <div className="video-scene" id="videoScene"
                  style={{ background: "linear-gradient(160deg,#ff9a56,#ffad7e,#ffd6a8)" }}>
                  <span className="video-emoji" id="videoEmoji">💃🕺</span>
                </div>
              </div>
              <div className="video-controls-overlay" id="videoControlsOverlay">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontFamily: "'Sarabun',sans-serif", fontSize: "6px", color: "#fff", fontWeight: 600 }}>
                    June 14, 2024
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <button id="videoPlayBtn"
                    style={{ background: "#fff", border: "none", borderRadius: "50%",
                             width: "14px", height: "14px", display: "flex", alignItems: "center",
                             justifyContent: "center", cursor: "pointer", fontSize: "8px", color: "#7a3450" }}>
                    ⏸
                  </button>
                  <div style={{ flex: 1, height: "2px", background: "rgba(255,255,255,0.3)", borderRadius: "99px" }}>
                    <div id="progressBar"
                      style={{ height: "100%", width: "45%", background: "#ffb3c6", borderRadius: "99px",
                               transition: "width 2s linear" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Zone: Controls — SVG rect x=308 y=130 w=52 h=200 → %of 400×580 */}
            <div className="zone" id="zone-controls"
              style={{ left: "77%", top: "22.4%", width: "13%", height: "34.5%", borderRadius: "10px" }} />

            {/* Zone: Photos — SVG rect x=112 y=345 w=158 h=80 → %of 400×580 */}
            <div className="zone" id="zone-photos"
              style={{ left: "28%", top: "59.5%", width: "39.5%", height: "13.8%", borderRadius: "8px",
                       display: "flex", justifyContent: "center", alignItems: "flex-end", paddingBottom: "4px" }}>
              <div className="polaroid-strip-preview" id="polaroidPreview">
                <div /><div /><div />
              </div>
            </div>

            {/* Badges */}
            <div className="hint-badge-new" id="badge-photos"
              style={{ left: "48%", top: "78%" }}
              onClick={() => (window as Window & typeof globalThis & { handleZoom: (s: string) => void }).handleZoom("photos")}>
              📸 ดูภาพถ่าย
            </div>
            <div className="hint-badge-new" id="badge-screen"
              style={{ left: "10%", top: "37%" }}
              onClick={() => (window as Window & typeof globalThis & { handleZoom: (s: string) => void }).handleZoom("screen")}>
              ▶ ซูมวิดีโอ
            </div>
            <div className="hint-badge-new" id="badge-controls"
              style={{ left: "95%", top: "37%" }}
              onClick={() => (window as Window & typeof globalThis & { handleZoom: (s: string) => void }).handleZoom("controls")}>
              ⚙️ แผงควบคุม
            </div>

            {/* Dock */}
            <div className="zoom-dock" id="zoomDock">
              <button className="dock-btn-new"
                onClick={() => (window as Window & typeof globalThis & { handleZoom: (s: string) => void }).handleZoom("photos")}>📸 Gallery</button>
              <button className="dock-btn-new"
                onClick={() => (window as Window & typeof globalThis & { handleZoom: (s: string) => void }).handleZoom("screen")}>▶ Video</button>
              <button className="dock-btn-new"
                onClick={() => (window as Window & typeof globalThis & { handleZoom: (s: string) => void }).handleZoom("controls")}>⚙️ Setup</button>
            </div>

          </div>
        </div>

        {/* Info Panels */}
        <div className="info-panel" id="panel-screen">
          <div className="info-panel-inner" style={{ textAlign: "center" }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic",
                         fontSize: "18px", color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.2)",
                         marginBottom: "6px" }}>
              Sunset Boardwalk
            </h3>
            <p style={{ fontFamily: "'Sarabun',sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.8)" }}>
              June 14, 2024 &bull; 3 min 42 sec
            </p>
          </div>
        </div>

        <div className="info-panel" id="panel-photos">
          <div className="info-panel-inner" style={{ padding: "12px" }}>
            <p style={{ fontFamily: "'Caveat',cursive", fontSize: "13px", color: "rgba(255,255,255,0.8)",
                        textAlign: "center", marginBottom: "8px" }}>📸 รูปถ่ายของเรา</p>
            <div ref={photoPanelInnerRef} className="panel-photos-inner" />
          </div>
        </div>

        <div className="info-panel" id="panel-controls">
          <div className="info-panel-inner">
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic",
                         fontSize: "22px", color: "#fff", marginBottom: "16px",
                         textShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
              Booth Controls
            </h3>
            <button className="ctrl-item">
              <span style={{ fontSize: "22px" }}>📸</span>
              <div>
                <div style={{ fontWeight: 700, color: "#7a3450", fontSize: "14px" }}>Capture Mode</div>
                <div style={{ color: "#9b4060", fontSize: "11px", marginTop: "2px" }}>สลับโหมดภาพนิ่งและวิดีโอ</div>
              </div>
            </button>
            <button className="ctrl-item">
              <span style={{ fontSize: "22px" }}>🎨</span>
              <div>
                <div style={{ fontWeight: 700, color: "#7a3450", fontSize: "14px" }}>Filter &amp; Colors</div>
                <div style={{ color: "#9b4060", fontSize: "11px", marginTop: "2px" }}>ปรับแต่งโทนสีให้ดูละมุน</div>
              </div>
            </button>
            <button className="ctrl-item">
              <span style={{ fontSize: "22px" }}>⭐</span>
              <div>
                <div style={{ fontWeight: 700, color: "#7a3450", fontSize: "14px" }}>Stickers</div>
                <div style={{ color: "#9b4060", fontSize: "11px", marginTop: "2px" }}>ตกแต่งรูปด้วยสติ๊กเกอร์</div>
              </div>
            </button>
            <button className="ctrl-item">
              <span style={{ fontSize: "22px" }}>🖨️</span>
              <div>
                <div style={{ fontWeight: 700, color: "#7a3450", fontSize: "14px" }}>Print Layout</div>
                <div style={{ color: "#9b4060", fontSize: "11px", marginTop: "2px" }}>เลือกกรอบและสั่งพิมพ์</div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* ── ACCOUNTS ── */}
      <section className="accounts-section">
        <div style={{ textAlign: "center", marginBottom: "0.5rem", position: "relative", zIndex: 1 }}>
          <p className="section-label" id="sl3">🍋 Lemon8 Content Agent</p>
          <h2 className="section-title reveal" id="r3">
            เลือก <span className="glow-underline">Account</span>
          </h2>
          <div className="squiggle" />
          <p style={{ fontSize: "0.85rem", color: "var(--text-light)", marginTop: "0.75rem" }}
             className="reveal" id="r4">
            เลือก Account เพื่อจัดการ Content สุดน่ารัก
          </p>
        </div>
        <div className="accounts-grid">
          {ACCOUNTS.map((acc, i) => {
            const detail = ACCOUNTS_DETAIL.find((d) => d.id === acc.id);
            return (
              <div
                key={acc.id}
                className="account-card reveal"
                style={{ transitionDelay: `${i * 0.08}s`, cursor: "pointer" }}
                onClick={() => router.push(`/account/${acc.id}`)}
              >
                <div className="acc-avatar" style={{ position: "relative" }}>
                  {detail?.avatar ? (
                    <Image
                      src={detail.avatar}
                      alt={acc.label}
                      width={56}
                      height={56}
                      className="acc-avatar-img"
                      style={{ borderRadius: "16px", objectFit: "cover", width: "100%", height: "100%" }}
                    />
                  ) : (
                    <span>{acc.emoji}</span>
                  )}
                  {acc.verified && <div className="acc-badge">✓</div>}
                </div>
                <div className="acc-name">{acc.label}</div>
                <div className="acc-niche"><span>{acc.emoji}</span> {acc.niche}</div>
                {acc.gens > 0 && <div className="acc-gen-count">{acc.gens} gen</div>}
              </div>
            );
          })}
        </div>
      </section>

      </div> {/* end inner blur div */}
      </div> {/* end height/overflow gate */}

      {/* ── PASSCODE MODAL ── */}
      {showModal && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div
            className={`modal-box${shake ? " shake" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success overlay */}
            {success && (
              <div className="modal-success-overlay">
                <span className="success-icon">💖</span>
                <span className="success-text">ยินดีต้อนรับ!</span>
                <span style={{ fontFamily: "'Caveat',cursive", color: "var(--text-mid)", fontSize: "0.95rem" }}>
                  กำลังปลดล็อก...
                </span>
              </div>
            )}

            <button className="modal-close" onClick={closeModal}>✕</button>
            <span className="modal-icon">🔐</span>
            <div className="modal-title">ใส่รหัสผ่าน</div>
            <div className="modal-sub">กรอกรหัส 4 หลักเพื่อปลดล็อกเนื้อหา</div>

            {/* Dots indicator */}
            <div className="passcode-dots">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`passcode-dot${passcode.length > i ? " filled" : ""}`} />
              ))}
            </div>

            <div className="modal-error">{passcodeError}</div>

            {/* Numpad */}
            <div className="numpad">
              {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((key, idx) => {
                if (key === "") return <div key={idx} />;
                return (
                  <button
                    key={idx}
                    className={`num-btn${key === "⌫" ? " del" : ""}`}
                    onClick={() => handlePasscodeInput(key)}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}