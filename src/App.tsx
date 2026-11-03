import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, SASQuestion, FallingItem, GamepadConfig, GameSettings, DEFAULT_GAME_SETTINGS, PlayerProfile, CollectedCase, DemoProfile, CharacterId, CHARACTER_PROFILES, DataCollectionAudience } from './types';
import { generateRandomSASQuestions, getShuffledSASQuestions } from './data/sasQuestions';
import { Navbar } from './components/Navbar';
import { ThreeCanvas } from './components/ThreeCanvas';
import { GameHUD } from './components/GameHUD';
import { LuauCodeViewer } from './components/LuauCodeViewer';
import { RobloxSetupGuide } from './components/RobloxSetupGuide';
import { FomoAnalytics } from './components/FomoAnalytics';
import { GamepadConfigModal, DEFAULT_ACTION_MAP } from './components/GamepadConfigModal';
import { GameControlPanel } from './components/GameControlPanel';
import { PlayerInfoModal } from './components/PlayerInfoModal';
import { QRCodeCard } from './components/QRCodeCard';
import { PrintViewPage } from './components/PrintViewPage';
import { GameDocumentation } from './components/GameDocumentation';
import { HistoryModal } from './components/HistoryModal';
import { SkillShopModal } from './components/SkillShopModal';
import { VirtualAvatarDemoOverlay } from './components/VirtualAvatarDemoOverlay';
import { VoiceTutorialAssistant } from './components/VoiceTutorialAssistant';
import { TechDevTourModal } from './components/TechDevTourModal';
import { WindowsInstallModal } from './components/WindowsInstallModal';
import { CameraAccessibilityModal } from './components/CameraAccessibilityModal';
import { CameraFaceHUDOverlay } from './components/CameraFaceHUDOverlay';
import { useCameraFaceTracking, CameraTrackingConfig } from './hooks/useCameraFaceTracking';
import { WelcomeTutorial30s } from './components/WelcomeTutorial30s';
import { CharacterSelectionModal } from './components/CharacterSelectionModal';
import { AudienceManagerModal } from './components/AudienceManagerModal';
import { getStoredAudiences, saveStoredAudiences, getStoredActiveAudienceId, saveStoredActiveAudienceId, findAudienceById } from './data/targetAudiences';
import { Play, RotateCcw, ShieldCheck, ShieldAlert, BarChart3, ChevronDown, ChevronUp, Sparkles, Volume2, VolumeX, Keyboard, Gamepad2, Gamepad, X, BookOpen, Download, Instagram, User, UserCheck, ExternalLink, Vote, History, Shield, Target, Users, HeartPulse } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getStoredPlayerProfile, saveStoredPlayerProfile, saveCollectedCase, getStoredCollectedCases, isFirestoreQuotaExceeded } from './utils/caseStorage';
import { getHistorySessionsLocal, saveGameSessionLocal, getTotalCoinsLocal, addTotalCoinsLocal, getPlayerSkillsLocal, GameSession } from './utils/historyStorage';
import { PlayerSkills } from './types';
import { useLanguage } from './i18n/LanguageContext';

// Real-time Presence Firebase Imports
import { db, auth } from './lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, query, onSnapshot, where, deleteDoc, collection, serverTimestamp } from 'firebase/firestore';

import instagramLogo from './assets/images/entreredes_logo_1787106204844.jpg';
import researchersImage from './assets/images/pesquisadores_1787106642560.jpg';
import {
  initAudio,
  playCollectWellnessSFX,
  playCoinCollectSFX,
  playHarmfulHitSFX,
  playGuitarChordSFX,
  playSASQuestionChime,
  playZenEnterSFX,
  playVictorySFX,
  playDefeatSFX,
  playObstacleHitSFX,
  speakQuestion,
  stopSpeech,
  playDogBarkSFX,
  setGlobalSFXVolume,
  playButtonClickSFX,
  playRestingSleepSFX,
  playHouseDoorSFX,
  playSoccerKickSFX,
  playSoccerGoalSFX,
  playCalmingTeaSFX,
  playBreathingCycleSFX,
  setGlobalAudioSettingsProvider,
} from './utils/audio';

