import React, { useEffect, useState, useRef } from 'react';
import { Gamepad, X, Sliders, Check, HelpCircle, Bluetooth, Cpu, Settings, Zap, RefreshCw, Crosshair, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Play, RotateCcw, AlertCircle, CheckCircle2, XCircle, Shield } from 'lucide-react';
import { GamepadConfig, GamepadActionMap } from '../types';

interface GamepadConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GamepadConfig;
  onUpdateConfig: (newConfig: GamepadConfig) => void;
}

export const DEFAULT_ACTION_MAP: GamepadActionMap = {
  jumpButtons: [0, 3, 12],     // Botão A, Y, D-Pad Cima
  crouchButtons: [1, 2, 13],   // Botão B, X, D-Pad Baixo
  leftButtons: [14, 4],        // D-Pad Esquerda, L1
  rightButtons: [15, 5],       // D-Pad Direita, R1
  pauseButtons: [8, 9, 16],    // SELECT, START, HOME
  simButtons: [0, 2, 14, 4],   // Botão A, X, D-Pad Esquerda, L1 (Responder SIM)
  naoButtons: [1, 3, 15, 5],   // Botão B, Y, D-Pad Direita, R1 (Responder NÃO)
};

// Preset Presets
export const T3_DEFAULT_ACTION_MAP: GamepadActionMap = {
  jumpButtons: [0, 3, 12],
  crouchButtons: [1, 2, 13],
  leftButtons: [14, 4],
  rightButtons: [15, 5],
  pauseButtons: [8, 9, 16],
  simButtons: [0, 2, 14, 4],
  naoButtons: [1, 3, 15, 5],
};

export const XBOX_DEFAULT_ACTION_MAP: GamepadActionMap = {
  jumpButtons: [0, 3, 12],
  crouchButtons: [1, 2, 13],
  leftButtons: [14],
  rightButtons: [15],
  pauseButtons: [9],
  simButtons: [0, 2, 14, 4],
  naoButtons: [1, 3, 15, 5],
};

export const PS4_DEFAULT_ACTION_MAP: GamepadActionMap = {
  jumpButtons: [0, 3, 12],
  crouchButtons: [1, 2, 13],
  leftButtons: [14],
  rightButtons: [15],
  pauseButtons: [9, 8],
  simButtons: [0, 2, 14, 4],
  naoButtons: [1, 3, 15, 5],
};

const BUTTON_NAME_MAP: Record<number, string> = {
  0: 'Botão A (B0)',
  1: 'Botão B (B1)',
  2: 'Botão X (B2)',
  3: 'Botão Y (B3)',
  4: 'L1 Gatilho (B4)',
  5: 'R1 Gatilho (B5)',
  6: 'L2 Gatilho (B6)',
  7: 'R2 Gatilho (B7)',
  8: 'SELECT (B8)',
  9: 'START (B9)',
  10: 'L3 Analog Click (B10)',
  11: 'R3 Analog Click (B11)',
  12: 'Seta Cima (B12)',
  13: 'Seta Baixo (B13)',
  14: 'Seta Esquerda (B14)',
  15: 'Seta Direita (B15)',
  16: 'HOME (B16)',
};

export const getButtonLabel = (btnIdx: number): string => {
  return BUTTON_NAME_MAP[btnIdx] || `Botão B${btnIdx}`;
};

