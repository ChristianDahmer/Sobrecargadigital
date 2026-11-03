import React, { useState, useRef, useEffect } from 'react';

interface CylindricalJoystickButtonProps {
  direction: 'left' | 'right' | 'jump' | 'general';
  label: string;
  icon: string | React.ReactNode;
  onSetMovingLeft?: (active: boolean) => void;
  onSetMovingRight?: (active: boolean) => void;
  onSetJumping?: (active: boolean) => void;
  onSetCrouching?: (active: boolean) => void;
  onMovePlayer?: (dir: number) => void;
  colorTheme?: 'cyan' | 'purple' | 'amber' | 'emerald';
  size?: 'sm' | 'md' | 'lg';
  title?: string;
}

export const CylindricalJoystickButton: React.FC<CylindricalJoystickButtonProps> = ({
  direction,
  label,
  icon,
  onSetMovingLeft,
  onSetMovingRight,
  onSetJumping,
  onSetCrouching,
  onMovePlayer,
  colorTheme = 'cyan',
  size = 'lg',
  title,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPressed, setIsPressed] = useState<boolean>(false);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Maximum drag radius in pixels
  const maxRadius = 32;

  // Theme colors mapping
  const themeStyles = {
    cyan: {
      border: 'border-cyan-400/70 hover:border-cyan-300',
      glow: 'shadow-[0_0_25px_rgba(34,211,238,0.35)] hover:shadow-[0_0_45px_rgba(34,211,238,0.6)]',
      pressedGlow: 'shadow-[0_0_35px_rgba(34,211,238,0.8)]',
      cylinderWall: 'from-cyan-400 via-cyan-600 to-cyan-950',
      cylinderTop: 'from-cyan-300 via-slate-900 to-cyan-950',
      text: 'text-cyan-300',
      labelText: 'text-cyan-200',
      ring: 'border-cyan-500/40',
      accent: 'bg-cyan-400',
      shaftGradient: 'from-cyan-500 to-slate-900',
    },
    purple: {
      border: 'border-purple-400/70 hover:border-purple-300',
      glow: 'shadow-[0_0_25px_rgba(168,85,247,0.35)] hover:shadow-[0_0_45px_rgba(168,85,247,0.6)]',
      pressedGlow: 'shadow-[0_0_35px_rgba(168,85,247,0.8)]',
      cylinderWall: 'from-purple-400 via-purple-600 to-purple-950',
      cylinderTop: 'from-purple-300 via-slate-900 to-purple-950',
      text: 'text-purple-300',
      labelText: 'text-purple-200',
      ring: 'border-purple-500/40',
      accent: 'bg-purple-400',
      shaftGradient: 'from-purple-500 to-slate-900',
    },
    amber: {
      border: 'border-amber-400/70 hover:border-amber-300',
      glow: 'shadow-[0_0_25px_rgba(245,158,11,0.35)]',
      pressedGlow: 'shadow-[0_0_35px_rgba(245,158,11,0.8)]',
      cylinderWall: 'from-amber-400 via-amber-600 to-amber-950',
      cylinderTop: 'from-amber-300 via-slate-900 to-amber-950',
      text: 'text-amber-300',
      labelText: 'text-amber-200',
      ring: 'border-amber-500/40',
      accent: 'bg-amber-400',
      shaftGradient: 'from-amber-500 to-slate-900',
    },
    emerald: {
      border: 'border-emerald-400/70 hover:border-emerald-300',
      glow: 'shadow-[0_0_25px_rgba(16,185,129,0.35)]',
      pressedGlow: 'shadow-[0_0_35px_rgba(16,185,129,0.8)]',
      cylinderWall: 'from-emerald-400 via-emerald-600 to-emerald-950',
      cylinderTop: 'from-emerald-300 via-slate-900 to-emerald-950',
      text: 'text-emerald-300',
      labelText: 'text-emerald-200',
      ring: 'border-emerald-500/40',
      accent: 'bg-emerald-400',
      shaftGradient: 'from-emerald-500 to-slate-900',
    },
  }[colorTheme];

  // Size dimensions
  const sizeClasses = {
    sm: 'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16',
    md: 'w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20',
    lg: 'w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24',
  }[size];

  // Handle active direction triggers according to offset
  const updateMovementStates = (currX: number, currY: number, active: boolean) => {
    if (!active) {
      if (direction === 'left') onSetMovingLeft?.(false);
      if (direction === 'right') onSetMovingRight?.(false);
      if (direction === 'jump') onSetJumping?.(false);
      onSetCrouching?.(false);
      return;
    }

    // Normalized coordinates (-1 to 1)
    const normX = currX / maxRadius;
    const normY = currY / maxRadius;

    // Direct direction triggers based on joystick displacement
    if (direction === 'left') {
      // Primary button is left
      onSetMovingLeft?.(true);
      // Secondary joystick tilt: if pulled right, move right instead
      if (normX > 0.4) {
        onSetMovingLeft?.(false);
        onSetMovingRight?.(true);
      } else {
        onSetMovingRight?.(false);
      }
      // If pulled up, jump
      if (normY < -0.4) {
        onSetJumping?.(true);
      } else {
        onSetJumping?.(false);
      }
    } else if (direction === 'right') {
      // Primary button is right
      onSetMovingRight?.(true);
      // Secondary joystick tilt: if pulled left, move left instead
      if (normX < -0.4) {
        onSetMovingRight?.(false);
        onSetMovingLeft?.(true);
      } else {
        onSetMovingLeft?.(false);
      }
      // If pulled up, jump
      if (normY < -0.4) {
        onSetJumping?.(true);
      } else {
        onSetJumping?.(false);
      }
    } else if (direction === 'jump') {
      onSetJumping?.(true);
      if (normX < -0.4) onSetMovingLeft?.(true);
      else if (normX > 0.4) onSetMovingRight?.(true);
    } else {
      // General joystick mode
      if (normX < -0.3) onSetMovingLeft?.(true);
      else onSetMovingLeft?.(false);

      if (normX > 0.3) onSetMovingRight?.(true);
      else onSetMovingRight?.(false);

      if (normY < -0.3) onSetJumping?.(true);
      else onSetJumping?.(false);

      if (normY > 0.3) onSetCrouching?.(true);
      else onSetCrouching?.(false);
    }
  };

  // Pointer / Touch Handlers
  const handleStart = (clientX: number, clientY: number) => {
    setIsPressed(true);
    touchStartRef.current = { x: clientX, y: clientY };

    if (direction === 'left') onMovePlayer?.(-1);
    if (direction === 'right') onMovePlayer?.(1);

    updateMovementStates(0, 0, true);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isPressed || !touchStartRef.current) return;

    let dx = clientX - touchStartRef.current.x;
    let dy = clientY - touchStartRef.current.y;

    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    setOffset({ x: dx, y: dy });
    updateMovementStates(dx, dy, true);
  };

  const handleEnd = () => {
    setIsPressed(false);
    setOffset({ x: 0, y: 0 });
    touchStartRef.current = null;
    updateMovementStates(0, 0, false);
  };

  // 3D Perspective Calculations for Cylinder Tilting & Depth
  const normX = offset.x / maxRadius;
  const normY = offset.y / maxRadius;

  // 3D rotation degrees based on joystick tilt
  const rotX = isPressed ? -normY * 26 + (direction === 'jump' ? -10 : 0) : 0;
  const rotY = isPressed ? normX * 26 + (direction === 'left' ? -8 : direction === 'right' ? 8 : 0) : 0;
  const transX = offset.x;
  const transY = offset.y;
  // Depth compression when pressed (simulating 3D mechanical button depression)
  const transZ = isPressed ? -14 : 0;

  return (
    <div
      ref={containerRef}
      className={`relative select-none touch-none flex items-center justify-center ${sizeClasses}`}
      title={title}
      style={{ perspective: '800px' }}
      onMouseDown={(e) => {
        e.preventDefault();
        handleStart(e.clientX, e.clientY);
      }}
      onMouseMove={(e) => {
        if (isPressed) handleMove(e.clientX, e.clientY);
      }}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={(e) => {
        e.preventDefault();
        const touch = e.touches[0];
        handleStart(touch.clientX, touch.clientY);
      }}
      onTouchMove={(e) => {
        e.preventDefault();
        const touch = e.touches[0];
        handleMove(touch.clientX, touch.clientY);
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        handleEnd();
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 1. OUTER HOUSING / BASE CYLINDER SOCKET (SOCKET RIM) */}
      <div
        className={`absolute inset-0 rounded-full bg-gradient-to-b from-slate-950 via-slate-900 to-black border-2 ${themeStyles.border} ${
          isPressed ? themeStyles.pressedGlow : themeStyles.glow
        } transition-shadow duration-300 overflow-hidden flex items-center justify-center p-1 sm:p-1.5`}
      >
        {/* Base Socket Radial Groove / Directional Guides */}
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(ellipse_at_center,_rgba(15,23,42,0.9)_0%,_rgba(0,0,0,0.95)_100%)] opacity-90" />
        
        {/* Outer Metallic Bevel Ring */}
        <div className={`w-full h-full rounded-full border ${themeStyles.ring} shadow-[inset_0_3px_8px_rgba(0,0,0,0.9)] flex items-center justify-center relative`}>
          {/* Subtle Directional Arrows on Base Socket Rim */}
          <span className="absolute top-0.5 text-[8px] font-bold text-slate-500 opacity-60">▲</span>
          <span className="absolute bottom-0.5 text-[8px] font-bold text-slate-500 opacity-60">▼</span>
          <span className="absolute left-1 text-[8px] font-bold text-slate-500 opacity-60">◀</span>
          <span className="absolute right-1 text-[8px] font-bold text-slate-500 opacity-60">▶</span>
        </div>
      </div>

      {/* 2. DYNAMIC 3D CYLINDRICAL STEM & KNOB (TILTS, SHIFTS & DEPRESSES IN 3D SPACE) */}
      <div
        className="relative w-[82%] h-[82%] rounded-full cursor-pointer transition-transform duration-75 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) translate3d(${transX}px, ${transY}px, ${transZ}px)`,
        }}
      >
        {/* 3D CYLINDER SIDE WALL / EXTRUSION SHADOW (EXPOSED WHEN TILTED OR PUSHED) */}
        <div
          className={`absolute inset-0 rounded-full bg-gradient-to-b ${themeStyles.cylinderWall} border border-white/20 shadow-[0_12px_18px_rgba(0,0,0,0.95)]`}
          style={{
            transform: 'translateZ(-10px) scale(0.96)',
            boxShadow: isPressed
              ? '0 4px 10px rgba(0,0,0,0.9), inset 0 2px 6px rgba(0,0,0,0.8)'
              : '0 12px 24px rgba(0,0,0,0.85), inset 0 1px 4px rgba(255,255,255,0.2)',
          }}
        />

        {/* SECONDARY CYLINDER SHAFT LAYER (STRENGTHENS CYLINDRICAL DEPTH EFFECT) */}
        <div
          className={`absolute inset-0.5 rounded-full bg-gradient-to-b ${themeStyles.shaftGradient} opacity-90`}
          style={{
            transform: 'translateZ(-5px)',
          }}
        />

        {/* 3. CYLINDER TOP CAP SURFACE (THE PHYSICAL BUTTON THUMBSTICK TOP) */}
        <div
          className={`absolute inset-0 rounded-full bg-gradient-to-b ${themeStyles.cylinderTop} border-2 ${themeStyles.border} backdrop-blur-md flex flex-col items-center justify-center gap-0.5 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-4px_8px_rgba(0,0,0,0.8)]`}
          style={{
            transform: 'translateZ(0px)',
          }}
        >
          {/* Concentric Tactile Grip Rings on Button Top */}
          <div className="absolute inset-1.5 rounded-full border border-white/10 pointer-events-none" />
          <div className="absolute inset-3 rounded-full border border-white/10 pointer-events-none" />

          {/* Glowing Center LED Dot */}
          <div
            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${themeStyles.accent} shadow-[0_0_8px_currentColor] mb-0.5 transition-opacity ${
              isPressed ? 'opacity-100 scale-125' : 'opacity-70'
            }`}
          />

          {/* Directional Icon (e.g. ◀ or ▶ or ▲) with 3D shadow */}
          <span
            className={`text-lg sm:text-xl md:text-2xl font-black ${themeStyles.text} drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] transition-transform duration-100 ${
              isPressed ? 'scale-110' : ''
            }`}
          >
            {icon}
          </span>
        </div>
      </div>
    </div>
  );
};