export default function App() {
  const { language, setLanguage, t, getLocalizedQuestion } = useLanguage();
  const isPrintMode = typeof window !== 'undefined' && window.location.search.includes('print=true');

  if (isPrintMode) {
    return <PrintViewPage />;
  }

  // Local History State
  const [historySessions, setHistorySessions] = useState<GameSession[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [playerSkills, setPlayerSkills] = useState<PlayerSkills>({ doubleJump: false, shield: false, magnet: false, resilience: 0, betterShoes: false, hoodie: false, bicycle: false, skate: false, patinete: false, soccerKit: false, calmingTea: false, breathingBand: false, activeVehicle: 'none', activeShoes: 'basic', ownedShoes: ['basic'] });
  const [showShopModal, setShowShopModal] = useState<boolean>(false);
  const [isShieldActive, setIsShieldActive] = useState<boolean>(false);

  // Selected Character State (Guto, Léo, Caio)
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>('guto');
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState<boolean>(false);

  useEffect(() => {
    // Load local history on mount
    setHistorySessions(getHistorySessionsLocal());
    setGoldCoinsCount(getTotalCoinsLocal());
    setPlayerSkills(getPlayerSkillsLocal());
  }, []);

  const [activeTab, setActiveTab] = useState<'simulator' | 'code' | 'guide' | 'analytics' | 'informacoes'>('simulator');

  // Player Profile State for Clinical Case Collection
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile>(() => getStoredPlayerProfile());
  const [isPlayerProfileModalOpen, setIsPlayerProfileModalOpen] = useState<boolean>(false);
  const [isBeforeStartModal, setIsBeforeStartModal] = useState<boolean>(false);
  const [lastSavedCase, setLastSavedCase] = useState<CollectedCase | null>(null);

  // Real-time Presence State & Heartbeat Loop
  const [onlineCount, setOnlineCount] = useState<number>(1);

  useEffect(() => {
    let activeUserId = '';
    let heartbeatInterval: NodeJS.Timeout;
    let listenerInterval: NodeJS.Timeout;
    let unsubscribeSnapshot: (() => void) | undefined;

    const initPresence = async () => {
      // 1. Authenticate anonymously or generate fallback user ID
      try {
        await signInAnonymously(auth);
        activeUserId = auth.currentUser?.uid || '';
      } catch (err) {
        console.warn("Could not sign in anonymously, using local fallback ID:", err);
      }

      if (!activeUserId) {
        // Fallback to local session ID if auth failed/offline
        let localId = sessionStorage.getItem('fomo_presence_userId');
        if (!localId) {
          localId = 'anon_' + Math.random().toString(36).substring(2) + '_' + Date.now();
          sessionStorage.setItem('fomo_presence_userId', localId);
        }
        activeUserId = localId;
      }

      // 2. Define heartbeat writer
      const writeHeartbeat = async () => {
        if (isFirestoreQuotaExceeded) return;
        try {
          const docRef = doc(db, 'presence', activeUserId);
          await setDoc(docRef, {
            lastActive: serverTimestamp(),
            username: playerProfile?.name || 'Participante',
          }, { merge: true });
        } catch (err) {
          const msg = String(err);
          if (msg.includes('Quota exceeded') || msg.includes('resource-exhausted')) {
            if (heartbeatInterval) clearInterval(heartbeatInterval);
            if (listenerInterval) clearInterval(listenerInterval);
            return;
          }
          try {
            const docRef = doc(db, 'presence', activeUserId);
            await setDoc(docRef, {
              lastActive: new Date(),
              username: playerProfile?.name || 'Participante',
            }, { merge: true });
          } catch (silentErr) {
            // Ignore write errors to keep app fully playable offline
          }
        }
      };

      // Write initial heartbeat immediately
      await writeHeartbeat();

      // Repeat heartbeat every 10 seconds
      heartbeatInterval = setInterval(writeHeartbeat, 10000);

      // 3. Define real-time active users listener (moving window of last 30s)
      const setupSnapshotListener = () => {
        if (isFirestoreQuotaExceeded) return;
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
        }

        const thirtySecondsAgo = new Date(Date.now() - 30000);
        const q = query(
          collection(db, 'presence'),
          where('lastActive', '>=', thirtySecondsAgo)
        );

        unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          setOnlineCount(Math.max(1, snapshot.size));
        }, (error) => {
          console.warn("Presence snapshot listener paused (offline / quota):", error);
          if (listenerInterval) clearInterval(listenerInterval);
        });
      };

      setupSnapshotListener();
      // Recreate query every 15 seconds to shift the threshold forward
      listenerInterval = setInterval(setupSnapshotListener, 15000);

      // 4. Handle clean deletion on exit/unload
      const handleUnload = () => {
        try {
          const docRef = doc(db, 'presence', activeUserId);
          deleteDoc(docRef);
        } catch (err) {
          // Ignore unload deletion errors
        }
      };
      window.addEventListener('beforeunload', handleUnload);
      window.addEventListener('unload', handleUnload);

      return () => {
        window.removeEventListener('beforeunload', handleUnload);
        window.removeEventListener('unload', handleUnload);
        handleUnload();
      };
    };

    let cleanupFn: (() => void) | undefined;
    initPresence().then((cleanup) => {
      cleanupFn = cleanup;
    });

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (listenerInterval) clearInterval(listenerInterval);
      if (unsubscribeSnapshot) unsubscribeSnapshot();
      if (cleanupFn) cleanupFn();
    };
  }, [playerProfile?.name]);

  // Game Engine States
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [gameTimer, setGameTimer] = useState<number>(0);
  const [isWelcome30sActive, setIsWelcome30sActive] = useState<boolean>(false);
  const [anxietyLevel, setAnxietyLevel] = useState<number>(0);
  const [graceTimer, setGraceTimer] = useState<number | null>(null);

  const [notificationSpeed, setNotificationSpeed] = useState<number>(1.0);
  const [anxietyMultiplier, setAnxietyMultiplier] = useState<number>(1.0);
  const [harmfulStreak, setHarmfulStreak] = useState<number>(0);
  const [lastChoiceFeedback, setLastChoiceFeedback] = useState<{ type: 'SIM' | 'NAO'; message: string } | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<SASQuestion | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [zenReason, setZenReason] = useState<string | null>(null);
  const [activeSASQuestions, setActiveSASQuestions] = useState<Record<number, SASQuestion>>(() =>
    generateRandomSASQuestions()
  );

  // Track session answers for end-of-game psychometric evaluation
  const [sessionAnswers, setSessionAnswers] = useState<
    Array<{ question: string; answer: 'SIM' | 'NÃO'; category?: string; timeTrigger: number }>
  >([]);

  // Medicine & Side Effects States
  const [medicineSideEffectsActive, setMedicineSideEffectsActive] = useState<boolean>(false);
  const [medicineRemainingSeconds, setMedicineRemainingSeconds] = useState<number>(0);
  const [showMedicinePurchaseModal, setShowMedicinePurchaseModal] = useState<boolean>(false);

  // Gamepad/Bluetooth Controller States (Persisted in localStorage)
  const [gamepadConfig, setGamepadConfig] = useState<GamepadConfig>(() => {
    try {
      const saved = localStorage.getItem('gamepad_custom_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.blockAnalogInQuestions === undefined) {
          parsed.blockAnalogInQuestions = true;
        }
        return parsed;
      }
    } catch (e) {
      console.error('Error loading gamepad config from localStorage:', e);
    }
    return {
      enabled: true,
      mode: 'analog',
      deadzone: 0.15,
      invert: false,
      blockAnalogInQuestions: true,
    };
  });

  const handleUpdateGamepadConfig = (newConfig: GamepadConfig) => {
    setGamepadConfig(newConfig);
    try {
      localStorage.setItem('gamepad_custom_config', JSON.stringify(newConfig));
    } catch (err) {
      console.error('Error saving gamepad config:', err);
    }
  };
  const [isGamepadModalOpen, setIsGamepadModalOpen] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [isTechTourOpen, setIsTechTourOpen] = useState<boolean>(false);
  const [isWindowsInstallOpen, setIsWindowsInstallOpen] = useState<boolean>(false);

  // Camera Face Tracking Accessibility States (Disabled by default)
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [cameraTrackingConfig, setCameraTrackingConfig] = useState<CameraTrackingConfig>(() => {
    try {
      const saved = localStorage.getItem('fomo_camera_tracking_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...parsed, enabled: false };
      }
    } catch (e) {
      console.warn('Error reading camera tracking config:', e);
    }
    return {
      enabled: false,
      sensitivity: 'media',
      invertX: true,
      drawDebugCanvas: true,
    };
  });

  const handleUpdateCameraConfig = (newConfig: Partial<CameraTrackingConfig>) => {
    setCameraTrackingConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      try {
        localStorage.setItem('fomo_camera_tracking_config', JSON.stringify(updated));
      } catch (err) {
        console.warn('Error saving camera tracking config:', err);
      }
      return updated;
    });
  };

  // Connect Camera Face Tracking Hook to Game Movement Controls
  const {
    videoRef: cameraVideoRef,
    canvasRef: cameraCanvasRef,
    motionState: cameraMotionState,
    calibrateCenter: calibrateCameraCenter,
    mediaStream: cameraMediaStream,
  } = useCameraFaceTracking(
    cameraTrackingConfig,
    {
      onMoveLeft: () => {
        handleSetMovingLeft(true);
        setTimeout(() => handleSetMovingLeft(false), 350);
      },
      onMoveRight: () => {
        handleSetMovingRight(true);
        setTimeout(() => handleSetMovingRight(false), 350);
      },
      onJump: () => {
        handleSetJumping(true);
        setTimeout(() => handleSetJumping(false), 600);
      },
      onCrouch: () => {
        handleSetCrouching(true);
        setTimeout(() => handleSetCrouching(false), 700);
      },
      onAnswerNo: () => {
        if (currentQuestion && gameState === 'PAUSED_SAS') {
          handleAnswerSAS(false);
        }
      },
      onAnswerYes: () => {
        if (currentQuestion && gameState === 'PAUSED_SAS') {
          handleAnswerSAS(true);
        }
      },
    }
  );

  // Demo Mode & Virtual Avatar Simulation State
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [demoProfile, setDemoProfile] = useState<DemoProfile>('Equilibrado');

  // Custom Game Settings & Control Panel State (Persisted in localStorage)
  const [gameSettings, setGameSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem('entre_redes_game_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_GAME_SETTINGS,
          ...parsed,
          enableWelcome30sTutorial: parsed.enableWelcome30sTutorial ?? false,
          showVoiceAssistant: parsed.showVoiceAssistant ?? false,
          hideShopButton: parsed.hideShopButton === true ? false : (parsed.hideShopButton ?? DEFAULT_GAME_SETTINGS.hideShopButton),
          disableAnxietyLighting: parsed.disableAnxietyLighting === true ? false : (parsed.disableAnxietyLighting ?? DEFAULT_GAME_SETTINGS.disableAnxietyLighting),
          dayNightMode: parsed.dayNightMode === 'night' ? 'auto' : (parsed.dayNightMode ?? DEFAULT_GAME_SETTINGS.dayNightMode),
          weatherPreset: parsed.weatherPreset ?? DEFAULT_GAME_SETTINGS.weatherPreset,
        };
      }
    } catch (e) {
      console.error('Error loading game settings from localStorage:', e);
    }
    return DEFAULT_GAME_SETTINGS;
  });
  const [isControlPanelOpen, setIsControlPanelOpen] = useState<boolean>(false);

  // Data Collection Audiences & Age Group State
  const [audiences, setAudiences] = useState<DataCollectionAudience[]>(() => getStoredAudiences());
  const [activeAudienceId, setActiveAudienceId] = useState<string>(() => {
    return gameSettings.activeAudienceId || getStoredActiveAudienceId();
  });
  const [isAudienceModalOpen, setIsAudienceModalOpen] = useState<boolean>(false);

  const handleSelectActiveAudience = (id: string) => {
    setActiveAudienceId(id);
    saveStoredActiveAudienceId(id);
    handleUpdateGameSettings({ activeAudienceId: id });

    const selectedAud = findAudienceById(id, audiences);
    if (selectedAud) {
      setPlayerProfile((prev) => {
        const updated: PlayerProfile = {
          ...prev,
          age: selectedAud.ageRange,
          schoolGrade: selectedAud.schoolGradeDefault,
          dailyScreenHours: selectedAud.dailyScreenHoursDefault,
          audienceId: selectedAud.id,
          audienceName: selectedAud.name,
        };
        saveStoredPlayerProfile(updated);
        return updated;
      });
    }
  };

  const handleAddCustomAudience = (newAud: DataCollectionAudience) => {
    setAudiences((prev) => {
      const updated = [...prev, newAud];
      saveStoredAudiences(updated);
      return updated;
    });
    handleSelectActiveAudience(newAud.id);
  };

  const handleDeleteCustomAudience = (id: string) => {
    setAudiences((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      saveStoredAudiences(updated);
      return updated;
    });
    if (activeAudienceId === id) {
      handleSelectActiveAudience('audiencia_adolescentes_12_14');
    }
  };

  // Compute active skills based on shop visibility/toggle
  const activeSkills = gameSettings.hideShopButton
    ? { doubleJump: false, shield: false, magnet: false, resilience: 0, betterShoes: false, hoodie: false, bicycle: false, skate: false, patinete: false, soccerKit: false, calmingTea: false, breathingBand: false, activeVehicle: 'none' as const, activeShoes: 'basic' as const, ownedShoes: ['basic'] as ('basic' | 'runner_lite' | 'super_sprint' | 'absolute_comfort')[] }
    : playerSkills;

  const handleUpdateGameSettings = (newSettings: Partial<GameSettings>) => {
    if (newSettings.language && newSettings.language !== language) {
      setLanguage(newSettings.language);
    }
    setGameSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('entre_redes_game_settings', JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving game settings to localStorage:', e);
      }
      return updated;
    });
  };

  // Sync SFX volume when settings change
  useEffect(() => {
    setGlobalSFXVolume(gameSettings.sfxVolume ?? 100);
  }, [gameSettings.sfxVolume]);

  useEffect(() => {
    setGlobalAudioSettingsProvider(() => ({
      soundEnabled,
      settings: gameSettings,
    }));
  }, [soundEnabled, gameSettings]);

  // Listener for dynamic Outdoor Gymnastics Academy activation alert banner
  useEffect(() => {
    const handleGymActivated = () => {
      setLastChoiceFeedback({
        type: 'NAO', // Beautiful positive/green alert style
        message: '🚨 EQUIPAMENTOS DE TREINO ADIANTE! Encontre os aparelhos para baixar a ansiedade! 💪',
      });
      const timer = setTimeout(() => {
        setLastChoiceFeedback((prev) => {
          if (prev?.message.includes('EQUIPAMENTOS DE TREINO')) {
            return null;
          }
          return prev;
        });
      }, 5500);
      return () => clearTimeout(timer);
    };

    window.addEventListener('gym-activated', handleGymActivated);

    const handleParkBicycleUsed = () => {
      // Reduce anxiety level by 30% to alleviate stress
      setAnxietyLevel((prev) => Math.max(0, prev - 30));
      // Increase wellness count score
      setWellnessCount((prev) => prev + 500);
      // Play soothing wellness SFX
      playCollectWellnessSFX(soundEnabled);
      // Equip the bicycle vehicle for the player
      setPlayerSkills((prev) => ({
        ...prev,
        bicycle: true,
        activeVehicle: 'bicycle',
      }));
      // Display restorative feedback banner
      setLastChoiceFeedback({
        type: 'NAO',
        message: '🚲 BICICLETA DO BICICLETÁRIO! Passeio relaxante ao ar livre reduziu sua ansiedade em 30%! Foco e bem-estar restaurados! 🚴',
      });
      setTimeout(() => {
        setLastChoiceFeedback((prev) => {
          if (prev?.message.includes('BICICLETA DO BICICLETÁRIO')) {
            return null;
          }
          return prev;
        });
      }, 4500);
    };

    const handleLakeFishCaught = () => {
      setAnxietyLevel((prev) => Math.max(0, prev - 30));
      setWellnessCount((prev) => prev + 500);
      setLastChoiceFeedback({
        type: 'NAO',
        message: '🎣 PEIXE FISGADO NO LAGO! A tranquilidade da pescaria reduziu sua ansiedade em 30%! Foco e calma restaurados! 🐟✨',
      });
      setTimeout(() => {
        setLastChoiceFeedback((prev) => {
          if (prev?.message.includes('PEIXE FISGADO NO LAGO')) {
            return null;
          }
          return prev;
        });
      }, 4500);
    };

    const handleHorsePetted = () => {
      setAnxietyLevel((prev) => Math.max(0, prev - 30));
      setWellnessCount((prev) => prev + 500);
      setLastChoiceFeedback({
        type: 'NAO',
        message: '🐴 CARINHO NO CAVALO! O carinho nos animais no pasto reduziu sua ansiedade em 30%! Calma e afeto restaurados! 🐎✨',
      });
      setTimeout(() => {
        setLastChoiceFeedback((prev) => {
          if (prev?.message.includes('CARINHO NO CAVALO')) {
            return null;
          }
          return prev;
        });
      }, 4500);
    };

    const handlePigeonsFed = () => {
      setAnxietyLevel((prev) => Math.max(0, prev - 20));
      setWellnessCount((prev) => prev + 400);
      setLastChoiceFeedback({
        type: 'NAO',
        message: '🍞 ALIMENTANDO OS POMBOS NA PRAÇA! Alimentar os pombinhos no banco da praça aliviou sua ansiedade em 20%! Paz e serenidade restauradas! 🕊️✨',
      });
      setTimeout(() => {
        setLastChoiceFeedback((prev) => {
          if (prev?.message.includes('ALIMENTANDO OS POMBOS')) {
            return null;
          }
          return prev;
        });
      }, 4500);
    };

    const handleFriendsCircleUsed = () => {
      setAnxietyLevel((prev) => Math.max(0, prev - 25));
      setWellnessCount((prev) => prev + 450);
      setLastChoiceFeedback({
        type: 'NAO',
        message: '💬 RODA DE CONVERSA COM AMIGOS! Conversar e rir com amigos na fogueira reduziu sua ansiedade em 25%! Conexão social e acolhimento humano! 👥❤️✨',
      });
      setTimeout(() => {
        setLastChoiceFeedback((prev) => {
          if (prev?.message.includes('RODA DE CONVERSA COM AMIGOS')) {
            return null;
          }
          return prev;
        });
      }, 4500);
    };

    const handleSoccerGoalScored = (e: Event) => {
      const customDetail = (e as CustomEvent)?.detail;
      const teamName = customDetail?.team || 'Time';
      setAnxietyLevel((prev) => Math.max(0, prev - 25));
      setWellnessCount((prev) => prev + 500);
      setLastChoiceFeedback({
        type: 'NAO',
        message: `⚽ GOOOOL NO CAMPO DE FUTEBOL! Golaço do ${teamName}! Ansiedade reduzida em 25%! Vitória e energia positiva! 🏆🔥`,
      });
      setTimeout(() => {
        setLastChoiceFeedback((prev) => {
          if (prev?.message.includes('GOOOOL NO CAMPO DE FUTEBOL')) {
            return null;
          }
          return prev;
        });
      }, 4500);
    };

    const handleSoccerMatchJoined = () => {
      setAnxietyLevel((prev) => Math.max(0, prev - 5));
      setWellnessCount((prev) => prev + 100);
    };

    const handleSoccerMatchAutoStarted = () => {
      setAnxietyLevel((prev) => Math.max(0, prev - 5));
      setWellnessCount((prev) => prev + 100);
      setLastChoiceFeedback({
        type: 'NAO',
        message: '⚽ PARTIDA INICIADA COM BOLA ROLANDO! O jogo começou no Campo da Praça! O cachorro Luke aguarda na lateral do campo. Drible e chute no gol! 🥅🐕',
      });
      setTimeout(() => {
        setLastChoiceFeedback((prev) => {
          if (prev?.message.includes('PARTIDA INICIADA COM BOLA ROLANDO')) {
            return null;
          }
          return prev;
        });
      }, 4500);
    };

    const handlePetLuke = () => {
      setAnxietyLevel((prev) => Math.max(0, prev - 15));
      setWellnessCount((prev) => prev + 300);
      playDogBarkSFX(soundEnabled);
      const isCaio = selectedCharacter === 'caio';
      setLastChoiceFeedback({
        type: 'NAO',
        message: isCaio
          ? '🐕 PIPOCA (Beagle Companheiro): O alegre cãozinho Beagle de Caio abanou o rabo e reduziu a ansiedade em 15%! Foco e afeto restaurados! 🐾✨'
          : '🐕 LUKE (Pinscher Caramelo): O cãozinho de Léo abanou o rabo e reduziu a ansiedade em 15%! Foco e afeto restaurados! 🐾✨',
      });
      setTimeout(() => {
        setLastChoiceFeedback((prev) => {
          if (prev?.message.includes('LUKE') || prev?.message.includes('PIPOCA') || prev?.message.includes('LUCKY')) {
            return null;
          }
          return prev;
        });
      }, 4000);
    };

    const handleHouseEnterStart = () => {
      playHouseDoorSFX(soundEnabled);
      setLastChoiceFeedback({
        type: 'NAO',
        message: '🏡 CAMINHANDO PARA O REFÚGIO: Movimento automático harmonioso pela calçada em direção à casa... 🌿🚶‍♂️✨',
      });
      setTimeout(() => {
        setLastChoiceFeedback((prev) => {
          if (prev?.message.includes('CAMINHANDO PARA O REFÚGIO')) return null;
          return prev;
        });
      }, 4000);
    };

    const handleLakeEnterStart = () => {
      playCollectWellnessSFX(soundEnabled);
      setLastChoiceFeedback({
        type: 'NAO',
        message: '🎣 CAMINHANDO PARA O LAGO: Direcionamento orgânico automático até o deck de pesca... 🌊🐟✨',
      });
      setTimeout(() => {
        setLastChoiceFeedback((prev) => {
          if (prev?.message.includes('CAMINHANDO PARA O LAGO')) return null;
          return prev;
        });
      }, 4000);
    };

    const handleHorsesEnterStart = () => {
      playCollectWellnessSFX(soundEnabled);
      setLastChoiceFeedback({
        type: 'NAO',
        message: '🐴 CAMINHANDO PARA O PASTO: Direcionamento orgânico automático até os animais para trato e carinho... 🌾🐎✨',
      });
      setTimeout(() => {
        setLastChoiceFeedback((prev) => {
          if (prev?.message.includes('CAMINHANDO PARA O PASTO')) return null;
          return prev;
        });
      }, 4000);
    };

    const handlePigeonsEnterStart = () => {
      playCollectWellnessSFX(soundEnabled);
      setLastChoiceFeedback({
        type: 'NAO',
        message: '🕊️ CAMINHANDO PARA A PRAÇA: Direcionamento orgânico automático até o banco dos pombos... 🌿🥖✨',
      });
      setTimeout(() => {
        setLastChoiceFeedback((prev) => {
          if (prev?.message.includes('CAMINHANDO PARA A PRAÇA')) return null;
          return prev;
        });
      }, 4000);
    };

    const handleFriendsEnterStart = () => {
      playCollectWellnessSFX(soundEnabled);
      setLastChoiceFeedback({
        type: 'NAO',
        message: '🔥 CAMINHANDO PARA A RODA DE CONVERSA: Direcionamento orgânico automático até a fogueira dos amigos... 👥💬✨',
      });
      setTimeout(() => {
        setLastChoiceFeedback((prev) => {
          if (prev?.message.includes('CAMINHANDO PARA A RODA')) return null;
          return prev;
        });
      }, 4000);
    };

    const handleGymEnterStart = () => {
      playCollectWellnessSFX(soundEnabled);
      setLastChoiceFeedback({
        type: 'NAO',
        message: '💪 CAMINHANDO PARA A ACADEMIA: Direcionamento orgânico automático para o treino ao ar livre... 🏋️‍♂️✨',
      });
      setTimeout(() => {
        setLastChoiceFeedback((prev) => {
          if (prev?.message.includes('CAMINHANDO PARA A ACADEMIA')) return null;
          return prev;
        });
      }, 4000);
    };

    const handleSoccerEnterStart = () => {
      playCollectWellnessSFX(soundEnabled);
      setLastChoiceFeedback({
        type: 'NAO',
        message: '⚽ ENTRANDO NO CAMPO DE FUTEBOL: Direcionamento orgânico automático para o gramado da pelada... 🏃‍♂️🥅✨',
      });
      setTimeout(() => {
        setLastChoiceFeedback((prev) => {
          if (prev?.message.includes('ENTRANDO NO CAMPO DE FUTEBOL')) return null;
          return prev;
        });
      }, 4000);
    };

    const handleHouseRestStart = () => {
      playHouseDoorSFX(soundEnabled);
      setLastChoiceFeedback({
        type: 'NAO',
        message: '🏡 ENTRANDO NA CASA: O avatar está se deslocando pelo corredor até a cama... 🚶‍♂️✨',
      });
    };

    const handleHouseRestTick = (e: Event) => {
      const customDetail = (e as CustomEvent)?.detail;
      const remainingSecs = customDetail?.remainingSeconds ?? 10;
      const isNight = !!customDetail?.isNight;

      // Lower anxiety level progressively every second during 10s sleep (doubled if calming tea is equipped)
      const teaMultiplier = activeSkills.calmingTea ? 2 : 1;
      setAnxietyLevel((prev) => Math.max(0, prev - (isNight ? 5 : 3.5) * teaMultiplier));
      setWellnessCount((prev) => prev + (isNight ? 60 : 40) * teaMultiplier);
      
      // Play soothing sleep audio chime on every tick
      playRestingSleepSFX(soundEnabled);

      setLastChoiceFeedback({
        type: 'NAO',
        message: `🛏️ DESCANSANDO NA CAMA (${remainingSecs}s): O avatar está dormindo. Ansiedade baixando continuamente... 🌙✨`,
      });
    };

    const handleHouseRestCompleted = (e: Event) => {
      const customDetail = (e as CustomEvent)?.detail;
      const isNight = !!customDetail?.isNight;
      const cancelled = !!customDetail?.cancelled;

      if (cancelled) {
        setLastChoiceFeedback({
          type: 'SIM',
          message: '🏠 DESCANSO INTERROMPIDO! O avatar acordou e saiu da cama para continuar a exploração! 🚶‍♂️⚡',
        });
        setTimeout(() => {
          setLastChoiceFeedback((prev) => {
            if (prev?.message.includes('DESCANSO INTERROMPIDO') || prev?.message.includes('ENTRANDO NA CASA')) {
              return null;
            }
            return prev;
          });
        }, 3000);
        return;
      }

      // Final boost: lowers anxiety level completely down
      setAnxietyLevel((prev) => Math.max(0, prev - (isNight ? 40 : 25)));
      setWellnessCount((prev) => prev + (isNight ? 500 : 300));
      playRestingSleepSFX(soundEnabled);

      setLastChoiceFeedback({
        type: 'NAO',
        message: isNight
          ? '🌙 SONO REPARADOR CONCLUÍDO (10s)! O avatar descansou na cama por 10s! Ansiedade zerada e mente revigorada! 🛏️🌟'
          : '🏡 DESCANSO DE 10s CONCLUÍDO! O avatar descansou na cama da casa, recuperando todas as energias! ☕✨',
      });

      setTimeout(() => {
        setLastChoiceFeedback((prev) => {
          if (prev?.message.includes('DESCANSO') || prev?.message.includes('SONO REPARADOR') || prev?.message.includes('ENTRANDO NA CASA')) {
            return null;
          }
          return prev;
        });
      }, 5000);
    };

    const handleStreetBenchSat = (e: Event) => {
      const customEvent = e as CustomEvent<{ companionName?: string }>;
      const companion = customEvent.detail?.companionName || 'um amigo da praça';
      setAnxietyLevel((prev) => Math.max(0, prev - 7));
      setWellnessCount((prev) => prev + 150);
      setLastChoiceFeedback({
        type: 'NAO',
        message: `🪑 CONVERSA NO BANCO DA PRAÇA: Você se sentou ao lado de ${companion} e compartilharam um momento agradável! Sua ansiedade diminuiu em 7%! 💬✨`,
      });
      setTimeout(() => {
        setLastChoiceFeedback((prev) => {
          if (prev?.message.includes('CONVERSA NO BANCO DA PRAÇA')) {
            return null;
          }
          return prev;
        });
      }, 4000);
    };

    window.addEventListener('park-bicycle-used', handleParkBicycleUsed);
    window.addEventListener('lake-fish-caught', handleLakeFishCaught);
    window.addEventListener('horse-petted', handleHorsePetted);
    window.addEventListener('pigeons-fed', handlePigeonsFed);
    window.addEventListener('friends-circle-used', handleFriendsCircleUsed);
    window.addEventListener('street-bench-sat', handleStreetBenchSat);
    window.addEventListener('soccer-goal-scored', handleSoccerGoalScored);
    window.addEventListener('soccer-match-joined', handleSoccerMatchJoined);
    window.addEventListener('soccer-match-auto-started', handleSoccerMatchAutoStarted);
    window.addEventListener('pet-lucky', handlePetLuke);
    window.addEventListener('pet-luke', handlePetLuke);
    window.addEventListener('house-enter-start', handleHouseEnterStart);
    window.addEventListener('lake-enter-start', handleLakeEnterStart);
    window.addEventListener('horses-enter-start', handleHorsesEnterStart);
    window.addEventListener('pigeons-enter-start', handlePigeonsEnterStart);
    window.addEventListener('friends-enter-start', handleFriendsEnterStart);
    window.addEventListener('gym-enter-start', handleGymEnterStart);
    window.addEventListener('soccer-enter-start', handleSoccerEnterStart);
    window.addEventListener('house-rest-start', handleHouseRestStart);
    window.addEventListener('house-rest-tick', handleHouseRestTick);
    window.addEventListener('house-rest-completed', handleHouseRestCompleted);

    const handleNightFell = () => {
      setLastChoiceFeedback({
        type: 'SIM',
        message: '🌙 A NOITE CAIU NA PRAÇA! O avatar deve ir para casa (Refúgio Tranquilo à esquerda) descansar na cama. Cuidado com os monstros noturnos (aranhas e escorpiões) na rua! 🕷️Scorpion🛏️',
      });
      setTimeout(() => {
        setLastChoiceFeedback((prev) => {
          if (prev?.message.includes('A NOITE CAIU')) return null;
          return prev;
        });
      }, 6000);
    };

    const handleNightMonsterAttack = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      const monsterType = detail?.monsterType === 'SPIDER' ? 'uma Aranha Noturna' : 'um Escorpião Noturno';
      setAnxietyLevel((prev) => Math.min(100, prev + 10));
      setLastChoiceFeedback({
        type: 'SIM',
        message: `⚠️ ATAQUE NOTURNO! ${monsterType} te atacou na rua! Esquive-se, pule ou corra para a sua casa para ficar protegido! 🏠🛡️`,
      });
      setTimeout(() => {
        setLastChoiceFeedback((prev) => {
          if (prev?.message.includes('ATAQUE NOTURNO')) return null;
          return prev;
        });
      }, 4500);
    };

    window.addEventListener('night-fell', handleNightFell);
    window.addEventListener('night-monster-attack', handleNightMonsterAttack);

    return () => {
      window.removeEventListener('gym-activated', handleGymActivated);
      window.removeEventListener('park-bicycle-used', handleParkBicycleUsed);
      window.removeEventListener('lake-fish-caught', handleLakeFishCaught);
      window.removeEventListener('horse-petted', handleHorsePetted);
      window.removeEventListener('pigeons-fed', handlePigeonsFed);
      window.removeEventListener('friends-circle-used', handleFriendsCircleUsed);
      window.removeEventListener('street-bench-sat', handleStreetBenchSat);
      window.removeEventListener('soccer-goal-scored', handleSoccerGoalScored);
      window.removeEventListener('soccer-match-joined', handleSoccerMatchJoined);
      window.removeEventListener('soccer-match-auto-started', handleSoccerMatchAutoStarted);
      window.removeEventListener('pet-lucky', handlePetLuke);
      window.removeEventListener('pet-luke', handlePetLuke);
      window.removeEventListener('house-enter-start', handleHouseEnterStart);
      window.removeEventListener('lake-enter-start', handleLakeEnterStart);
      window.removeEventListener('horses-enter-start', handleHorsesEnterStart);
      window.removeEventListener('pigeons-enter-start', handlePigeonsEnterStart);
      window.removeEventListener('friends-enter-start', handleFriendsEnterStart);
      window.removeEventListener('gym-enter-start', handleGymEnterStart);
      window.removeEventListener('soccer-enter-start', handleSoccerEnterStart);
      window.removeEventListener('house-rest-start', handleHouseRestStart);
      window.removeEventListener('house-rest-tick', handleHouseRestTick);
      window.removeEventListener('house-rest-completed', handleHouseRestCompleted);
      window.removeEventListener('night-fell', handleNightFell);
      window.removeEventListener('night-monster-attack', handleNightMonsterAttack);
    };
  }, [soundEnabled]);


  // Protective Umbrella (Guarda-chuva) State and Ref
  const [umbrellaActive, setUmbrellaActive] = useState<boolean>(false);
  const umbrellaTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Beneficial items score counter
  const [wellnessCount, setWellnessCount] = useState<number>(0);

  // Gold coins collected score counter
  const [goldCoinsCount, setGoldCoinsCount] = useState<number>(0);

  // Avatar Respawn Flash state for obstacle collisions
  const [avatarRespawnFlash, setAvatarRespawnFlash] = useState<boolean>(false);

  // Gold Trophy unlocked check (Score >= 10,000, Anxiety < 50%, Questions answered >= 10)
  const hasGoldTrophy = wellnessCount >= 10000 && anxietyLevel < 50 && sessionAnswers.length >= 10;

  // Temporary Outdoor Protection Shield (Escudo Esférico 2s Ar Livre) State and Ref
  const [outdoorShieldActive, setOutdoorShieldActive] = useState<boolean>(false);
  const outdoorShieldTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Garrafa de Chá Calmante & Hidratação Consciente (5s de Serenidade Absoluta)
  const [teaSerenityActive, setTeaSerenityActive] = useState<boolean>(false);
  const teaSerenityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Treino de Respiração Diafragmática 4-7-8 (Smartband Anti-Pânico)
  const [isBreathingCycleActive, setIsBreathingCycleActive] = useState<boolean>(false);
  const lastBreathingTriggerRef = useRef<number>(0);

  const downloadStudyTxt = () => {
    const text = `===========================================================
ESTUDO CIENTÍFICO: ENTRE REDES HÁ ANSIEDADE
MÓDULO DE PESQUISA & DIAGNÓSTICO
===========================================================

Tema: Cruzamento Científico: FOMO e Sobrecarga Digital
Data: ${new Date().toLocaleDateString('pt-BR')}

-----------------------------------------------------------
1. Metodologia do Estudo de Caso
-----------------------------------------------------------
O estudo investiga o impacto psicofisiológico da dependência de dispositivos móveis através de variáveis coletadas em tempo real durante o jogo.

- Análise de Input Ativo: Coleta de respostas (SIM/NÃO) baseadas na escala clínica adaptada SAS-SMU para medir impulsividade.
- Monitoramento de Locomoção (WalkSpeed): O acúmulo de ansiedade virtual reduz dinamicamente a velocidade operacional do avatar de 16 u/s para 8 u/s.
- Taxa de Sobrevivência: Avaliação estatística da colisão contra notificações e estímulos em tempo real de acordo com o nível de ansiedade.

-----------------------------------------------------------
2. Classificação de Perfis (Índice SAS-SMU)
-----------------------------------------------------------
- Resiliente Digital: Baixo índice de dependência (< 30% afirmativas). Autocontrole saudável sobre notificações e urgência.
- Uso Moderado: Índice intermediário (30% a 59% afirmativas). Vulnerabilidade ocasional e estresse leve sob alertas constantes.
- Hiperconectado: Alto índice de dependência (>= 60% afirmativas). Alta ansiedade social (FOMO) e dependência operacional de estímulos.

-----------------------------------------------------------
Conclusão
-----------------------------------------------------------
O cruzamento científico ajuda a identificar como a sobrecarga informativa digital afeta de modo empírico a atenção sustentada, a cognição espacial e o bem-estar psicológico.

===========================================================
Entre Redes Há Ansiedade - Simulador Educacional
https://sobrecarga-digital.ai.studio
===========================================================`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'estudo_caso_fomo_sobrecarga.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // References
  const playerPosRef = useRef<number>(0); // X axis between -24 and +24
  const keysDownRef = useRef<{ left: boolean; right: boolean; jump: boolean; crouch: boolean; up: boolean; down: boolean }>({
    left: false,
    right: false,
    jump: false,
    crouch: false,
    up: false,
    down: false,
  });
  const jumpActiveRef = useRef<boolean>(false);
  const crouchActiveRef = useRef<boolean>(false);
  const questionDeckRef = useRef<SASQuestion[]>([]);
  const questionIndexRef = useRef<number>(0);
  const usedQuestionIdsRef = useRef<Set<number>>(new Set());

  // Landscape & Fullscreen Orientation Detector
  const [isLandscape, setIsLandscape] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth > window.innerHeight;
  });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const handleOrientationChange = () => {
      const isLand = window.innerWidth > window.innerHeight;
      setIsLandscape(isLand);
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
    };

    handleOrientationChange();
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);
    document.addEventListener('fullscreenchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
      document.removeEventListener('fullscreenchange', handleOrientationChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen((prev) => !prev);
    }
  };

  const prevGameStateRef = useRef<GameState>('PLAYING');

  // --- Toggle Pause ---
  const handleTogglePause = useCallback(() => {
    setGameState((current) => {
      if (current === 'PAUSED') {
        return prevGameStateRef.current === 'MODO_ZEN' ? 'MODO_ZEN' : 'PLAYING';
      } else if (current === 'PLAYING' || current === 'MODO_ZEN') {
        prevGameStateRef.current = current;
        return 'PAUSED';
      }
      return current;
    });
  }, []);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      if (!next) {
        stopSpeech();
      }
      return next;
    });
  }, []);

  // --- Start Game ---
  const handleStartGame = () => {
    playButtonClickSFX(soundEnabled);
    initAudio();
    stopSpeech();

    // Request full-screen mode upon user start
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(err => console.log('Fullscreen error:', err));
    }
    
    // Shield auto-equip at the start of a run
    if (activeSkills.shield) {
      setIsShieldActive(true);
    } else {
      setIsShieldActive(false);
    }
    
    // Set to LOADING state first
    setGameState('LOADING');

    // Simulate resource setup and transition to PLAYING after delay
    setTimeout(() => {
      // Initialize fresh shuffled deck of 100 questions and reset used questions set
      usedQuestionIdsRef.current.clear();
      const shuffledDeck = getShuffledSASQuestions();
      questionDeckRef.current = shuffledDeck;
      questionIndexRef.current = 0;

      setGameState('PLAYING');
      setGameTimer(0);
      setIsWelcome30sActive(gameSettings.enableWelcome30sTutorial !== false);
      setAnxietyLevel(0);
      setGraceTimer(null);
      setWellnessCount(0);
      setGoldCoinsCount(0);
      setMedicineSideEffectsActive(false);
      setMedicineRemainingSeconds(0);
      setShowMedicinePurchaseModal(false);
      setNotificationSpeed(1.0);
      setAnxietyMultiplier(1.0);
      setHarmfulStreak(0);
      setLastChoiceFeedback(null);
      setCurrentQuestion(null);
      setZenReason(null);
      setSessionAnswers([]);
      playerPosRef.current = 0;
      keysDownRef.current = { left: false, right: false };
      setUmbrellaActive(false);
      if (umbrellaTimeoutRef.current) {
        clearTimeout(umbrellaTimeoutRef.current);
        umbrellaTimeoutRef.current = null;
      }
      setOutdoorShieldActive(false);
      if (outdoorShieldTimeoutRef.current) {
        clearTimeout(outdoorShieldTimeoutRef.current);
        outdoorShieldTimeoutRef.current = null;
      }
      window.focus();

      // Log gameplay start
      try {
        const currentStarted = Number(localStorage.getItem('fomo_games_started_count') || '0');
        localStorage.setItem('fomo_games_started_count', String(currentStarted + 1));
      } catch (err) {
        console.error(err);
      }
    }, 1500);
  };

  const handleStart30sTutorial = () => {
    setIsWelcome30sActive(true);
    handleStartGame();
  };

  // Log game outcomes on victory/defeat and store in Clinical Case Collection
  useEffect(() => {
    if (gameState === 'VITORIA' || gameState === 'DERROTA') {
      try {
        const outcomes = JSON.parse(localStorage.getItem('fomo_games_outcomes') || '[]');
        const category = anxietyLevel >= 71 ? 'Hiperconectado' : anxietyLevel >= 31 ? 'Uso Moderado' : 'Resiliente Digital';
        
        const now = Date.now();
        // Prevent registering duplicates if they happen within 1s
        const lastOutcome = outcomes[outcomes.length - 1];
        if (!lastOutcome || now - lastOutcome.timestamp > 1000) {
          outcomes.push({
            status: gameState,
            anxiety: anxietyLevel,
            category,
            timestamp: now
          });
          localStorage.setItem('fomo_games_outcomes', JSON.stringify(outcomes));

          // Create and save complete clinical case dossier in case collection
          const yesAnswers = sessionAnswers.filter((a) => a.answer === 'SIM').length;
          const noAnswers = sessionAnswers.filter((a) => a.answer === 'NÃO').length;
          const totalQ = sessionAnswers.length;
          const affirmativePct = totalQ > 0 ? Math.round((yesAnswers / totalQ) * 100) : 0;
          const walkSpeedCalc = Math.max(4, Math.round(16 - (anxietyLevel / 100) * 12));

          const anonymousIdentifier = playerProfile.anonymousCode || playerProfile.name?.trim() || `Participante #61-${Math.floor(Math.random() * 900) + 100}`;
          const activeAud = findAudienceById(activeAudienceId, audiences);

          const newCase: CollectedCase = {
            id: `CASO-${Date.now().toString().slice(-4)}`,
            timestamp: now,
            playerName: anonymousIdentifier,
            anonymousCode: anonymousIdentifier,
            age: playerProfile.age || activeAud?.ageRange || '12 - 14 anos',
            dailyScreenHours: playerProfile.dailyScreenHours || activeAud?.dailyScreenHoursDefault || '4 a 6 horas',
            schoolGrade: playerProfile.schoolGrade || activeAud?.schoolGradeDefault || 'Turma 61',
            notes: playerProfile.notes || '',
            audienceId: playerProfile.audienceId || activeAudienceId,
            audienceName: playerProfile.audienceName || activeAud?.name,
            totalQuestionsAnswered: totalQ,
            yesAnswers,
            noAnswers,
            affirmativePercentage: affirmativePct,
            finalAnxietyScore: anxietyLevel,
            finalWalkSpeed: walkSpeedCalc,
            fomoCategory: category,
            survivalRate: gameState === 'VITORIA' ? 100 : Math.max(10, Math.round(100 - anxietyLevel)),
            wellnessScore: wellnessCount,
            goldCoins: goldCoinsCount,
            criticalResponseTime: 1.45,
            answersList: sessionAnswers,
            source: 'GAMEPLAY_REAL',
          };

          const savedCase = saveCollectedCase(newCase);
          setLastSavedCase(savedCase);
          
          // Save session to Local Storage
          const updatedHistory = saveGameSessionLocal({
            timeSurvived: gameTimer,
            maxAnxiety: anxietyLevel,
            coinsCollected: goldCoinsCount,
            result: gameState,
          });
          setHistorySessions(updatedHistory);
          
          // Update total coins
          const newTotal = addTotalCoinsLocal(goldCoinsCount);
          setGoldCoinsCount(newTotal);
        }
      } catch (err) {
        console.error("Error saving game case outcome:", err);
      }
    }
  }, [gameState, anxietyLevel, playerProfile, sessionAnswers, wellnessCount, goldCoinsCount, activeAudienceId, audiences]);

  // --- Move Player ---
  const handleMovePlayer = useCallback((direction: -1 | 1) => {
    let nextPos = playerPosRef.current + direction * 6;
    // --- Wrapping logic for infinite street continuity ---
    if (nextPos > 280) nextPos = -280;
    else if (nextPos < -280) nextPos = 280;
    playerPosRef.current = nextPos;
  }, []);

  const handleSetMovingLeft = useCallback((active: boolean) => {
    keysDownRef.current.left = active;
  }, []);

  const handleSetMovingRight = useCallback((active: boolean) => {
    keysDownRef.current.right = active;
  }, []);

  const handleSetJumping = useCallback((active: boolean) => {
    jumpActiveRef.current = active;
  }, []);

  const handleSetCrouching = useCallback((active: boolean) => {
    crouchActiveRef.current = active;
  }, []);

  // --- Continuous Movement Loop (60 FPS Smooth Navigation Across Expanded Map) ---
  useEffect(() => {
    if (gameState !== 'PLAYING' && gameState !== 'MODO_ZEN') return;

    let animId: number;
    const updateMovement = () => {
      let dir = 0;
      if (keysDownRef.current.left) dir -= 1;
      if (keysDownRef.current.right) dir += 1;

      // --- Read Bluetooth Gamepad Inputs if Enabled ---
      if (gamepadConfig.enabled) {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const gp = Array.from(gamepads).find((g) => g !== null);
        if (gp) {
          let gpDir = 0;
          const actionMap = gamepadConfig.actionMap || DEFAULT_ACTION_MAP;
          const leftBtns = actionMap.leftButtons || DEFAULT_ACTION_MAP.leftButtons;
          const rightBtns = actionMap.rightButtons || DEFAULT_ACTION_MAP.rightButtons;
          const jumpBtns = actionMap.jumpButtons || DEFAULT_ACTION_MAP.jumpButtons;
          const crouchBtns = actionMap.crouchButtons || DEFAULT_ACTION_MAP.crouchButtons;

          const isAnyPressed = (btnIndices: number[]) => btnIndices.some((idx) => gp.buttons[idx]?.pressed);
          
          // Analog Left Stick
          const axisVal = gp.axes[0] || 0;
          if (Math.abs(axisVal) > gamepadConfig.deadzone) {
            gpDir += axisVal;
          }

          // D-Pad or Mapped Left / Right buttons
          if (isAnyPressed(leftBtns) || gp.buttons[14]?.pressed) gpDir -= 1;
          if (isAnyPressed(rightBtns) || gp.buttons[15]?.pressed) gpDir += 1;

          // Action buttons / Shoulder bumpers (if enabled or buttons mode)
          if (gamepadConfig.mode === 'buttons') {
            if (gp.buttons[2]?.pressed || gp.buttons[4]?.pressed) gpDir -= 1;
            if (gp.buttons[1]?.pressed || gp.buttons[5]?.pressed) gpDir += 1;
          }

          if (gamepadConfig.invert) {
            gpDir = -gpDir;
          }

          if (gpDir !== 0) {
            dir += gpDir;
          }

          // Gamepad Jump / Crouch Detection (Custom Mapped Buttons or Analog Stick)
          const gpJump = isAnyPressed(jumpBtns) || (gp.axes[1] !== undefined && gp.axes[1] < -0.45);
          const gpCrouch = isAnyPressed(crouchBtns) || (gp.axes[1] !== undefined && gp.axes[1] > 0.45);
          
          if (gpJump) {
            jumpActiveRef.current = true;
          } else if (!keysDownRef.current.jump) {
            jumpActiveRef.current = false;
          }

          if (gpCrouch) {
            crouchActiveRef.current = true;
          } else if (!keysDownRef.current.crouch) {
            crouchActiveRef.current = false;
          }
        }
      }

      if (dir !== 0) {
        const finalDir = Math.max(-1, Math.min(1, dir));
        const stepSize = medicineSideEffectsActive ? 0.70 : 1.45;
        let nextPos = playerPosRef.current + finalDir * stepSize;
        
        // --- Wrapping logic for infinite street continuity (subtle, seamless loop) ---
        if (nextPos > 270) nextPos = -270;
        else if (nextPos < -270) nextPos = 270;
        
        playerPosRef.current = nextPos;
      }
      animId = requestAnimationFrame(updateMovement);
    };

    animId = requestAnimationFrame(updateMovement);
    return () => cancelAnimationFrame(animId);
  }, [gameState, gamepadConfig, medicineSideEffectsActive]);

  // --- Global Gamepad Menu & Game State Transition Listener ---
  const prevGamepadButtonsRef = useRef<Record<number, boolean>>({});
  const prevGamepadAxesRef = useRef<Record<number, number>>({});
  const handleAnswerSASRef = useRef<(choiceSim: boolean) => void>(() => {});
  const currentQuestionRef = useRef<SASQuestion | null>(null);
  currentQuestionRef.current = currentQuestion;

  const questionOpenTimeRef = useRef<number>(0);
  const hasReturnedToNeutralRef = useRef<boolean>(false);

  useEffect(() => {
    if (gameState === 'PAUSED_SAS') {
      questionOpenTimeRef.current = Date.now();
      hasReturnedToNeutralRef.current = false;
    }
  }, [gameState, currentQuestion]);

  useEffect(() => {
    if (!gamepadConfig.enabled) return;

    let animFrameId: number;

    const pollGamepadGlobal = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = Array.from(gamepads).find((g) => g !== null);

      if (gp) {
        const actionMap = gamepadConfig.actionMap || DEFAULT_ACTION_MAP;
        const pauseBtns = actionMap.pauseButtons || DEFAULT_ACTION_MAP.pauseButtons;
        const jumpBtns = actionMap.jumpButtons || DEFAULT_ACTION_MAP.jumpButtons;
        const simBtns = actionMap.simButtons || DEFAULT_ACTION_MAP.simButtons || [0, 2, 14, 4];
        const naoBtns = actionMap.naoButtons || DEFAULT_ACTION_MAP.naoButtons || [1, 3, 15, 5];

        const isPressed = (idx: number) => gp.buttons[idx]?.pressed || false;
        const justPressed = (idx: number) => {
          const curr = isPressed(idx);
          const prev = prevGamepadButtonsRef.current[idx] || false;
          return curr && !prev;
        };

        const isAnyJustPressed = (btnIndices: number[]) => btnIndices.some((idx) => justPressed(idx));

        const actionStartOrPause = isAnyJustPressed(pauseBtns);
        const actionConfirm = isAnyJustPressed(jumpBtns) || justPressed(0) || justPressed(9) || justPressed(16);

        // In MENU or GAMEOVER state -> Pressing mapped Jump/Start/A/Y/Home starts game!
        if (gameState === 'MENU' || gameState === 'GAMEOVER') {
          if (actionConfirm || actionStartOrPause) {
            handleStartGame();
          }
        } else if (gameState === 'PLAYING' || gameState === 'MODO_ZEN') {
          if (actionStartOrPause) {
            handleTogglePause();
          }
        } else if (gameState === 'PAUSED') {
          if (actionStartOrPause || actionConfirm) {
            handleTogglePause();
          }
        } else if (gameState === 'PAUSED_SAS' && currentQuestionRef.current) {
          const now = Date.now();
          // Debounce Lockout Window: ignore inputs for 280ms after question pops up
          if (now - questionOpenTimeRef.current >= 280) {
            const isSimButtonPressed = isAnyJustPressed(simBtns);
            const isNaoButtonPressed = isAnyJustPressed(naoBtns);

            let isSimAnalog = false;
            let isNaoAnalog = false;

            // Block Analog by default for questions unless user explicitly toggles blockAnalogInQuestions = false
            if (gamepadConfig.blockAnalogInQuestions === false) {
              const axis0 = gp.axes[0] || 0;
              const axis1 = gp.axes[1] || 0;

              // Neutral Point Requirement: stick must return to center (|axis| < 0.20) before tilt is registered
              if (Math.abs(axis0) < 0.20 && Math.abs(axis1) < 0.20) {
                hasReturnedToNeutralRef.current = true;
              }

              if (hasReturnedToNeutralRef.current) {
                const prevAxis0 = prevGamepadAxesRef.current[0] || 0;
                if (axis0 < -0.55 && prevAxis0 >= -0.55) {
                  isSimAnalog = true;
                } else if (axis0 > 0.55 && prevAxis0 <= 0.55) {
                  isNaoAnalog = true;
                }
              }
            }

            if (isSimButtonPressed || isSimAnalog) {
              handleAnswerSASRef.current(true);
            } else if (isNaoButtonPressed || isNaoAnalog) {
              handleAnswerSASRef.current(false);
            }
          }
        }

        // Track previous state of buttons & axes
        gp.buttons.forEach((b, idx) => {
          prevGamepadButtonsRef.current[idx] = b.pressed;
        });
        prevGamepadAxesRef.current[0] = gp.axes[0] || 0;
      }

      animFrameId = requestAnimationFrame(pollGamepadGlobal);
    };

    animFrameId = requestAnimationFrame(pollGamepadGlobal);
    return () => cancelAnimationFrame(animFrameId);
  }, [gameState, gamepadConfig.enabled, gamepadConfig.actionMap, handleStartGame, handleTogglePause]);

  // --- Reset Stuck Input Keys on GameState Transitions ---
  useEffect(() => {
    keysDownRef.current = { left: false, right: false, jump: false, crouch: false, up: false, down: false };
    jumpActiveRef.current = false;
    crouchActiveRef.current = false;
  }, [gameState]);

  // --- Auto Logoff on Exiting Academic Diagnostic Tab ---
  useEffect(() => {
    if (activeTab !== 'analytics') {
      try {
        sessionStorage.removeItem('fomo_diagnostico_auth');
        sessionStorage.removeItem('fomo_diagnostico_user');
      } catch (err) {}
    }
  }, [activeTab]);

  // --- Monitor Anxiety Level for 60-Second Grace Period ---
  useEffect(() => {
    if (gameState !== 'PLAYING' && gameState !== 'MODO_ZEN') {
      setGraceTimer(null);
      return;
    }
    if (anxietyLevel >= 100) {
      setGraceTimer((prev) => (prev === null ? 60 : prev));
    } else {
      setGraceTimer(null);
    }
  }, [anxietyLevel, gameState]);

  // --- Treino de Respiração Diafragmática 4-7-8 (Smartband Anti-Pânico) ---
  // "Auto-Regulação de Emergência": Se a ansiedade atingir a zona crítica (> 75%), dispara respiração profunda:
  // o tempo desacelera levemente por 2s e reduz 20% da ansiedade instantaneamente.
  useEffect(() => {
    if (activeSkills.breathingBand && anxietyLevel >= 75 && (gameState === 'PLAYING' || gameState === 'MODO_ZEN')) {
      const now = Date.now();
      if (now - lastBreathingTriggerRef.current > 20000) {
        lastBreathingTriggerRef.current = now;
        playBreathingCycleSFX(soundEnabled);
        setIsBreathingCycleActive(true);
        setAnxietyLevel((prev) => Math.max(0, prev - 20));
        setNotificationSpeed((prev) => Math.max(0.4, prev * 0.5));
        setLastChoiceFeedback({
          type: 'NAO',
          message: '🫁 AUTO-REGULAÇÃO DE EMERGÊNCIA (4-7-8)! Nervo vago estimulado: -20% de ansiedade e tempo desacelerado por 2s! 🧘‍♂️✨',
        });
        setTimeout(() => {
          setIsBreathingCycleActive(false);
          setNotificationSpeed((prev) => Math.min(2.5, prev * 2.0));
        }, 2000);
        setTimeout(() => {
          setLastChoiceFeedback((prev) => (prev?.message.includes('AUTO-REGULAÇÃO DE EMERGÊNCIA') ? null : prev));
        }, 4000);
      }
    }
  }, [anxietyLevel, activeSkills.breathingBand, gameState, soundEnabled]);

  // --- Keyboard Control Handler with Auto-Focus ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Pause with 'p', 'P' or 'Escape' during active game states
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (gameState === 'PLAYING' || gameState === 'MODO_ZEN' || gameState === 'PAUSED') {
          e.preventDefault();
          handleTogglePause();
          return;
        }
      }

      if (gameState === 'PLAYING' || gameState === 'MODO_ZEN') {
        if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
          keysDownRef.current.left = true;
        } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
          keysDownRef.current.right = true;
        } else if (e.key === ' ' || e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
          keysDownRef.current.jump = true;
          keysDownRef.current.up = true;
          handleSetJumping(true);
        } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
          keysDownRef.current.crouch = true;
          keysDownRef.current.down = true;
          handleSetCrouching(true);
        } else if ((e.key === 'k' || e.key === 'K') && (selectedCharacter === 'leo' || selectedCharacter === 'caio')) {
          window.dispatchEvent(new CustomEvent('pet-lucky'));
        }
      }

      if (gameState === 'PAUSED_SAS' && currentQuestion) {
        const key = e.key;
        const simKeys = ['s', 'S', 'a', 'A', 'ArrowLeft', 'Enter', '1', ' ', 'Spacebar'];
        const naoKeys = ['n', 'N', 'd', 'D', 'ArrowRight', 'Escape', 'Esc', 'Backspace', '2'];

        if (simKeys.includes(key)) {
          e.preventDefault();
          handleAnswerSAS(true);
        } else if (naoKeys.includes(key)) {
          e.preventDefault();
          handleAnswerSAS(false);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        keysDownRef.current.left = false;
      } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        keysDownRef.current.right = false;
      } else if (e.key === ' ' || e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
        keysDownRef.current.jump = false;
        keysDownRef.current.up = false;
        handleSetJumping(false);
      } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
        keysDownRef.current.crouch = false;
        keysDownRef.current.down = false;
        handleSetCrouching(false);
      }
    };

    const handleBlur = () => {
      keysDownRef.current.left = false;
      keysDownRef.current.right = false;
      keysDownRef.current.jump = false;
      keysDownRef.current.crouch = false;
      keysDownRef.current.up = false;
      keysDownRef.current.down = false;
      handleSetJumping(false);
      handleSetCrouching(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [gameState, currentQuestion, handleTogglePause]);

  // --- Item Collision Processing ---
  const handleItemCollect = useCallback((type: FallingItem['type']) => {
    let isWellness = false;
    let triggerMsg = '';

    // Obstacle Collision Processing (Buracos, PequenaPared, Cone, Cavalete, Cilindro)
    const isObstacle = type === 'Buraco' || type === 'PequenaPared' || type === 'Cone' || type === 'Cavalete' || type === 'Cilindro';
    if (isObstacle) {
      if (gameSettings.invincibleTrainingMode) {
        return;
      }
      
      if (isShieldActive) {
        setIsShieldActive(false);
        playCollectWellnessSFX(soundEnabled); // Or a shield break sound
        setLastChoiceFeedback({
          type: 'SIM',
          message: '🛡️ ESCUDO DIGITAL ATIVADO! Dano evitado.',
        });
        setTimeout(() => setLastChoiceFeedback(null), 2000);
        return; // Skip anxiety penalty
      }

      // Bola de Futebol / Kit Esportivo Coletivo:
      // Transforma a colisão com certas barreiras em um passe esportivo com efeito sonoro comemorativo, reduzindo a sobrecarga atencional.
      if (activeSkills.soccerKit && (type === 'PequenaPared' || type === 'Cavalete' || type === 'Cilindro' || type === 'Cone')) {
        playSoccerKickSFX(soundEnabled, 0.9);
        playSoccerGoalSFX(soundEnabled, 0.85);
        setAnxietyLevel((prevVal) => Math.max(0, prevVal - 10)); // Reduz sobrecarga atencional (-10% ansiedade)
        setWellnessCount((prev) => prev + 250); // Bônus de bem-estar esportivo
        setLastChoiceFeedback({
          type: 'NAO',
          message: '⚽ PASSE ESPORTIVO COLETIVO! A barreira virou um passe em equipe! Sobrecarga atencional reduzida em 10%! 🏃‍♂️🥅✨',
        });
        setTimeout(() => {
          setLastChoiceFeedback(null);
        }, 3000);
        return; // Converte barreira em passe comemorativo sem tomar dano
      }
      
      playObstacleHitSFX(soundEnabled);
      
      setAnxietyLevel((prevVal) => {
        let penalty = 10;
        if (activeSkills.resilience === 1) penalty = 7;
        if (activeSkills.resilience === 2) penalty = 5;
        const nextVal = Math.max(0, Math.min(100, prevVal + penalty));
        return nextVal;
      });
      setAvatarRespawnFlash(true);
      setTimeout(() => {
        setAvatarRespawnFlash(false);
      }, 1500);

      const obstacleNames = {
        Buraco: 'Buraco na Pista',
        PequenaPared: 'Muro / Barreira',
        Cone: 'Cone de Trânsito',
        Cavalete: 'Cavalete de Obra',
        Cilindro: 'Cilindro de Segurança',
      };
      setLastChoiceFeedback({
        type: 'SIM',
        message: `⚠️ Colisão com ${obstacleNames[type] || 'Obstáculo'}! Respawn no mesmo ponto + Piscar!`,
      });
      setTimeout(() => {
        setLastChoiceFeedback(null);
      }, 2000);
      return;
    }

    // Medicine / Remedio collision trigger
    if (type === 'Remedio') {
      playCollectWellnessSFX(soundEnabled);
      setShowMedicinePurchaseModal(true);
      return;
    }

    // Golden Coin Collection
    if (type === 'MoedaOuro') {
      playCoinCollectSFX(soundEnabled);
      setGoldCoinsCount((prev) => prev + 1);
      setWellnessCount((prev) => prev + 100);
      setLastChoiceFeedback({
        type: 'NAO',
        message: `🪙 +1 Moeda de Ouro! (+100 Pontos)`,
      });
      setTimeout(() => {
        setLastChoiceFeedback(null);
      }, 1500);
      return;
    }

    // Check if protected by Umbrella, Outdoor Shield, or Tea Serenity
    const isHarmful = type === 'CardNotificacao' || type === 'CardNotifPendente' || type === 'CardFeed' ||
                      type === 'Feed' || type === 'Like' || type === 'Wifi' || type === 'Smartphone' || type === 'Geometric' ||
                      type === 'WhatsApp' || type === 'YouTube' || type === 'Facebook' || type === 'TikTok';

    if (isHarmful && (teaSerenityActive || outdoorShieldActive || umbrellaActive || gameSettings.invincibleTrainingMode)) {
      playCollectWellnessSFX(soundEnabled);
      const blockedMsg = teaSerenityActive
        ? `🍵 SERENIDADE ABSOLUTA ATIVA! Estresse tóxico neutralizado por infusão de Camomila & Mel!`
        : gameSettings.invincibleTrainingMode
        ? `🛡️ Modo Treino Invencível! Dano Bloqueado!`
        : `🛡️ Escudo de Proteção Ativo! Dano Bloqueado!`;
      setLastChoiceFeedback({
        type: 'NAO',
        message: blockedMsg,
      });
      setTimeout(() => {
        setLastChoiceFeedback(null);
      }, 1500);
      return;
    }

    if (type === 'WhatsApp') {
      playHarmfulHitSFX(soundEnabled);
      setAnxietyLevel((prevVal) => {
        let penalty = 3;
        if (activeSkills.resilience === 1) penalty = 2;
        if (activeSkills.resilience === 2) penalty = 1;
        const nextVal = Math.max(0, Math.min(100, prevVal + penalty));
        return nextVal;
      });
      setLastChoiceFeedback({
        type: 'SIM',
        message: `💬 WhatsApp • Ansiedade +3%`,
      });
      setTimeout(() => {
        setLastChoiceFeedback(null);
      }, 2000);
      return;
    }

    if (type === 'TikTok') {
      playHarmfulHitSFX(soundEnabled);
      setAnxietyLevel((prevVal) => {
        let penalty = 3;
        if (activeSkills.resilience === 1) penalty = 2;
        if (activeSkills.resilience === 2) penalty = 1;
        const nextVal = Math.max(0, Math.min(100, prevVal + penalty));
        return nextVal;
      });
      setLastChoiceFeedback({
        type: 'SIM',
        message: `💥 TikTok • Ansiedade +3%`,
      });
      setTimeout(() => {
        setLastChoiceFeedback(null);
      }, 2000);
      return;
    }

    if (type === 'CardNotificacao' || type === 'CardNotifPendente' || type === 'CardFeed') {
      playHarmfulHitSFX(soundEnabled);
      const cardDelta = 6;
      setAnxietyLevel((prevVal) => {
        let penalty = cardDelta;
        if (activeSkills.resilience === 1) penalty = Math.max(1, cardDelta - 2);
        if (activeSkills.resilience === 2) penalty = Math.max(1, cardDelta - 4);
        const nextVal = Math.max(0, Math.min(100, prevVal + penalty));
        return nextVal;
      });
      const labels = {
        CardNotificacao: 'Alerta Rápido',
        CardNotifPendente: 'Notificação Pendente',
        CardFeed: 'Novo Feed',
      };
      const label = labels[type] || 'Notificação';
      setLastChoiceFeedback({
        type: 'SIM',
        message: `💥 ${label} • Ansiedade +${cardDelta}%`,
      });
      setTimeout(() => {
        setLastChoiceFeedback(null);
      }, 2000);
      return;
    }

    if (type === 'Feed' || type === 'Like' || type === 'Wifi' || type === 'Smartphone' || type === 'Geometric' || type === 'YouTube' || type === 'Facebook') {
      playHarmfulHitSFX(soundEnabled);
      setHarmfulStreak((prevStreak) => {
        const nextStreak = prevStreak + 1;
        const multiplier = Number(Math.pow(1.2, nextStreak - 1).toFixed(1));
        setAnxietyMultiplier(multiplier);

        const baseDelta = 4;
        const actualDelta = Math.round(baseDelta * multiplier);

        setAnxietyLevel((prevVal) => {
          let penalty = actualDelta;
          if (activeSkills.resilience === 1) penalty = Math.max(1, actualDelta - 2);
          if (activeSkills.resilience === 2) penalty = Math.max(1, actualDelta - 4);
          const nextVal = Math.max(0, Math.min(100, prevVal + penalty));
          return nextVal;
        });

        return nextStreak;
      });
    } else {
      // Wellness Items
      isWellness = true;
      setHarmfulStreak(0);
      setAnxietyMultiplier(1.0);

      // --- Progressive Difficulty Scaling After Diagnostic Minimum (10+ Questions) ---
      let protectionMultiplier = 1.0;
      if (sessionAnswers.length >= 10) {
        const extraQuestions = sessionAnswers.length - 10;
        // Starts at 85% protection on question 10 and decreases by 3% per additional question down to 50% floor
        protectionMultiplier = Math.max(0.50, 0.85 - extraQuestions * 0.03);
      }

      let baseDelta = -2;
      let itemLabel = '';

      if (type === 'Bola de Futebol') {
        baseDelta = -8;
        itemLabel = '⚽ Bola de Futebol';
        playCollectWellnessSFX(soundEnabled);
      } else if (type === 'Encontro Presencial') {
        baseDelta = -12;
        itemLabel = '🤝 Encontro Presencial';
        playCollectWellnessSFX(soundEnabled);
      } else if (type === 'Exercício Físico') {
        baseDelta = -6;
        itemLabel = '🏃 Exercício Físico';
        playCollectWellnessSFX(soundEnabled);
      } else if (type === 'Atividade ao Ar Livre') {
        baseDelta = -9;
        itemLabel = '🌳 Atividade ao Ar Livre';
        playCollectWellnessSFX(soundEnabled);

        // Activate temporary 2-second protective shield sphere
        setOutdoorShieldActive(true);
        if (outdoorShieldTimeoutRef.current) {
          clearTimeout(outdoorShieldTimeoutRef.current);
        }
        outdoorShieldTimeoutRef.current = setTimeout(() => {
          setOutdoorShieldActive(false);
          outdoorShieldTimeoutRef.current = null;
        }, 2000);
      } else if (type === 'Desconexão') {
        baseDelta = -14;
        itemLabel = '🔌 Desconexão';
        playCollectWellnessSFX(soundEnabled);

        // Activate protective umbrella for 3 seconds
        setUmbrellaActive(true);
        if (umbrellaTimeoutRef.current) {
          clearTimeout(umbrellaTimeoutRef.current);
        }
        umbrellaTimeoutRef.current = setTimeout(() => {
          setUmbrellaActive(false);
          umbrellaTimeoutRef.current = null;
        }, 3000);
      } else if (type === 'Coffee') {
        baseDelta = -10;
        itemLabel = '☕ Pausa Ativa (Café)';
        playCollectWellnessSFX(soundEnabled);
      } else if (type === 'Book') {
        baseDelta = -3;
        itemLabel = '📚 Leitura & Foco';
        playCollectWellnessSFX(soundEnabled);
      } else if (type === 'Hamburguer') {
        baseDelta = -2;
        itemLabel = '🍔 Lanche Consciente';
        playCollectWellnessSFX(soundEnabled);
      } else if (type === 'Violão') {
        baseDelta = -11;
        itemLabel = '🎸 Música & Violão Acústico';
        playGuitarChordSFX(soundEnabled);
      } else if (type === 'Cachorro') {
        if (selectedCharacter === 'leo') {
          baseDelta = -15;
          itemLabel = '🐕 Luke, o Pinscher Caramelo (Apoio Incondicional de Léo)';
        } else {
          baseDelta = -4;
          itemLabel = '🐶 Cachorrinho Amigo';
        }
        playDogBarkSFX(soundEnabled);
      }

      // Garrafa de Chá Calmante & Hidratação Consciente (Camomila & Mel):
      // Colidir com itens de descanso ou hidratação gera cura dobrada e concede 5s de serenidade absoluta.
      const isRestOrWater = type === 'Coffee' || type === 'Desconexão' || type === 'Atividade ao Ar Livre' || type === 'Book' || type === 'Encontro Presencial';
      let teaTag = '';
      if (activeSkills.calmingTea && isRestOrWater) {
        baseDelta = baseDelta * 2;
        playCalmingTeaSFX(soundEnabled);
        setTeaSerenityActive(true);
        if (teaSerenityTimeoutRef.current) {
          clearTimeout(teaSerenityTimeoutRef.current);
        }
        teaSerenityTimeoutRef.current = setTimeout(() => {
          setTeaSerenityActive(false);
          teaSerenityTimeoutRef.current = null;
        }, 5000);
        teaTag = ' + 🍵 Cura Dobrada & Serenidade 5s!';
      }

      // Calculate effective delta with protection multiplier applied
      setWellnessCount((prev) => prev + Math.abs(baseDelta) * 100);
      const delta = Math.min(-1, Math.round(baseDelta * protectionMultiplier));

      const protPct = Math.round(protectionMultiplier * 100);
      const diffTag = sessionAnswers.length >= 10 ? ` • ⚡ Proteção ${protPct}%` : '';
      const shieldTag = type === 'Atividade ao Ar Livre' ? ' + Escudo Proteção 2s!' : type === 'Desconexão' ? ' + Guarda-chuva Protetor!' : '';
      triggerMsg = `${itemLabel} (${delta}% Ansiedade${diffTag}${shieldTag}${teaTag})`;

      setAnxietyLevel((prev) => {
        const nextVal = Math.max(0, prev + delta);

        if (nextVal === 0 && prev > 0) {
          setLastChoiceFeedback({
            type: 'NAO',
            message: `🧘 Equilíbrio Pleno • Ansiedade zerada (0%)!`,
          });
          setTimeout(() => {
            setLastChoiceFeedback(null);
          }, 3500);
        } else {
          setLastChoiceFeedback({
            type: 'NAO',
            message: `🌱 ${triggerMsg} • Ansiedade reduzida para ${nextVal}%`,
          });
          setTimeout(() => {
            setLastChoiceFeedback(null);
          }, 2500);
        }

        return nextVal;
      });
    }

    setNotificationSpeed((prev) => {
      if (type === 'Geometric') return prev * 1.2;
      if (
        type === 'Exercício Físico' ||
        type === 'Atividade ao Ar Livre' ||
        type === 'Desconexão' ||
        type === 'Book' ||
        type === 'Bola de Futebol' ||
        type === 'Encontro Presencial' ||
        type === 'Hamburguer'
      ) {
        return Math.max(0.5, prev - 0.2);
      }
      return prev;
    });
  }, [soundEnabled, sessionAnswers.length]);

  // --- Game Loop Timer (1s ascending ticks - Free Open-Ended Play Time) ---
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const interval = setInterval(() => {
      // Decrement the grace period timer if active
      setGraceTimer((prevGrace) => {
        if (prevGrace === null) return null;
        if (prevGrace <= 1) {
          if (sessionAnswers.length < 10) {
            // O jogo não pode terminar antes que o mínimo de 10 perguntas tenha sido respondido.
            // Segura o timer no 1 para evitar a derrota prematura
            return 1;
          }
          setGameState('DERROTA');
          playDefeatSFX(soundEnabled);
          return null;
        }
        return prevGrace - 1;
      });

      // Update medicine duration countdown (1 minute = 60 seconds)
      setMedicineRemainingSeconds((prev) => {
        if (prev <= 0) return 0;
        const next = prev - 1;
        if (next === 0) {
          setMedicineSideEffectsActive(false);
          setLastChoiceFeedback({
            type: 'NAO',
            message: '⚡ Efeito da medicação finalizado (1 min)! Velocidade e agilidade 100% restauradas!',
          });
          setTimeout(() => {
            setLastChoiceFeedback(null);
          }, 4000);
        }
        return next;
      });

      setGameTimer((prevTimer) => {
        const nextTimer = prevTimer + 1;

        // --- LUKE'S PASSIVE LOYALTY AURA (LÉO ONLY) ---
        // Every 8 seconds while playing as Léo, Luke provides passive comfort lowering anxiety by 2%
        if (selectedCharacter === 'leo' && nextTimer > 0 && nextTimer % 8 === 0) {
          setAnxietyLevel((prev) => Math.max(0, prev - 2));
        }

        // Check SAS Question Trigger according to configured question interval in gameSettings
        // When welcome tutorial is running, questions await tutorial completion to allow full focus on guidance
        const intervalSecs = Math.max(5, gameSettings.questionInterval || 15);
        const shouldCheckQuestion = !isWelcome30sActive && nextTimer > 0 && nextTimer % intervalSecs === 0;

        if (shouldCheckQuestion) {
          // Find next unasked question from the 100 questions pool
          while (
            questionIndexRef.current < questionDeckRef.current.length &&
            usedQuestionIdsRef.current.has(questionDeckRef.current[questionIndexRef.current].id ?? questionIndexRef.current)
          ) {
            questionIndexRef.current++;
          }

          // If questions remain in deck, pick the next unique question
          if (questionIndexRef.current < questionDeckRef.current.length) {
            const q = questionDeckRef.current[questionIndexRef.current];
            usedQuestionIdsRef.current.add(q.id ?? questionIndexRef.current);
            questionIndexRef.current += 1;

            setGameState('PAUSED_SAS');
            setCurrentQuestion({ ...q, timeTrigger: nextTimer });
            playSASQuestionChime(soundEnabled);
            if (gameSettings.enableQuestionTTS) {
              const localizedQText = getLocalizedQuestion(q.id ?? 0, q.question);
              speakQuestion(localizedQText, soundEnabled, {
                voiceURI: gameSettings.ttsVoiceURI,
                pitch: gameSettings.ttsPitch,
                rate: gameSettings.ttsRate,
              }, language);
            }
          }
        }

        return nextTimer;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, soundEnabled, gameSettings, isWelcome30sActive, selectedCharacter, language, getLocalizedQuestion]);

  // --- SAS Question Answer Handler (Pure Psychometric Evaluation - No In-Game Metric Alteration) ---
  // --- Psychometric Evaluation System (SAS-SMU) ---
  const handleAnswerSAS = (choiceSim: boolean) => {
    if (!currentQuestion) return;

    // Capture critical data
    const q = currentQuestion;
    const choiceStr = choiceSim ? 'SIM' : 'NÃO';

    // Visual State - Immediate and Instant Close (zero latency)
    setGameState('PLAYING');
    setCurrentQuestion(null);
    setTimeout(() => {
      stopSpeech();
    }, 0);

    // Deferred Processing
    setTimeout(() => {
      const record = {
        question: q.question,
        category: q.category || 'GERAL',
        answer: choiceStr as 'SIM' | 'NÃO',
        timeTrigger: q.timeTrigger,
      };

      setSessionAnswers((prev) => [...prev, record]);

      try {
        const savedRaw = localStorage.getItem('fomo_games_evaluations');
        const saved = savedRaw ? JSON.parse(savedRaw) : [];
        saved.push({
          ...record,
          timestamp: Date.now(),
        });
        localStorage.setItem('fomo_games_evaluations', JSON.stringify(saved));
      } catch (err) {
        console.error("Evaluation Persistence Error:", err);
      }
    }, 0);

    const totalAnswers = sessionAnswers.length + 1;

    if (totalAnswers === 10) {
      setLastChoiceFeedback({
        type: 'SIM',
        message: `⚡ Diagnóstico Mínimo Atingido (10 Pgs)! Dificuldade aumentada: Proteção dos itens reduzida para 80%!`,
      });
      setTimeout(() => setLastChoiceFeedback(null), 4500);
    } else {
      setLastChoiceFeedback({
        type: choiceSim ? 'SIM' : 'NAO',
        message: `📋 Resposta "${choiceStr}" registrada para a Avaliação Psicometria SAS`,
      });
      setTimeout(() => setLastChoiceFeedback(null), 3000);
    }
  };
  handleAnswerSASRef.current = handleAnswerSAS;

  // --- Finish Evaluation (Available from Question 10+ onwards) ---
  const handleFinishEvaluation = () => {
    if (sessionAnswers.length < 10) return;

    // 1. Immediately transit to victory state visually
    setGameState('VITORIA');
    setCurrentQuestion(null);
    playVictorySFX(soundEnabled);
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });

    // 2. Stop speech synthesis asynchronously to ensure smooth screen transition
    setTimeout(() => {
      stopSpeech();
    }, 10);
  };

  return (
    <div className="min-h-screen bg-[#050508] bg-sleek-radial text-white flex flex-col font-sans selection:bg-cyan-500 selection:text-white relative overflow-x-hidden">
      {/* Background Sleek Grid Pattern */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-sleek-grid" />

      {/* Header Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        gameState={gameState}
        onStartGame={handleStartGame}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        isGamepadModalOpen={isGamepadModalOpen}
        setIsGamepadModalOpen={setIsGamepadModalOpen}
        gamepadConfig={gamepadConfig}
        showQrModal={showQrModal}
        setShowQrModal={setShowQrModal}
        onOpenControlPanel={() => setIsControlPanelOpen(true)}
        onOpenWindowsInstall={() => setIsWindowsInstallOpen(true)}
        onOpenCameraAccessibility={() => setIsCameraModalOpen(true)}
        isCameraAccessibilityActive={cameraTrackingConfig.enabled}
        isDemoMode={isDemoMode}
        onToggleDemoMode={() => setIsDemoMode((prev) => !prev)}
      />

      {/* Character Selection Modal */}
      <CharacterSelectionModal
        isOpen={isCharacterModalOpen}
        selectedCharacter={selectedCharacter}
        onSelectCharacter={(id) => setSelectedCharacter(id)}
        onConfirm={() => {
          setIsCharacterModalOpen(false);
          if (gameState === 'MENU') {
            handleStartGame();
          }
        }}
        onClose={() => setIsCharacterModalOpen(false)}
        soundEnabled={soundEnabled}
      />

      {/* Virtual Avatar Demo Simulation Overlay */}
      <VirtualAvatarDemoOverlay
        isDemoMode={isDemoMode}
        demoProfile={demoProfile}
        gameState={gameState}
        currentQuestion={currentQuestion}
        onAnswerSAS={handleAnswerSAS}
        onStartGame={handleStartGame}
        onRestart={handleStartGame}
        onMovePlayer={handleMovePlayer}
        onSetMovingLeft={handleSetMovingLeft}
        onSetMovingRight={handleSetMovingRight}
        onSetJumping={handleSetJumping}
        onSetCrouching={handleSetCrouching}
        onToggleDemoMode={() => setIsDemoMode(false)}
        onChangeDemoProfile={(p) => setDemoProfile(p)}
      />

      {/* Voice Tutorial Interactive Assistant (HQ Speech Balloon & Drag & Drop) */}
      <VoiceTutorialAssistant
        showVoiceAssistant={gameSettings.showVoiceAssistant !== false}
        gameSettings={gameSettings}
        gameState={gameState}
        onDisableAssistant={() => handleUpdateGameSettings({ showVoiceAssistant: false })}
        onStartGame={handleStartGame}
        onStart30sTutorial={handleStart30sTutorial}
        onDemonstrateStep={(stepNumber) => {
          if (stepNumber === 1) {
            speakQuestion("Demonstração do Passo 1: O simulador Sobrecarga Digital educa sobre o uso excessivo de telas. Continue acompanhando!", soundEnabled, gameSettings);
          } else if (stepNumber === 2) {
            // Demonstrate movement by enabling demo mode for 6 seconds
            setIsDemoMode(true);
            setTimeout(() => setIsDemoMode(false), 7000);
          } else if (stepNumber === 3) {
            // Demonstrate item collection sound
            playCoinCollectSFX(soundEnabled);
          } else if (stepNumber === 4) {
            // Demonstrate SAS question popup
            setCurrentQuestion(activeSASQuestions[0] || generateRandomSASQuestions()[0]);
          } else if (stepNumber === 5) {
            // Demonstrate Control Panel
            setIsControlPanelOpen(true);
          } else if (stepNumber === 6) {
            // Start Game
            handleStartGame();
          }
        }}
      />

      {/* Main Content Area */}
      <main className={`flex-1 w-full mx-auto flex flex-col gap-6 relative z-10 ${
        (isLandscape || isFullscreen) && activeTab === 'simulator'
          ? 'p-0 m-0 max-w-none'
          : activeTab === 'simulator'
          ? 'max-w-none p-0 md:p-6 lg:p-8'
          : 'max-w-7xl p-4 sm:p-6 md:p-8'
      }`}>
        {/* --- TAB 1: 3D INTERACTIVE SIMULATOR --- */}
        {activeTab === 'simulator' && (
          <div className="flex flex-col gap-4">
            {/* 3D Canvas Stage (Occupies 100% full screen when in landscape / horizontal) */}
            <div 
              onClick={() => window.focus()}
              tabIndex={0}
              className={`relative overflow-hidden outline-none transition-all duration-300 ${
                isLandscape || isFullscreen
                  ? 'fixed inset-0 z-50 w-screen h-screen m-0 p-0 rounded-none border-none bg-black'
                  : 'w-full h-[580px] sm:h-[680px] rounded-none md:rounded-[40px] shadow-2xl border-y md:border border-white/15 bg-black/40 backdrop-blur-2xl'
              }`}
            >
              <ThreeCanvas
                gameState={gameState}
                gameTimer={gameTimer}
                anxietyLevel={anxietyLevel}
                playerSkills={activeSkills}
                notificationSpeed={notificationSpeed}
                onItemCollect={handleItemCollect}
                playerPosRef={playerPosRef}
                keysDownRef={keysDownRef}
                umbrellaActive={umbrellaActive}
                outdoorShieldActive={outdoorShieldActive}
                jumpActiveRef={jumpActiveRef}
                crouchActiveRef={crouchActiveRef}
                avatarRespawnFlash={avatarRespawnFlash}
                gameSettings={gameSettings}
                medicineSideEffectsActive={medicineSideEffectsActive}
                showMedicinePurchaseModal={showMedicinePurchaseModal}
                graceTimer={graceTimer}
                goldCoinsCount={goldCoinsCount}
                selectedCharacter={selectedCharacter}
              />

              {/* HUD Overlay */}
              <GameHUD
                gameState={gameState}
                gameTimer={gameTimer}
                anxietyLevel={anxietyLevel}
                notificationSpeed={notificationSpeed}
                anxietyMultiplier={anxietyMultiplier}
                lastChoiceFeedback={lastChoiceFeedback}
                currentQuestion={currentQuestion}
                sessionAnswers={sessionAnswers}
                zenTriggerReason={zenReason}
                isLandscape={isLandscape}
                isFullscreen={isFullscreen}
                onToggleFullscreen={toggleFullscreen}
                onTogglePause={handleTogglePause}
                onToggleSound={handleToggleSound}
                onAnswerSAS={handleAnswerSAS}
                onFinishEvaluation={handleFinishEvaluation}
                onRestart={handleStartGame}
                onMovePlayer={handleMovePlayer}
                onSetMovingLeft={handleSetMovingLeft}
                onSetMovingRight={handleSetMovingRight}
                onSetJumping={handleSetJumping}
                onSetCrouching={handleSetCrouching}
                soundEnabled={soundEnabled}
                wellnessCount={wellnessCount}
                goldCoinsCount={goldCoinsCount}
                medicineSideEffectsActive={medicineSideEffectsActive}
                medicineRemainingSeconds={medicineRemainingSeconds}
                hasGoldTrophy={hasGoldTrophy}
                gameSettings={gameSettings}
                graceTimer={graceTimer}
                onOpenControlPanel={() => setIsControlPanelOpen(true)}
                onOpenShop={gameSettings.hideShopButton ? undefined : () => setShowShopModal(true)}
                onOpenHistory={() => setShowHistoryModal(true)}
                playerProfile={playerProfile}
                onOpenPlayerProfileModal={() => setIsPlayerProfileModalOpen(true)}
                onViewInAnalytics={() => setActiveTab('analytics')}
                lastSavedCase={lastSavedCase}
                gamepadConfig={gamepadConfig}
                onlineUsersCount={onlineCount}
                onUpdateSettings={handleUpdateGameSettings}
                selectedCharacter={selectedCharacter}
              />

              {/* 30-Second Narrated Welcome Tutorial (Wellness Items vs Invasive Notifications) */}
              <WelcomeTutorial30s
                gameTimer={gameTimer}
                gameState={gameState}
                soundEnabled={soundEnabled}
                gameSettings={gameSettings}
                isOpen={isWelcome30sActive && (gameState === 'PLAYING' || gameState === 'PAUSED_SAS' || gameState === 'MODO_ZEN')}
                onClose={() => setIsWelcome30sActive(false)}
                onToggleSound={handleToggleSound}
              />

              {/* Serenidade Absoluta HUD indicator (Garrafa de Chá Calmante) */}
              {teaSerenityActive && (gameState === 'PLAYING' || gameState === 'MODO_ZEN') && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-gradient-to-r from-amber-500/90 to-yellow-500/90 text-amber-950 font-black px-4 py-1.5 rounded-full shadow-lg border border-amber-300 flex items-center gap-2 animate-pulse pointer-events-none text-xs sm:text-sm">
                  <span>🍵</span> SERENIDADE ABSOLUTA ATIVA • Imunidade a Danos (Camomila & Mel)
                </div>
              )}

              {/* Treino de Respiração 4-7-8 Pulse Overlay */}
              {isBreathingCycleActive && (
                <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none bg-teal-950/30 backdrop-blur-[2px] animate-in fade-in duration-200">
                  <div className="bg-slate-900/95 border-2 border-teal-400 p-5 sm:p-6 rounded-3xl text-center shadow-2xl max-w-sm mx-4 transform scale-105 transition-all">
                    <div className="w-16 h-16 rounded-full bg-teal-500/20 text-teal-300 border-2 border-teal-400 flex items-center justify-center mx-auto mb-3 animate-ping">
                      <HeartPulse size={32} className="text-teal-400" />
                    </div>
                    <h4 className="text-teal-300 font-black text-lg uppercase tracking-wider">Ciclo 4-7-8 Ativado</h4>
                    <p className="text-slate-300 text-xs mt-1">Estimulação do nervo vago e auto-regulação parassimpática.</p>
                    <div className="mt-3 text-emerald-400 font-bold text-xs sm:text-sm bg-emerald-500/10 py-1 px-3 rounded-full border border-emerald-500/20 inline-block">
                      -20% Ansiedade • Tempo Desacelerado
                    </div>
                  </div>
                </div>
              )}

              {/* Large Centered Start Button when in MENU state */}
              {gameState === 'MENU' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-start sm:justify-center bg-black/75 backdrop-blur-md pointer-events-auto p-4 sm:p-6 text-center overflow-y-auto">
                  <div className="max-w-xl w-full flex flex-col items-center justify-center gap-4 sm:gap-5 my-auto py-4">
                    
                    {/* Top Element: Instagram Follow Card (Original Size) */}
                    <a
                      href="https://www.instagram.com/entreredeshaansiedade?igsh=eXR5NXZyNGQ1bzc0"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group max-w-sm w-full bg-slate-900/80 hover:bg-slate-900/95 border border-slate-700/60 hover:border-pink-500/50 rounded-3xl p-5 sm:p-6 flex flex-col items-center text-center transition-all duration-300 shadow-2xl cursor-pointer hover:scale-[1.02] backdrop-blur-xl shrink-0"
                    >
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-white/20 group-hover:border-pink-400/80 shadow-lg shrink-0 mb-3 bg-white flex items-center justify-center p-1">
                        <img
                          src={instagramLogo}
                          alt="Entre redes há ansiedade?"
                          className="w-full h-full object-contain rounded-full"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      
                      <span className="text-xs font-black tracking-[0.18em] text-pink-400 uppercase flex items-center justify-center gap-1.5 mb-1">
                        <Instagram className="w-4 h-4 text-pink-400" /> SIGA NOSSO TRABALHO
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-pink-300 transition-colors leading-tight">
                        @entreredeshaansiedade
                      </h3>
                      <p className="text-xs text-slate-400 mt-1.5 max-w-[260px] leading-relaxed">
                        Acompanhe discussões e mapeamento comportamental sobre saúde digital!
                      </p>
                    </a>

                    {/* Main Start Game Button */}
                    <button
                      id="demo-btn-start"
                      onClick={() => setIsCharacterModalOpen(true)}
                      onPointerDown={() => playButtonClickSFX(soundEnabled)}
                      className="group relative inline-flex items-center justify-center gap-3 py-4 px-10 sm:py-5 sm:px-14 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-white font-black text-xl sm:text-2xl uppercase tracking-wider shadow-[0_0_40px_rgba(6,182,212,0.6)] hover:shadow-[0_0_55px_rgba(6,182,212,0.85)] transition-all duration-150 active:scale-95 cursor-pointer overflow-hidden select-none touch-manipulation shrink-0"
                    >
                      <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current text-white drop-shadow-md relative z-10 group-active:scale-90 transition-transform" />
                      <span className="drop-shadow-md relative z-10">INICIAR JOGO</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Loading Screen Overlay */}
              {gameState === 'LOADING' && (
                <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-2xl p-6 text-center animate-fade-in">
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center">
                    <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-t-cyan-400 rounded-full animate-spin shadow-[0_0_20px_rgba(34,211,238,0.4)]" />
                    <Sparkles className="w-10 h-10 sm:w-14 sm:h-14 text-cyan-300 animate-pulse" />
                  </div>
                  
                  <div className="mt-10 flex flex-col items-center gap-4">
                    <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 tracking-[0.15em] uppercase">
                      Carregando
                    </h2>
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" />
                    </div>
                  </div>

                  <p className="mt-8 text-slate-400 text-sm sm:text-base max-w-md font-medium leading-relaxed italic">
                    "Preparando o ambiente de simulação psicométrica e calibrando os sensores de ansiedade digital..."
                  </p>
                </div>
              )}
            </div>

            {/* Info Card and Impact Metrics */}
            {gameState !== 'VITORIA' && gameState !== 'DERROTA' && (
              <div className="max-w-7xl w-full mx-auto px-4 md:px-0">
                <div className="bg-white/5 p-6 sm:p-8 rounded-[32px] border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col gap-6">
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/30 shrink-0 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                        <ShieldAlert className="w-7 h-7 sm:w-8 sm:h-8" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
                          O que é este jogo?
                        </h2>
                        <p className="text-cyan-400 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] mt-0.5">Simulação de Sobrecarga Digital & FOMO</p>
                      </div>
                    </div>


                  </div>

                  {/* Body Content */}
                  <div className="animate-fade-in">
                    <div className="space-y-1 text-sm sm:text-base text-slate-300 leading-relaxed max-w-4xl">
                      <p>
                        Este simulador foi criado a partir do projeto de pesquisa <strong>“Entre Redes: Há Ansiedade?”</strong> (EEEM Felipe Camarão - Turma 61), idealizado pelos estudantes <strong>Augusto Joaquim Dullius</strong>, <strong>Caio Castilho Cercato</strong> e <strong>Leonardo Lottermann Dahmer</strong>, sob orientação da <strong>Profª Me. Lisandra Jacobi Kölling Junges</strong>, coorientação de <strong>Cristofer Stelzer da Silva</strong> e orientação técnica de desenvolvimento de <strong>Christian Dahmer</strong>.
                      </p>
                      <p className="text-xs sm:text-sm text-slate-400">
                        A ferramenta mapeia os impactos da <strong>hiperconexão, FOMO, uso de telas noturnas e comparação social</strong> na saúde mental de crianças e adolescentes (9 a 16 anos), relacionando o nível de ansiedade (0-100%) à modulação de velocidade do avatar (WalkSpeed) e à coleta de hábitos protetores.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- TAB 2: CODE & ARCHITECTURE VIEWER --- */}
        {activeTab === 'code' && <LuauCodeViewer />}

        {/* --- TAB 3: ROBLOX STUDIO SETUP GUIDE --- */}
        {activeTab === 'guide' && <RobloxSetupGuide />}

        {/* --- TAB 4: FOMO SCIENTIFIC ANALYTICS --- */}
        {activeTab === 'analytics' && (
          <FomoAnalytics
            audiences={audiences}
            activeAudienceId={activeAudienceId}
            onOpenAudienceManager={() => setIsAudienceModalOpen(true)}
          />
        )}

        {/* --- TAB 5: DOCUMENTATION --- */}
        {activeTab === 'informacoes' && <GameDocumentation />}
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#050508]/90 border-t border-white/10 py-6 px-4 text-center text-xs text-white/50 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 font-medium text-white/70">
            <ShieldCheck className="w-4 h-4 text-cyan-400" /> Projeto Educacional Entre redes há ansiedade
          </span>
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/30">
            Saúde e Bem-estar Digital
          </span>
        </div>
      </footer>

      {/* Player Information / Clinical Registration Modal */}
      <PlayerInfoModal
        isOpen={isPlayerProfileModalOpen}
        onClose={() => {
          setIsPlayerProfileModalOpen(false);
          setIsBeforeStartModal(false);
        }}
        onSave={(profile) => {
          setPlayerProfile(profile);
          saveStoredPlayerProfile(profile);
          setIsPlayerProfileModalOpen(false);
          if (isBeforeStartModal) {
            setIsBeforeStartModal(false);
            handleStartGame();
          }
        }}
        initialProfile={playerProfile}
        audiences={audiences}
        activeAudienceId={activeAudienceId}
        onChangeActiveAudience={handleSelectActiveAudience}
        onOpenAudienceManager={() => setIsAudienceModalOpen(true)}
        soundEnabled={soundEnabled}
      />

      {/* Game Control Panel & Parameters Modal */}
      <GameControlPanel
        isOpen={isControlPanelOpen}
        onClose={() => setIsControlPanelOpen(false)}
        settings={gameSettings}
        onUpdateSettings={handleUpdateGameSettings}
        onResetSettings={() => handleUpdateGameSettings(DEFAULT_GAME_SETTINGS)}
        onOpenGamepadModal={() => setIsGamepadModalOpen(true)}
        gamepadConfig={gamepadConfig}
        isDemoMode={isDemoMode}
        onToggleDemoMode={() => setIsDemoMode((prev) => !prev)}
        demoProfile={demoProfile}
        onChangeDemoProfile={setDemoProfile}
        onStart30sTutorial={handleStart30sTutorial}
        audiences={audiences}
        activeAudienceId={activeAudienceId}
        onSelectActiveAudience={handleSelectActiveAudience}
        onOpenAudienceManager={() => setIsAudienceModalOpen(true)}
        onOpenTechTour={() => setIsTechTourOpen(true)}
        onOpenWindowsInstall={() => setIsWindowsInstallOpen(true)}
        onOpenCameraAccessibility={() => setIsCameraModalOpen(true)}
        isCameraAccessibilityActive={cameraTrackingConfig.enabled}
      />

      {/* Target Audiences Manager Modal (Faixas Etárias & Coortes) */}
      <AudienceManagerModal
        isOpen={isAudienceModalOpen}
        onClose={() => setIsAudienceModalOpen(false)}
        audiences={audiences}
        activeAudienceId={activeAudienceId}
        onSelectActiveAudience={handleSelectActiveAudience}
        onAddCustomAudience={handleAddCustomAudience}
        onDeleteCustomAudience={handleDeleteCustomAudience}
        collectedCases={getStoredCollectedCases()}
        soundEnabled={soundEnabled}
      />

      {/* Bluetooth Gamepad Config Modal */}
      <GamepadConfigModal
        isOpen={isGamepadModalOpen}
        onClose={() => setIsGamepadModalOpen(false)}
        config={gamepadConfig}
        onUpdateConfig={handleUpdateGamepadConfig}
      />

      {/* Medicine Purchase Modal */}
      {showMedicinePurchaseModal && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex justify-center items-center p-4">
          <div className="bg-[#0c0f1d] border-2 border-[#10b981]/50 rounded-[32px] p-6 sm:p-8 max-w-lg w-full relative shadow-[0_0_45px_rgba(16,185,129,0.3)] space-y-6">
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-[#10b981]/15 flex items-center justify-center border border-[#10b981]/40 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <span className="text-3xl">💊</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-[#10b981] tracking-[0.3em] uppercase block">
                  Tratamento de Emergência
                </span>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                  Adquirir Medicamento?
                </h3>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 sm:p-5 space-y-4 text-sm leading-relaxed text-slate-300">
              <p>
                Você esbarrou em uma <strong className="text-white">Caixa de Remédio</strong>. Embora os medicamentos sejam fundamentais sob supervisão médica, o uso emergencial pode acarretar fortes reações no organismo.
              </p>
              
              <div className="space-y-3 border-t border-b border-white/5 py-3.5">
                <div className="flex items-start gap-2 text-emerald-400 font-bold">
                  <span className="text-base shrink-0">✨ Benefício:</span>
                  <div className="text-xs sm:text-sm font-normal text-slate-300">
                    <strong className="text-emerald-300 font-bold">Zera instantaneamente sua Ansiedade</strong> de volta para <strong className="text-emerald-400 font-bold">0%</strong>, aliviando o estresse acumulado.
                  </div>
                </div>
                
                <div className="flex items-start gap-2 text-red-400 font-bold">
                  <span className="text-base shrink-0">⚠️ Efeitos Colaterais:</span>
                  <div className="text-xs sm:text-sm font-normal text-slate-300 space-y-1">
                    <span>
                      Causará forte <strong className="text-red-300 font-bold">sonolência, cansaço e moleza física</strong>.
                    </span>
                    <span className="block text-[11px] bg-red-500/10 border border-red-500/20 text-red-300 p-2 rounded-lg font-bold">
                      🎮 Efeito Temporário (1 Minuto): Sua velocidade de desvio lateral será cortada pela METADE (50% mais lenta) durante 1 minuto de recuperação.
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center bg-white/5 rounded-xl px-4 py-2 text-xs font-mono">
                <span className="text-slate-400">Preço da medicação:</span>
                <span className="text-amber-400 font-bold">🪙 10 Moedas</span>
              </div>

              <div className="flex justify-between items-center bg-white/5 rounded-xl px-4 py-2.5 text-xs font-mono">
                <span className="text-slate-400">Seu saldo atual:</span>
                <span className={`font-bold flex items-center gap-1.5 ${goldCoinsCount >= 10 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  🪙 {goldCoinsCount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                disabled={goldCoinsCount < 10}
                onClick={() => {
                  setGoldCoinsCount((prev) => Math.max(0, prev - 10));
                  setAnxietyLevel(0);
                  setMedicineSideEffectsActive(true);
                  setMedicineRemainingSeconds(60);
                  setShowMedicinePurchaseModal(false);
                  
                  playCollectWellnessSFX(soundEnabled);
                  setLastChoiceFeedback({
                    type: 'NAO',
                    message: `💊 Medicamento Adquirido! Ansiedade zerada! (Lentidão ativa por 1 minuto)`,
                  });
                  setTimeout(() => {
                    setLastChoiceFeedback(null);
                  }, 4000);
                }}
                className={`flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer text-center ${
                  goldCoinsCount >= 10
                    ? 'bg-[#10b981] hover:bg-[#0f9f6e] text-slate-950 hover:shadow-[0_0_20px_rgba(16,185,129,0.45)]'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                {goldCoinsCount >= 10 ? 'Comprar por 10 🪙' : 'Moedas Insuficientes'}
              </button>

              <button
                onClick={() => {
                  setShowMedicinePurchaseModal(false);
                  setLastChoiceFeedback({
                    type: 'SIM',
                    message: `🚫 Compra cancelada. Você decidiu continuar sem medicação.`,
                  });
                  setTimeout(() => {
                    setLastChoiceFeedback(null);
                  }, 3000);
                }}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all cursor-pointer text-center"
              >
                Recusar / Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Pop-up Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-2xl flex justify-center items-center overflow-y-auto p-4 py-8">
          <div className="bg-[#090d16] border-2 border-cyan-400/40 rounded-[36px] p-6 sm:p-8 max-w-md w-full relative shadow-[0_0_50px_rgba(34,211,238,0.25)] space-y-4 my-auto">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <span className="text-[10px] font-black text-cyan-300 tracking-[0.3em] uppercase block">
                Acesso Rápido Mobile / Compartilhamento
              </span>
              <h3 className="text-xl font-bold text-white uppercase">
                Entre Redes Há Ansiedade
              </h3>
            </div>

            <QRCodeCard url="https://sobrecarga-digital.ai.studio" title="Acesso Rápido ao Simulador" />
          </div>
        </div>
      )}

      {/* Skill Shop Modal */}
      <SkillShopModal
        isOpen={showShopModal}
        onClose={() => setShowShopModal(false)}
        playerSkills={playerSkills}
        onSkillsUpdate={setPlayerSkills}
        coins={goldCoinsCount}
        onCoinsUpdate={setGoldCoinsCount}
      />

      {/* History & Progression Modal */}
      <HistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        sessions={historySessions}
      />

      {/* Interactive Voice Assistant Robot */}
      <VoiceTutorialAssistant
        showVoiceAssistant={!gameSettings.hideVoiceAssistant}
        gameSettings={gameSettings}
        gameState={gameState}
        onStartGame={handleStartGame}
        onDemonstrateStep={(stepNumber) => {
          if (stepNumber === 2) {
            handleSetJumping(true);
            setTimeout(() => handleSetJumping(false), 500);
          } else if (stepNumber === 3) {
            playCollectWellnessSFX(soundEnabled);
          } else if (stepNumber === 4) {
            setGameState('PAUSED_SAS');
            setCurrentQuestion({
              id: 999,
              question: 'Você costuma checar o celular assim que acorda para não perder nada?',
              category: 'ALTO',
              timeTrigger: 10,
            });
          }
        }}
        onStart30sTutorial={handleStart30sTutorial}
        onOpenTechTour={() => setIsTechTourOpen(true)}
      />

      {/* Tech Dev Tour Modal: Ludic interactive technology laboratory */}
      <TechDevTourModal
        isOpen={isTechTourOpen}
        onClose={() => setIsTechTourOpen(false)}
        gameSettings={gameSettings}
        onUpdateSettings={handleUpdateGameSettings}
        gameState={gameState}
        onStartGame={handleStartGame}
        onTestSlowMotion={(active) => {
          handleUpdateGameSettings({ baseGameSpeed: active ? 0.25 : 1.0 });
        }}
        onTestJump={() => {
          handleSetJumping(true);
          setTimeout(() => handleSetJumping(false), 600);
        }}
        onTestCrouch={() => {
          handleSetCrouching(true);
          setTimeout(() => handleSetCrouching(false), 800);
        }}
        onTriggerSampleQuestion={() => {
          setGameState('PAUSED_SAS');
          setCurrentQuestion({
            id: 1,
            question: 'Você sente que passa mais tempo no smartphone do que pretendia?',
            category: 'MEDIO',
            timeTrigger: 15,
          });
          speakQuestion(
            'Você sente que passa mais tempo no smartphone do que pretendia?',
            soundEnabled,
            {
              voiceURI: gameSettings.ttsVoiceURI,
              pitch: gameSettings.ttsPitch,
              rate: gameSettings.ttsRate,
            },
            language
          );
        }}
        onSetAnxietyLevel={(lvl) => {
          setAnxietyLevel(lvl);
        }}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
        }}
        soundEnabled={soundEnabled}
        onlineUsersCount={onlineCount}
      />

      {/* Windows OS App Installation Modal */}
      <WindowsInstallModal
        isOpen={isWindowsInstallOpen}
        onClose={() => setIsWindowsInstallOpen(false)}
        soundEnabled={soundEnabled}
      />

      {/* Floating Camera Face Motion HUD Overlay */}
      {cameraTrackingConfig.enabled && (
        <CameraFaceHUDOverlay
          videoRef={cameraVideoRef}
          canvasRef={cameraCanvasRef}
          motionState={cameraMotionState}
          onCalibrate={calibrateCameraCenter}
          onToggleEnabled={() => handleUpdateCameraConfig({ enabled: false })}
          soundEnabled={soundEnabled}
          invertX={cameraTrackingConfig.invertX}
        />
      )}

      {/* Camera Face & Gestures Accessibility Modal */}
      <CameraAccessibilityModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        config={cameraTrackingConfig}
        onUpdateConfig={handleUpdateCameraConfig}
        motionState={cameraMotionState}
        onCalibrate={calibrateCameraCenter}
        soundEnabled={soundEnabled}
        mediaStream={cameraMediaStream}
      />
    </div>
  );
}