// Custom Interactive SVG Schematic for T3 / X3 Universal Wireless Gamepad
const T3JoystickDiagram: React.FC<{
  pressedButtons: number[];
  axes: readonly number[];
}> = ({ pressedButtons, axes }) => {
  const isBtnPressed = (btnIdx: number) => pressedButtons.includes(btnIdx);

  // Left Stick displacement (axes[0] & axes[1])
  const stickLX = (axes[0] || 0) * 8;
  const stickLY = (axes[1] || 0) * 8;

  // Right Stick displacement (axes[2] & axes[3])
  const stickRX = (axes[2] || 0) * 8;
  const stickRY = (axes[3] || 0) * 8;

  return (
    <div className="relative w-full max-w-[380px] mx-auto bg-slate-950/90 border border-slate-800 rounded-2xl p-4 flex flex-col items-center shadow-inner select-none">
      <span className="text-[10px] font-black tracking-widest text-pink-400 uppercase mb-2 flex items-center gap-1.5">
        <Zap className="w-3.5 h-3.5 text-pink-400" /> MODELO T3 / X3 GAMEPAD - TESTE EM TEMPO REAL
      </span>

      <svg viewBox="0 0 320 200" className="w-full h-auto drop-shadow-xl">
        {/* Outer Gamepad Body Silhouette */}
        <path
          d="M 60 50 C 90 40, 110 52, 160 52 C 210 52, 230 40, 260 50 C 295 62, 315 110, 290 170 C 275 200, 245 185, 220 135 C 190 125, 130 125, 100 135 C 75 185, 45 200, 30 170 C 5 110, 25 62, 60 50 Z"
          className="fill-slate-900 stroke-slate-700"
          strokeWidth="3"
        />

        {/* Side Grips Accents (Red Rubber Texture as on T3/X3 Controller) */}
        <path
          d="M 28 85 C 20 120, 32 165, 46 175 C 52 160, 42 120, 48 85 Z"
          className="fill-red-950/60 stroke-red-600/40"
          strokeWidth="1.5"
        />
        <path
          d="M 292 85 C 300 120, 288 165, 274 175 C 268 160, 278 120, 272 85 Z"
          className="fill-red-950/60 stroke-red-600/40"
          strokeWidth="1.5"
        />

        {/* Top Bumpers L1 / R1 & L2 / R2 */}
        <rect
          x="55" y="32" width="45" height="12" rx="4"
          className={isBtnPressed(4) || isBtnPressed(6) ? "fill-cyan-400 stroke-cyan-300" : "fill-slate-800 stroke-slate-600"}
          strokeWidth="1"
        />
        <text x="77" y="41" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">L1/L2</text>

        <rect
          x="220" y="32" width="45" height="12" rx="4"
          className={isBtnPressed(5) || isBtnPressed(7) ? "fill-cyan-400 stroke-cyan-300" : "fill-slate-800 stroke-slate-600"}
          strokeWidth="1"
        />
        <text x="242" y="41" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">R1/R2</text>

        {/* Center Red HOME Button */}
        <circle
          cx="160"
          cy="70"
          r="16"
          className={isBtnPressed(16) || pressedButtons.length > 0 ? "fill-red-500 stroke-red-300 shadow-lg animate-pulse" : "fill-red-700 stroke-red-900"}
          strokeWidth="2"
        />
        <text x="160" y="73" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle" style={{ fontStyle: 'italic' }}>
          HOME
        </text>

        {/* 4 Mode LED Dots around HOME button */}
        <circle cx="148" cy="52" r="2" className="fill-red-500 animate-ping" />
        <circle cx="172" cy="52" r="2" className="fill-slate-700" />
        <circle cx="148" cy="88" r="2" className="fill-slate-700" />
        <circle cx="172" cy="88" r="2" className="fill-slate-700" />

        {/* SELECT & START Buttons */}
        <rect
          x="128" y="98" width="18" height="8" rx="3"
          className={isBtnPressed(8) ? "fill-cyan-400 stroke-cyan-200" : "fill-slate-800 stroke-slate-600"}
          strokeWidth="1"
        />
        <text x="137" y="104" fill="#94a3b8" fontSize="6" fontWeight="bold" textAnchor="middle">SELECT</text>

        <rect
          x="174" y="98" width="18" height="8" rx="3"
          className={isBtnPressed(9) ? "fill-cyan-400 stroke-cyan-200" : "fill-slate-800 stroke-slate-600"}
          strokeWidth="1"
        />
        <text x="183" y="104" fill="#94a3b8" fontSize="6" fontWeight="bold" textAnchor="middle">START</text>

        {/* D-PAD Cross (Left Wing) */}
        <g transform="translate(75, 80)">
          {/* UP (12) */}
          <path
            d="M -7 -22 L 7 -22 L 7 -7 L -7 -7 Z"
            className={isBtnPressed(12) ? "fill-cyan-400 stroke-cyan-200" : "fill-slate-800 stroke-slate-600"}
          />
          {/* DOWN (13) */}
          <path
            d="M -7 7 L 7 7 L 7 22 L -7 22 Z"
            className={isBtnPressed(13) ? "fill-cyan-400 stroke-cyan-200" : "fill-slate-800 stroke-slate-600"}
          />
          {/* LEFT (14) */}
          <path
            d="M -22 -7 L -7 -7 L -7 7 L -22 7 Z"
            className={isBtnPressed(14) ? "fill-cyan-400 stroke-cyan-200" : "fill-slate-800 stroke-slate-600"}
          />
          {/* RIGHT (15) */}
          <path
            d="M 7 -7 L 22 -7 L 22 7 L 7 7 Z"
            className={isBtnPressed(15) ? "fill-cyan-400 stroke-cyan-200" : "fill-slate-800 stroke-slate-600"}
          />
          {/* Center Cross Neutral */}
          <rect x="-7" y="-7" width="14" height="14" className="fill-slate-800" />
        </g>

        {/* ACTION BUTTONS (A, B, X, Y) Cluster (Right Wing) */}
        <g transform="translate(245, 80)">
          {/* Y (Top - Button 3 - Yellow/Green) */}
          <circle
            cx="0" cy="-18" r="9"
            className={isBtnPressed(3) ? "fill-yellow-400 stroke-white" : "fill-slate-900 stroke-slate-700"}
            strokeWidth="1.5"
          />
          <text x="0" y="-15" fill={isBtnPressed(3) ? "#000" : "#eab308"} fontSize="11" fontWeight="bold" textAnchor="middle">Y</text>

          {/* B (Right - Button 1 - Red) */}
          <circle
            cx="18" cy="0" r="9"
            className={isBtnPressed(1) ? "fill-red-500 stroke-white" : "fill-slate-900 stroke-slate-700"}
            strokeWidth="1.5"
          />
          <text x="18" y="3" fill={isBtnPressed(1) ? "#fff" : "#ef4444"} fontSize="11" fontWeight="bold" textAnchor="middle">B</text>

          {/* A (Bottom - Button 0 - Green) */}
          <circle
            cx="0" cy="18" r="9"
            className={isBtnPressed(0) ? "fill-emerald-400 stroke-white" : "fill-slate-900 stroke-slate-700"}
            strokeWidth="1.5"
          />
          <text x="0" y="21" fill={isBtnPressed(0) ? "#000" : "#34d399"} fontSize="11" fontWeight="bold" textAnchor="middle">A</text>

          {/* X (Left - Button 2 - Blue) */}
          <circle
            cx="-18" cy="0" r="9"
            className={isBtnPressed(2) ? "fill-sky-400 stroke-white" : "fill-slate-900 stroke-slate-700"}
            strokeWidth="1.5"
          />
          <text x="-18" y="3" fill={isBtnPressed(2) ? "#000" : "#38bdf8"} fontSize="11" fontWeight="bold" textAnchor="middle">X</text>
        </g>

        {/* LEFT ANALOG THUMBSTICK WITH RED CAP */}
        <g transform={`translate(${115 + stickLX}, ${135 + stickLY})`}>
          <circle cx="0" cy="0" r="18" className="fill-slate-950 stroke-slate-800" strokeWidth="2" />
          <circle
            cx="0" cy="0" r="13"
            className={isBtnPressed(10) ? "fill-red-500 stroke-white" : "fill-red-600 stroke-red-800"}
            strokeWidth="2"
          />
          <circle cx="0" cy="0" r="4" className="fill-red-400/80" />
        </g>

        {/* RIGHT ANALOG THUMBSTICK WITH RED CAP */}
        <g transform={`translate(${205 + stickRX}, ${135 + stickRY})`}>
          <circle cx="0" cy="0" r="18" className="fill-slate-950 stroke-slate-800" strokeWidth="2" />
          <circle
            cx="0" cy="0" r="13"
            className={isBtnPressed(11) ? "fill-red-500 stroke-white" : "fill-red-600 stroke-red-800"}
            strokeWidth="2"
          />
          <circle cx="0" cy="0" r="4" className="fill-red-400/80" />
        </g>
      </svg>
    </div>
  );
};

