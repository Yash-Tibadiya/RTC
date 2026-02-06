"use client";

import { useRef, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// Configuration for different status types based on code and heading
const STATUS_CONFIG: Record<
  string,
  Record<
    string,
    { subheading: string; redirectLabel: string; redirectUrl: string }
  >
> = {
  "404": {
    "Invalid URL": {
      subheading: "The room URL you are trying to access is invalid.",
      redirectLabel: "Go Home",
      redirectUrl: "/",
    },
    "Room Not Found": {
      subheading: "This room may have expired or never existed.",
      redirectLabel: "Create New Room",
      redirectUrl: "/anonymous",
    },
  },
  FULL: {
    "Room Full": {
      subheading: "This room is at maximum capacity.",
      redirectLabel: "Create New Room",
      redirectUrl: "/anonymous",
    },
  },
  GONE: {
    "Room Destroyed": {
      subheading: "All messages were permanently deleted.",
      redirectLabel: "Create New Room",
      redirectUrl: "/anonymous",
    },
  },
};

const DEFAULT_CONFIG = {
  subheading: "An unexpected error occurred.",
  redirectLabel: "Go Home",
  redirectUrl: "/",
};

function StatusPageContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "!";
  const heading = searchParams.get("heading") || "Something went wrong";

  // Derive message details from code and heading
  const config = STATUS_CONFIG[code]?.[heading] || DEFAULT_CONFIG;

  const { subheading, redirectLabel, redirectUrl } = config;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const isTouchingRef = useRef(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      setIsMobile(window.innerWidth < 768);
    };

    updateCanvasSize();

    let particles: {
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      size: number;
      color: string;
      scatteredColor: string;
      life: number;
    }[] = [];

    let textImageData: ImageData | null = null;

    function createTextImage() {
      if (!ctx || !canvas) return 0;

      ctx.fillStyle = "white";
      ctx.save();

      // Adjust font size based on code length to fit
      const baseFontSize = isMobile ? 120 : 240;
      const fontSize = code.length > 3 ? baseFontSize * 0.6 : baseFontSize;

      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";

      const text = code;
      // const textWidth = ctx.measureText(text).width; // Unused

      ctx.fillText(text, canvas.width / 2, canvas.height / 2);
      ctx.restore();

      textImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      return 1;
    }

    function createParticle(scale: number) {
      if (!ctx || !canvas || !textImageData) return null;

      const data = textImageData.data;
      // const particleGap = 2; // Unused

      for (let attempt = 0; attempt < 100; attempt++) {
        const x = Math.floor(Math.random() * canvas.width);
        const y = Math.floor(Math.random() * canvas.height);

        if (data[(y * canvas.width + x) * 4 + 3] > 128) {
          const scatteredColors = ["#ef4444", "#f97316", "#dc2626", "#ea580c"];
          const randomColor =
            scatteredColors[Math.floor(Math.random() * scatteredColors.length)];

          return {
            x: x,
            y: y,
            baseX: x,
            baseY: y,
            size: Math.random() * 1.5 + 0.5,
            color: "white",
            scatteredColor: randomColor,
            life: Math.random() * 100 + 50,
          };
        }
      }

      return null;
    }

    function createInitialParticles(scale: number) {
      if (!canvas) return;
      const baseParticleCount = 8000;
      const particleCount = Math.floor(
        baseParticleCount *
          Math.sqrt((canvas.width * canvas.height) / (1920 * 1080)),
      );
      for (let i = 0; i < particleCount; i++) {
        const particle = createParticle(scale);
        if (particle) particles.push(particle);
      }
    }

    let animationFrameId: number;

    function animate(scale: number) {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const { x: mouseX, y: mouseY } = mousePositionRef.current;
      const maxDistance = 240;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (
          distance < maxDistance &&
          (isTouchingRef.current || !("ontouchstart" in window))
        ) {
          const force = (maxDistance - distance) / maxDistance;
          const angle = Math.atan2(dy, dx);
          const moveX = Math.cos(angle) * force * 60;
          const moveY = Math.sin(angle) * force * 60;
          p.x = p.baseX - moveX;
          p.y = p.baseY - moveY;

          ctx.fillStyle = p.scatteredColor;
        } else {
          p.x += (p.baseX - p.x) * 0.1;
          p.y += (p.baseY - p.y) * 0.1;
          ctx.fillStyle = "white";
        }

        ctx.fillRect(p.x, p.y, p.size, p.size);

        p.life--;
        if (p.life <= 0) {
          const newParticle = createParticle(scale);
          if (newParticle) {
            particles[i] = newParticle;
          } else {
            particles.splice(i, 1);
            i--;
          }
        }
      }

      const baseParticleCount = 8000;
      const targetParticleCount = Math.floor(
        baseParticleCount *
          Math.sqrt((canvas.width * canvas.height) / (1920 * 1080)),
      );
      while (particles.length < targetParticleCount) {
        const newParticle = createParticle(scale);
        if (newParticle) particles.push(newParticle);
      }

      animationFrameId = requestAnimationFrame(() => animate(scale));
    }

    const scale = createTextImage();
    createInitialParticles(scale);
    animate(scale);

    const handleResize = () => {
      updateCanvasSize();
      const newScale = createTextImage();
      particles = [];
      createInitialParticles(newScale);
    };

    const handleMove = (x: number, y: number) => {
      mousePositionRef.current = { x, y };
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        e.preventDefault();
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchStart = () => {
      isTouchingRef.current = true;
    };

    const handleTouchEnd = () => {
      isTouchingRef.current = false;
      mousePositionRef.current = { x: 0, y: 0 };
    };

    const handleMouseLeave = () => {
      if (!("ontouchstart" in window)) {
        mousePositionRef.current = { x: 0, y: 0 };
      }
    };

    window.addEventListener("resize", handleResize);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("touchstart", handleTouchStart);
    canvas.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchend", handleTouchEnd);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isMobile, code]);

  return (
    <div className="relative w-full h-dvh flex flex-col items-center justify-center bg-white dark:bg-black">
      <canvas
        ref={canvasRef}
        className="w-full h-full absolute top-0 left-0 touch-none cursor-cell"
        aria-label={`Interactive particle effect showing ${code}`}
      />
      <div className="absolute bottom-[150px] text-center z-10">
        <h1 className="sr-only">{heading}</h1>
        <p className="group/text text-lg font-medium text-muted-foreground md:text-2xl mb-6 px-5 md:px-0 cursor-pointer">
          <span className="group-hover/text:text-[#ef4444] transition-colors duration-300">
            {heading}
          </span>
          <br />
          <span className="transition-colors duration-300 text-base opacity-80">
            {subheading}
          </span>
        </p>
        <Link
          href={redirectUrl}
          className="group inline-flex items-center gap-3 no-underline border-none cursor-pointer bg-neutral-900 text-white rounded-full font-semibold py-3 px-6 pl-5 whitespace-nowrap overflow-hidden text-ellipsis transition-colors duration-300 hover:bg-[#ef4444]/80"
        >
          <span className="shrink-0 w-[25px] h-[25px] relative text-neutral-900 bg-white rounded-full grid place-items-center overflow-hidden transition-colors duration-300 group-hover:text-[#ef4444]/80">
            <svg
              viewBox="0 0 14 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-[10px] transition-transform duration-300 ease-in-out group-hover:translate-x-[150%] group-hover:-translate-y-[150%]"
            >
              <path
                d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z"
                fill="currentColor"
              />
            </svg>
            <svg
              viewBox="0 0 14 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-[10px] absolute -translate-x-[150%] translate-y-[150%] transition-transform duration-300 ease-in-out delay-100 group-hover:translate-x-0 group-hover:translate-y-0"
            >
              <path
                d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z"
                fill="currentColor"
              />
            </svg>
          </span>
          {redirectLabel}
        </Link>
      </div>
    </div>
  );
}

export default function StatusPage() {
  return (
    <Suspense>
      <StatusPageContent />
    </Suspense>
  );
}