export const GamepadConfigModal: React.FC<GamepadConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
}) => {
  const [activeGamepad, setActiveGamepad] = useState<Gamepad | null>(null);
  const [liveXAxis, setLiveXAxis] = useState<number>(0);
  const [liveAxes, setLiveAxes] = useState<readonly number[]>([]);
  const [pressedButtons, setPressedButtons] = useState<number[]>([]);
  const requestRef = useRef<number>(0);

  // Auto-Detect Wizard Types
  type WizardStep = 'left' | 'right' | 'jump' | 'crouch' | 'pause' | 'sim' | 'nao' | 'done' | null;
  type WizardPhase = 'waiting_press' | 'waiting_release';

  const [wizardStep, setWizardStep] = useState<WizardStep>(null);
  const [wizardFeedback, setWizardFeedback] = useState<string | null>(null);

  // Single Action Rebinding Type
  type ActionType = 'jump' | 'crouch' | 'left' | 'right' | 'pause' | 'sim' | 'nao' | null;
  const [rebindingAction, setRebindingAction] = useState<ActionType>(null);
  const [rebindFeedback, setRebindFeedback] = useState<string | null>(null);

  // Live tester last pressed string
  const [lastInputDetected, setLastInputDetected] = useState<string | null>(null);

  // Real-time Keyboard listener for testing SIM/NÃO in modal
  const [keyboardSimPressed, setKeyboardSimPressed] = useState(false);
  const [keyboardNaoPressed, setKeyboardNaoPressed] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const simKeys = ['s', 'S', 'a', 'A', 'ArrowLeft', 'Enter', '1', ' ', 'Spacebar'];
    const naoKeys = ['n', 'N', 'd', 'D', 'ArrowRight', 'Escape', 'Esc', 'Backspace', '2'];

    const handleKd = (e: KeyboardEvent) => {
      if (simKeys.includes(e.key)) setKeyboardSimPressed(true);
      if (naoKeys.includes(e.key)) setKeyboardNaoPressed(true);
    };
    const handleKu = (e: KeyboardEvent) => {
      if (simKeys.includes(e.key)) setKeyboardSimPressed(false);
      if (naoKeys.includes(e.key)) setKeyboardNaoPressed(false);
    };

    window.addEventListener('keydown', handleKd);
    window.addEventListener('keyup', handleKu);
    return () => {
      window.removeEventListener('keydown', handleKd);
      window.removeEventListener('keyup', handleKu);
    };
  }, [isOpen]);

  // Ref-based state machine for continuous RAF loop without React stale closure issues
  const wizardRef = useRef<{
    step: WizardStep;
    phase: WizardPhase;
    accumulatedMap: GamepadActionMap;
  }>({
    step: null,
    phase: 'waiting_press',
    accumulatedMap: DEFAULT_ACTION_MAP,
  });

  const rebindRef = useRef<{
    action: ActionType;
    phase: WizardPhase;
  }>({
    action: null,
    phase: 'waiting_press',
  });

  const currentMap = config.actionMap || DEFAULT_ACTION_MAP;

  // Poll real-time gamepad state for live feedback inside modal
  useEffect(() => {
    if (!isOpen) return;

    const pollGamepad = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = Array.from(gamepads).find((g) => g !== null);

      if (gp) {
        setActiveGamepad(gp);
        setLiveXAxis(gp.axes[0] || 0);
        setLiveAxes(gp.axes || []);

        const pressed: number[] = [];
        gp.buttons.forEach((btn, idx) => {
          if (btn.pressed || btn.value > 0.5) pressed.push(idx);
        });
        setPressedButtons(pressed);

        // --- Detect Active Input (Button OR Axis direction) ---
        let detectedButtonIdx: number | null = null;
        let detectedLabel = '';

        // Calibration Filter: Ignore analog axes when mapping SIM or NÃO
        const isSimOrNaoMapping =
          rebindRef.current.action === 'sim' ||
          rebindRef.current.action === 'nao' ||
          wizardRef.current.step === 'sim' ||
          wizardRef.current.step === 'nao';

        if (pressed.length > 0) {
          detectedButtonIdx = pressed[0];
          detectedLabel = getButtonLabel(detectedButtonIdx);
        } else if (!isSimOrNaoMapping) {
          // Check axis directions if no physical button is pressed AND not mapping SIM/NÃO
          const axis0 = gp.axes[0] || 0;
          const axis1 = gp.axes[1] || 0;
          const axis4 = gp.axes[4] || 0;
          const axis9 = gp.axes[9] || 0;

          if (axis0 < -0.45 || axis4 < -0.45 || axis9 < -0.45) {
            detectedButtonIdx = 14; // Default map Left D-Pad
            detectedLabel = 'Analógico / Seta Esquerda (B14)';
          } else if (axis0 > 0.45 || axis4 > 0.45 || axis9 > 0.45) {
            detectedButtonIdx = 15; // Default map Right D-Pad
            detectedLabel = 'Analógico / Seta Direita (B15)';
          } else if (axis1 < -0.45) {
            detectedButtonIdx = 12; // Default map Up D-Pad / Jump
            detectedLabel = 'Analógico Cima (B12)';
          } else if (axis1 > 0.45) {
            detectedButtonIdx = 13; // Default map Down D-Pad / Crouch
            detectedLabel = 'Analógico Baixo (B13)';
          }
        }

        if (detectedLabel) {
          setLastInputDetected(detectedLabel);
        }

        const isInputReleased = pressed.length === 0 &&
          Math.abs(gp.axes[0] || 0) < 0.35 &&
          Math.abs(gp.axes[1] || 0) < 0.35;

        // --- 1. SINGLE REBIND LISTENER MACHINE ---
        const activeRebind = rebindRef.current.action;
        if (activeRebind) {
          if (rebindRef.current.phase === 'waiting_press' && detectedButtonIdx !== null) {
            const btn = detectedButtonIdx;
            const actionKeyMap: Record<NonNullable<ActionType>, keyof GamepadActionMap> = {
              jump: 'jumpButtons',
              crouch: 'crouchButtons',
              left: 'leftButtons',
              right: 'rightButtons',
              pause: 'pauseButtons',
              sim: 'simButtons',
              nao: 'naoButtons',
            };
            const mapKey = actionKeyMap[activeRebind];
            const existing = currentMap[mapKey] || [];
            const updatedArray = existing.includes(btn) ? existing : [...existing, btn];

            const updatedMap: GamepadActionMap = {
              ...currentMap,
              [mapKey]: updatedArray,
            };

            onUpdateConfig({
              ...config,
              actionMap: updatedMap,
            });

            rebindRef.current.phase = 'waiting_release';
            setRebindFeedback(`Mapeado com Sucesso: ${detectedLabel}! Solte o botão...`);
          } else if (rebindRef.current.phase === 'waiting_release' && isInputReleased) {
            rebindRef.current.action = null;
            rebindRef.current.phase = 'waiting_press';
            setRebindingAction(null);
            setRebindFeedback(null);
          }
        }

        // --- 2. WIZARD AUTO-DETECT STEP-BY-STEP MACHINE ---
        const activeStep = wizardRef.current.step;
        if (activeStep && activeStep !== 'done') {
          if (wizardRef.current.phase === 'waiting_press' && detectedButtonIdx !== null) {
            const btn = detectedButtonIdx;
            const stepLabel = detectedLabel;

            // Store in accumulated map ref
            if (activeStep === 'left') {
              wizardRef.current.accumulatedMap.leftButtons = [btn];
            } else if (activeStep === 'right') {
              wizardRef.current.accumulatedMap.rightButtons = [btn];
            } else if (activeStep === 'jump') {
              wizardRef.current.accumulatedMap.jumpButtons = [btn];
            } else if (activeStep === 'crouch') {
              wizardRef.current.accumulatedMap.crouchButtons = [btn];
            } else if (activeStep === 'pause') {
              wizardRef.current.accumulatedMap.pauseButtons = [btn];
            } else if (activeStep === 'sim') {
              wizardRef.current.accumulatedMap.simButtons = [btn];
            } else if (activeStep === 'nao') {
              wizardRef.current.accumulatedMap.naoButtons = [btn];
            }

            wizardRef.current.phase = 'waiting_release';
            setWizardFeedback(`Registrado: ${stepLabel}! Solte a tecla/analógico...`);
          } else if (wizardRef.current.phase === 'waiting_release' && isInputReleased) {
            // Determine Next Step in Wizard
            let nextStep: WizardStep = null;
            if (activeStep === 'left') nextStep = 'right';
            else if (activeStep === 'right') nextStep = 'jump';
            else if (activeStep === 'jump') nextStep = 'crouch';
            else if (activeStep === 'crouch') nextStep = 'sim';
            else if (activeStep === 'sim') nextStep = 'nao';
            else if (activeStep === 'nao') nextStep = 'pause';
            else if (activeStep === 'pause') nextStep = 'done';

            wizardRef.current.step = nextStep;
            wizardRef.current.phase = 'waiting_press';
            setWizardStep(nextStep);
            setWizardFeedback(null);

            if (nextStep === 'done') {
              onUpdateConfig({
                ...config,
                actionMap: { ...wizardRef.current.accumulatedMap },
              });
            }
          }
        }
      } else {
        setActiveGamepad(null);
        setLiveXAxis(0);
        setLiveAxes([]);
        setPressedButtons([]);
      }

      requestRef.current = requestAnimationFrame(pollGamepad);
    };

    requestRef.current = requestAnimationFrame(pollGamepad);

    return () => {
      cancelAnimationFrame(requestRef.current);
    };
  }, [isOpen, currentMap, config, onUpdateConfig]);

  if (!isOpen) return null;

  const toggleEnabled = () => {
    onUpdateConfig({ ...config, enabled: !config.enabled });
  };

  const setMode = (mode: GamepadConfig['mode']) => {
    onUpdateConfig({ ...config, mode });
  };

  const handleDeadzoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateConfig({ ...config, deadzone: parseFloat(e.target.value) });
  };

  const toggleInvert = () => {
    onUpdateConfig({ ...config, invert: !config.invert });
  };

  const toggleBlockAnalogInQuestions = () => {
    onUpdateConfig({
      ...config,
      blockAnalogInQuestions: config.blockAnalogInQuestions === false ? true : false,
    });
  };

  const applyPreset = (presetMap: GamepadActionMap) => {
    onUpdateConfig({
      ...config,
      actionMap: presetMap,
    });
  };

  const startAutoDetectWizard = () => {
    wizardRef.current = {
      step: 'left',
      phase: 'waiting_press',
      accumulatedMap: { ...currentMap },
    };
    setWizardStep('left');
    setWizardFeedback(null);
  };

  const cancelWizard = () => {
    wizardRef.current.step = null;
    setWizardStep(null);
    setWizardFeedback(null);
  };

  const startRebinding = (action: ActionType) => {
    if (rebindingAction === action) {
      rebindRef.current.action = null;
      setRebindingAction(null);
      setRebindFeedback(null);
    } else {
      rebindRef.current = { action, phase: 'waiting_press' };
      setRebindingAction(action);
      setRebindFeedback('Aguardando tecla no joystick...');
    }
  };

  const formatButtonNames = (indices: number[]) => {
    if (!indices || indices.length === 0) return 'Nenhum registrado';
    return indices.map((idx) => getButtonLabel(idx)).join(', ');
  };

  const clearActionMapKey = (key: keyof GamepadActionMap) => {
    onUpdateConfig({
      ...config,
      actionMap: {
        ...currentMap,
        [key]: [],
      },
    });
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4 overflow-y-auto select-none">
      <div className="w-[700px] max-w-full bg-[#0d101d]/95 border border-white/10 rounded-[32px] p-5 sm:p-7 flex flex-col gap-5 shadow-2xl relative text-white max-h-[92vh] overflow-y-auto">
        
        {/* Header decoration */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Modal Title */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-400/10 border border-cyan-400/30 rounded-xl text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <Gamepad className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                Controle Bluetooth <span className="text-cyan-400 font-light text-sm tracking-widest uppercase">Gamepad T3/X3</span>
              </h2>
              <p className="text-xs text-white/60">
                Mapeamento dinâmico e calibração automática para controles T3, Xbox, PlayStation e Bluetooth.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all cursor-pointer text-white/80 active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Activation Toggle */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <Bluetooth className={`w-5 h-5 ${config.enabled ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
            <div>
              <span className="font-bold text-sm block">Ativar Mapeamento Bluetooth</span>
              <span className="text-[10px] text-white/50 block">Habilita a escuta contínua de controles conectados</span>
            </div>
          </div>
          <button
            onClick={toggleEnabled}
            className={`px-4 py-2 text-xs font-bold tracking-widest uppercase rounded-xl border transition-all active:scale-95 cursor-pointer ${
              config.enabled
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.25)]'
                : 'bg-white/5 text-slate-400 border-white/10'
            }`}
          >
            {config.enabled ? 'ATIVADO' : 'DESATIVADO'}
          </button>
        </div>

        {/* AUTO-DETECT WIZARD BANNER / MODE */}
        {wizardStep && wizardStep !== 'done' && (
          <div className="bg-pink-500/20 border-2 border-pink-400 rounded-2xl p-4 flex flex-col gap-3 shadow-[0_0_30px_rgba(244,114,182,0.3)] animate-pulse">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-pink-300 uppercase tracking-widest flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-pink-400 animate-spin" /> BUSCA AUTOMÁTICA EM ANDAMENTO
              </span>
              <button
                onClick={cancelWizard}
                className="text-[10px] font-bold text-pink-200 hover:text-white bg-pink-900/50 px-2.5 py-1 rounded-lg border border-pink-500/30 cursor-pointer"
              >
                CANCELAR
              </button>
            </div>
            
            <div className="bg-black/80 p-4 rounded-xl border border-pink-500/40 text-center space-y-2">
              <span className="text-xs text-pink-300 font-bold block">
                Etapa {wizardStep === 'left' ? '1/7' : wizardStep === 'right' ? '2/7' : wizardStep === 'jump' ? '3/7' : wizardStep === 'crouch' ? '4/7' : wizardStep === 'sim' ? '5/7' : wizardStep === 'nao' ? '6/7' : '7/7'}:
              </span>
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider flex items-center justify-center gap-2">
                {wizardStep === 'left' && <><ArrowLeft className="w-5 h-5 text-cyan-400" /> MOVER PARA A ESQUERDA</>}
                {wizardStep === 'right' && <><ArrowRight className="w-5 h-5 text-cyan-400" /> MOVER PARA A DIREITA</>}
                {wizardStep === 'jump' && <><ArrowUp className="w-5 h-5 text-yellow-400" /> PULAR (EX: BOTÃO A OU Y)</>}
                {wizardStep === 'crouch' && <><ArrowDown className="w-5 h-5 text-emerald-400" /> AGACHAR (EX: BOTÃO B OU X)</>}
                {wizardStep === 'sim' && <><CheckCircle2 className="w-5 h-5 text-rose-400" /> RESPONDER "SIM" (EX: BOTÃO A / X)</>}
                {wizardStep === 'nao' && <><XCircle className="w-5 h-5 text-teal-400" /> RESPONDER "NÃO" (EX: BOTÃO B / Y)</>}
                {wizardStep === 'pause' && <><Play className="w-5 h-5 text-pink-400" /> PAUSAR / INICIAR (EX: START OU HOME)</>}
              </h3>
              
              {wizardFeedback ? (
                <div className="py-2 px-3 bg-emerald-500/20 border border-emerald-400/40 rounded-lg text-emerald-300 text-xs font-bold animate-bounce">
                  {wizardFeedback}
                </div>
              ) : (
                <p className="text-[11px] text-pink-200/90 italic">
                  Pressione o botão correspondente no seu controle joystick agora!
                </p>
              )}
            </div>
          </div>
        )}

        {/* Wizard Success Notification */}
        {wizardStep === 'done' && (
          <div className="bg-emerald-500/20 border border-emerald-400/40 rounded-2xl p-4 flex items-center justify-between shadow-[0_0_20px_rgba(52,211,153,0.2)]">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-300">
                Ações do Joystick Calibradas e Mapeadas com Sucesso!
              </span>
            </div>
            <button
              onClick={() => setWizardStep(null)}
              className="px-3 py-1 bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-200 rounded-lg text-xs font-bold cursor-pointer"
            >
              OK
            </button>
          </div>
        )}

        {/* Gamepad Connection Status Dashboard & Visualizer */}
        <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" /> Painel de Hardware Ativo & Teste
          </span>

          {/* Interactive Graphic Diagram of T3 / X3 Controller */}
          <T3JoystickDiagram pressedButtons={pressedButtons} axes={liveAxes} />

          {activeGamepad ? (
            <div className="space-y-3">
              <div className="bg-cyan-400/10 border border-cyan-400/20 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    CONECTADO COM SUCESSO
                  </span>
                  <span className="text-sm font-semibold tracking-tight text-white block mt-1 truncate max-w-[320px]">
                    {activeGamepad.id}
                  </span>
                </div>
                <span className="text-[10px] font-mono bg-white/5 border border-white/10 px-2 py-1 rounded text-white/60">
                  ID: #{activeGamepad.index}
                </span>
              </div>

              {/* REAL TIME INPUT IDENTIFIER BANNER */}
              <div className="bg-slate-900/90 border border-cyan-400/30 rounded-xl p-3 flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400 animate-pulse" />
                  <div>
                    <span className="text-[10px] text-white/50 block uppercase font-bold">Último Sinal Detectado no Joystick</span>
                    <span className="text-xs font-mono font-bold text-cyan-300">
                      {lastInputDetected || 'Aguardando toque em algum botão...'}
                    </span>
                  </div>
                </div>
                {pressedButtons.length > 0 && (
                  <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold rounded">
                    TESTE OK
                  </span>
                )}
              </div>

              {/* REAL TIME VISUALIZER OF INPUTS */}
              <div className="grid grid-cols-2 gap-3 bg-black/30 p-3 rounded-xl border border-white/5">
                <div className="space-y-1.5">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Analógico Esquerdo (X)</span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-3 bg-slate-950 rounded-full relative overflow-hidden border border-white/5">
                      <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-white/20" />
                      <div
                        className={`absolute top-0 bottom-0 ${liveXAxis < 0 ? 'right-1/2 bg-cyan-400' : 'left-1/2 bg-cyan-400'}`}
                        style={{
                          width: `${Math.min(50, Math.abs(liveXAxis) * 50)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono w-10 text-right text-cyan-300">
                      {liveXAxis.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Botões Pressionados</span>
                  <div className="flex flex-wrap gap-1 max-h-[38px] overflow-y-auto">
                    {pressedButtons.length > 0 ? (
                      pressedButtons.map((btn) => (
                        <span key={btn} className="px-1.5 py-0.5 bg-pink-500/30 border border-pink-400/40 text-pink-300 text-[9px] font-mono rounded font-bold">
                          B{btn}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-white/30 italic">Aguardando botão...</span>
                    )}
                  </div>
                </div>
              </div>

              {/* PAINEL DE TESTE EM TEMPO REAL - VALIDAÇÃO INSTANTÂNEA DE SIM / NÃO */}
              {(() => {
                const simBtnsMapped = currentMap.simButtons || [0, 2, 14, 4];
                const naoBtnsMapped = currentMap.naoButtons || [1, 3, 15, 5];
                const isSimPressedOnGp = pressedButtons.some((b) => simBtnsMapped.includes(b));
                const isNaoPressedOnGp = pressedButtons.some((b) => naoBtnsMapped.includes(b));
                const isSimActive = isSimPressedOnGp || keyboardSimPressed;
                const isNaoActive = isNaoPressedOnGp || keyboardNaoPressed;

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-black/40 p-3 rounded-xl border border-white/10">
                    {/* CARD TESTE SIM */}
                    <div className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2 ${
                      isSimActive
                        ? 'bg-gradient-to-br from-emerald-500/30 via-emerald-600/40 to-emerald-700/50 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.4)] scale-[1.02]'
                        : 'bg-black/40 border-emerald-500/20'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className={`w-4 h-4 ${isSimActive ? 'text-emerald-300 animate-bounce' : 'text-emerald-500/60'}`} />
                          <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                            Teste "SIM"
                          </span>
                        </div>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase ${
                          isSimActive
                            ? 'bg-emerald-400 text-black border-emerald-300 font-extrabold animate-pulse'
                            : 'bg-emerald-950/40 text-emerald-400/60 border-emerald-500/20'
                        }`}>
                          {isSimActive ? 'VALIDADO!' : 'Aguardando'}
                        </span>
                      </div>

                      <p className="text-[10px] text-emerald-200/80 leading-tight">
                        Mapeado: {simBtnsMapped.map((b) => getButtonLabel(b)).slice(0, 3).join('/')} | Teclado: S, A, ←, Enter, 1, Espaço
                      </p>

                      {isSimActive && (
                        <div className="py-1 px-2 bg-emerald-400/20 border border-emerald-300/40 rounded text-emerald-200 text-[10px] font-bold flex items-center justify-center gap-1">
                          <Zap className="w-3 h-3 text-yellow-300 animate-pulse" /> SINAL SIM DETECTADO!
                        </div>
                      )}
                    </div>

                    {/* CARD TESTE NÃO */}
                    <div className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2 ${
                      isNaoActive
                        ? 'bg-gradient-to-br from-rose-500/30 via-rose-600/40 to-rose-700/50 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)] scale-[1.02]'
                        : 'bg-black/40 border-rose-500/20'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <XCircle className={`w-4 h-4 ${isNaoActive ? 'text-rose-300 animate-bounce' : 'text-rose-500/60'}`} />
                          <span className="text-xs font-black uppercase tracking-wider text-rose-300">
                            Teste "NÃO"
                          </span>
                        </div>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase ${
                          isNaoActive
                            ? 'bg-rose-400 text-black border-rose-300 font-extrabold animate-pulse'
                            : 'bg-rose-950/40 text-rose-400/60 border-rose-500/20'
                        }`}>
                          {isNaoActive ? 'VALIDADO!' : 'Aguardando'}
                        </span>
                      </div>

                      <p className="text-[10px] text-rose-200/80 leading-tight">
                        Mapeado: {naoBtnsMapped.map((b) => getButtonLabel(b)).slice(0, 3).join('/')} | Teclado: N, D, →, Esc, Backspace, 2
                      </p>

                      {isNaoActive && (
                        <div className="py-1 px-2 bg-rose-400/20 border border-rose-300/40 rounded text-rose-200 text-[10px] font-bold flex items-center justify-center gap-1">
                          <Zap className="w-3 h-3 text-yellow-300 animate-pulse" /> SINAL NÃO DETECTADO!
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="py-5 text-center space-y-2 border border-dashed border-amber-500/30 bg-amber-500/5 rounded-xl">
              <AlertCircle className="w-5 h-5 text-amber-400 mx-auto animate-pulse" />
              <span className="text-xs font-bold text-amber-300 block">Nenhum controle detectado no navegador.</span>
              <p className="text-[10px] text-amber-200/70 max-w-sm mx-auto">
                Ligue seu controle T3/X3 e <strong>pressione qualquer botão</strong> (como A, B ou START) para que o navegador ative o joystick.
              </p>
            </div>
          )}
        </div>

        {/* CUSTOM BUTTON REMAPPING & ACTION SEARCH SECTION */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                <Sliders className="w-4 h-4 text-cyan-400" /> Mapeamento Individual de Ações
              </span>
              <p className="text-[10px] text-white/50">
                Altere manualmente quais teclas acionam cada comando ou use a busca automática.
              </p>
            </div>

            <button
              onClick={startAutoDetectWizard}
              className="px-3 py-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 border border-pink-400/40 text-pink-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-lg"
            >
              <RefreshCw className="w-3.5 h-3.5 text-pink-400 animate-spin" /> BUSCA AUTOMÁTICA
            </button>
          </div>

          {/* Action Mapping Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* JUMP ACTION */}
            <div className={`p-3 rounded-xl border transition-all flex justify-between items-center ${
              rebindingAction === 'jump'
                ? 'bg-amber-500/20 border-amber-400 animate-pulse'
                : 'bg-black/30 border-white/5'
            }`}>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-yellow-300 flex items-center gap-1">
                  <ArrowUp className="w-3.5 h-3.5" /> PULAR (Jump)
                </span>
                <span className="text-[10px] font-mono text-white/70">
                  {rebindingAction === 'jump' ? (rebindFeedback || 'Pressione o botão no joystick...') : formatButtonNames(currentMap.jumpButtons)}
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => startRebinding('jump')}
                  className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 text-[10px] font-bold rounded-lg cursor-pointer"
                >
                  {rebindingAction === 'jump' ? 'Cancelar' : 'Alterar'}
                </button>
                <button
                  onClick={() => clearActionMapKey('jumpButtons')}
                  className="px-1.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] rounded-lg cursor-pointer"
                  title="Limpar"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* CROUCH ACTION */}
            <div className={`p-3 rounded-xl border transition-all flex justify-between items-center ${
              rebindingAction === 'crouch'
                ? 'bg-amber-500/20 border-amber-400 animate-pulse'
                : 'bg-black/30 border-white/5'
            }`}>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                  <ArrowDown className="w-3.5 h-3.5" /> AGACHAR (Crouch)
                </span>
                <span className="text-[10px] font-mono text-white/70">
                  {rebindingAction === 'crouch' ? (rebindFeedback || 'Pressione o botão no joystick...') : formatButtonNames(currentMap.crouchButtons)}
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => startRebinding('crouch')}
                  className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 text-[10px] font-bold rounded-lg cursor-pointer"
                >
                  {rebindingAction === 'crouch' ? 'Cancelar' : 'Alterar'}
                </button>
                <button
                  onClick={() => clearActionMapKey('crouchButtons')}
                  className="px-1.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] rounded-lg cursor-pointer"
                  title="Limpar"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* LEFT ACTION */}
            <div className={`p-3 rounded-xl border transition-all flex justify-between items-center ${
              rebindingAction === 'left'
                ? 'bg-amber-500/20 border-amber-400 animate-pulse'
                : 'bg-black/30 border-white/5'
            }`}>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-sky-300 flex items-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> MOVER ESQUERDA
                </span>
                <span className="text-[10px] font-mono text-white/70">
                  {rebindingAction === 'left' ? (rebindFeedback || 'Pressione o botão no joystick...') : formatButtonNames(currentMap.leftButtons)}
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => startRebinding('left')}
                  className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 text-[10px] font-bold rounded-lg cursor-pointer"
                >
                  {rebindingAction === 'left' ? 'Cancelar' : 'Alterar'}
                </button>
                <button
                  onClick={() => clearActionMapKey('leftButtons')}
                  className="px-1.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] rounded-lg cursor-pointer"
                  title="Limpar"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* RIGHT ACTION */}
            <div className={`p-3 rounded-xl border transition-all flex justify-between items-center ${
              rebindingAction === 'right'
                ? 'bg-amber-500/20 border-amber-400 animate-pulse'
                : 'bg-black/30 border-white/5'
            }`}>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-sky-300 flex items-center gap-1">
                  <ArrowRight className="w-3.5 h-3.5" /> MOVER DIREITA
                </span>
                <span className="text-[10px] font-mono text-white/70">
                  {rebindingAction === 'right' ? (rebindFeedback || 'Pressione o botão no joystick...') : formatButtonNames(currentMap.rightButtons)}
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => startRebinding('right')}
                  className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 text-[10px] font-bold rounded-lg cursor-pointer"
                >
                  {rebindingAction === 'right' ? 'Cancelar' : 'Alterar'}
                </button>
                <button
                  onClick={() => clearActionMapKey('rightButtons')}
                  className="px-1.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] rounded-lg cursor-pointer"
                  title="Limpar"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* RESPONDER SIM NAS PERGUNTAS */}
            <div className={`p-3 rounded-xl border transition-all flex justify-between items-center ${
              rebindingAction === 'sim'
                ? 'bg-amber-500/20 border-amber-400 animate-pulse'
                : 'bg-black/30 border-white/5'
            }`}>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-rose-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> RESPONDER "SIM" (Perguntas)
                </span>
                <span className="text-[10px] font-mono text-white/70">
                  {rebindingAction === 'sim' ? (rebindFeedback || 'Pressione o botão no joystick...') : formatButtonNames(currentMap.simButtons || [0, 2, 14, 4])}
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => startRebinding('sim')}
                  className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 text-[10px] font-bold rounded-lg cursor-pointer"
                >
                  {rebindingAction === 'sim' ? 'Cancelar' : 'Alterar'}
                </button>
                <button
                  onClick={() => clearActionMapKey('simButtons')}
                  className="px-1.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] rounded-lg cursor-pointer"
                  title="Limpar"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* RESPONDER NÃO NAS PERGUNTAS */}
            <div className={`p-3 rounded-xl border transition-all flex justify-between items-center ${
              rebindingAction === 'nao'
                ? 'bg-amber-500/20 border-amber-400 animate-pulse'
                : 'bg-black/30 border-white/5'
            }`}>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-teal-300 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> RESPONDER "NÃO" (Perguntas)
                </span>
                <span className="text-[10px] font-mono text-white/70">
                  {rebindingAction === 'nao' ? (rebindFeedback || 'Pressione o botão no joystick...') : formatButtonNames(currentMap.naoButtons || [1, 3, 15, 5])}
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => startRebinding('nao')}
                  className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 text-[10px] font-bold rounded-lg cursor-pointer"
                >
                  {rebindingAction === 'nao' ? 'Cancelar' : 'Alterar'}
                </button>
                <button
                  onClick={() => clearActionMapKey('naoButtons')}
                  className="px-1.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] rounded-lg cursor-pointer"
                  title="Limpar"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* PAUSE / START ACTION */}
            <div className={`p-3 rounded-xl border transition-all flex justify-between items-center sm:col-span-2 ${
              rebindingAction === 'pause'
                ? 'bg-amber-500/20 border-amber-400 animate-pulse'
                : 'bg-black/30 border-white/5'
            }`}>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-pink-300 flex items-center gap-1">
                  <Play className="w-3.5 h-3.5" /> PAUSAR / INICIAR JOGO
                </span>
                <span className="text-[10px] font-mono text-white/70">
                  {rebindingAction === 'pause' ? (rebindFeedback || 'Pressione o botão no joystick...') : formatButtonNames(currentMap.pauseButtons)}
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => startRebinding('pause')}
                  className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 text-[10px] font-bold rounded-lg cursor-pointer"
                >
                  {rebindingAction === 'pause' ? 'Cancelar' : 'Alterar'}
                </button>
                <button
                  onClick={() => clearActionMapKey('pauseButtons')}
                  className="px-1.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] rounded-lg cursor-pointer"
                  title="Limpar"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
            <span className="text-[10px] text-white/40 uppercase font-bold">Perfis Prontos:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => applyPreset(T3_DEFAULT_ACTION_MAP)}
                className="px-2.5 py-1 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-400/30 text-pink-300 text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Padrão T3 / X3
              </button>
              <button
                onClick={() => applyPreset(XBOX_DEFAULT_ACTION_MAP)}
                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-[10px] font-bold rounded-lg cursor-pointer"
              >
                Xbox / X-Input
              </button>
              <button
                onClick={() => applyPreset(PS4_DEFAULT_ACTION_MAP)}
                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-[10px] font-bold rounded-lg cursor-pointer"
              >
                PlayStation 4/5
              </button>
            </div>
          </div>
        </div>

        {/* CONFIGURATIONS FORM */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* CONTROL SCHEME MODE */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-cyan-400" /> Modo Preferencial de Navegação
            </span>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => setMode('analog')}
                className={`w-full py-2.5 px-3 rounded-xl border text-left flex justify-between items-center transition-all cursor-pointer active:scale-95 ${
                  config.mode === 'analog'
                    ? 'bg-cyan-500/10 border-cyan-400/40 text-cyan-300'
                    : 'bg-black/30 border-white/5 text-slate-300 hover:border-white/10'
                }`}
              >
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold">Analógico + D-Pad + Botões</span>
                  <span className="text-[9px] text-white/40">Aceita todos os comandos simultaneamente</span>
                </div>
                {config.mode === 'analog' && <Check className="w-4 h-4 text-cyan-400" />}
              </button>

              <button
                onClick={() => setMode('dpad')}
                className={`w-full py-2.5 px-3 rounded-xl border text-left flex justify-between items-center transition-all cursor-pointer active:scale-95 ${
                  config.mode === 'dpad'
                    ? 'bg-cyan-500/10 border-cyan-400/40 text-cyan-300'
                    : 'bg-black/30 border-white/5 text-slate-300 hover:border-white/10'
                }`}
              >
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold">Apenas D-Pad (Direcional Digital)</span>
                  <span className="text-[9px] text-white/40">Navega exclusivamente via cruz digital</span>
                </div>
                {config.mode === 'dpad' && <Check className="w-4 h-4 text-cyan-400" />}
              </button>

              <button
                onClick={() => setMode('buttons')}
                className={`w-full py-2.5 px-3 rounded-xl border text-left flex justify-between items-center transition-all cursor-pointer active:scale-95 ${
                  config.mode === 'buttons'
                    ? 'bg-cyan-500/10 border-cyan-400/40 text-cyan-300'
                    : 'bg-black/30 border-white/5 text-slate-300 hover:border-white/10'
                }`}
              >
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold">Botões Principais / Gatilhos</span>
                  <span className="text-[9px] text-white/40">Gatilhos superiores (L1/R1) ou botões A/B</span>
                </div>
                {config.mode === 'buttons' && <Check className="w-4 h-4 text-cyan-400" />}
              </button>
            </div>
          </div>

          {/* CALIBRATION & SENSITIVITY */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Sensibilidade & Zona Morta
              </span>

              <div className="space-y-2 bg-black/30 p-3 rounded-xl border border-white/5">
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>Zona Morta do Analógico</span>
                  <span className="font-mono text-cyan-300">{config.deadzone.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.45"
                  step="0.05"
                  value={config.deadzone}
                  onChange={handleDeadzoneChange}
                  className="w-full accent-cyan-400 bg-slate-950 rounded-lg cursor-pointer"
                />
                <span className="text-[9px] text-white/40 block leading-tight">
                  Valores menores respondem mais rápido, valores maiores evitam drifting de analógicos velhos.
                </span>
              </div>
            </div>

            {/* INVERT DIRECTION */}
            <div className="flex items-center justify-between bg-black/30 p-3 rounded-xl border border-white/5">
              <div className="flex flex-col">
                <span className="text-xs font-bold">Inverter Controles</span>
                <span className="text-[9px] text-white/40">Inverte esquerda e direita</span>
              </div>
              <button
                onClick={toggleInvert}
                className={`w-10 h-6 rounded-full p-0.5 border transition-colors flex ${
                  config.invert ? 'bg-cyan-500 border-cyan-400 justify-end' : 'bg-slate-950 border-white/10 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow" />
              </button>
            </div>

            {/* BLOCK ANALOG IN QUESTION RESPONSES */}
            <div className="flex items-center justify-between bg-black/30 p-3 rounded-xl border border-white/5">
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  Bloquear Analógico nas Respostas
                </span>
                <span className="text-[9px] text-white/40">
                  Bloqueia por padrão o analógico nas perguntas para evitar respostas por desvio (drift)
                </span>
              </div>
              <button
                onClick={toggleBlockAnalogInQuestions}
                className={`w-10 h-6 rounded-full p-0.5 border transition-colors flex ${
                  config.blockAnalogInQuestions !== false
                    ? 'bg-cyan-500 border-cyan-400 justify-end'
                    : 'bg-slate-950 border-white/10 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow" />
              </button>
            </div>
          </div>
        </div>

        {/* CONNECTION GUIDE FOR THIS EXACT T3/X3 MODEL */}
        <div className="bg-pink-500/10 border border-pink-500/30 rounded-2xl p-4 space-y-2 text-left">
          <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-pink-400" /> Dicas de Compatibilidade do Joystick T3:
          </span>
          <ul className="text-[10.5px] text-slate-200 space-y-1.5 list-disc list-inside">
            <li>
              <strong>Ativação do Bluetooth</strong>: Ligue o controle pressionando <strong>X + HOME</strong> por 3s até a luz LED piscar rápido.
            </li>
            <li>
              <strong>Busca Automática</strong>: Clique em <strong>BUSCA AUTOMÁTICA</strong> e toque no botão do controle correspondente a cada ação exibida na tela.
            </li>
          </ul>
        </div>

        {/* Confirm Footer */}
        <button
          onClick={onClose}
          className="w-full py-3.5 bg-cyan-400/20 hover:bg-cyan-400/30 text-cyan-300 border border-cyan-400/40 rounded-2xl font-bold transition-all text-xs tracking-wider uppercase shadow-xl hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" /> CONFIRMAR CONFIGURAÇÃO DO JOYSTICK
        </button>

      </div>
    </div>
  );
};
