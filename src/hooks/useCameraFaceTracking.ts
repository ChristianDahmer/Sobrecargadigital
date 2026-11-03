import { useEffect, useRef, useState, useCallback } from 'react';

export interface CameraTrackingConfig {
  enabled: boolean;
  sensitivity: 'baixa' | 'media' | 'alta'; // Sensitivity threshold
  invertX: boolean; // Mirror video X
  drawDebugCanvas: boolean;
}

export interface CameraMotionState {
  isStreaming: boolean;
  permissionDenied: boolean;
  activeDirection: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | 'CENTER';
  headX: number; // Current head X in pixels (0 to 320)
  headY: number; // Current head Y in pixels (0 to 240)
  calibratedX: number;
  calibratedY: number;
  deltaX: number; // Difference from calibrated center
  deltaY: number; // Difference from calibrated center
}

export function useCameraFaceTracking(
  config: CameraTrackingConfig,
  callbacks: {
    onMoveLeft?: () => void;
    onMoveRight?: () => void;
    onJump?: () => void;
    onCrouch?: () => void;
    onAnswerYes?: () => void;
    onAnswerNo?: () => void;
  }
) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const [motionState, setMotionState] = useState<CameraMotionState>({
    isStreaming: false,
    permissionDenied: false,
    activeDirection: 'CENTER',
    headX: 160,
    headY: 120,
    calibratedX: 160,
    calibratedY: 120,
    deltaX: 0,
    deltaY: 0,
  });

  const calibratedRef = useRef<{ x: number; y: number }>({ x: 160, y: 120 });
  const smoothPosRef = useRef<{ x: number; y: number }>({ x: 160, y: 120 });
  const animFrameRef = useRef<number | null>(null);
  const lastActionTimeRef = useRef<number>(0);

  // Calibration function: sets current head center
  const calibrateCenter = useCallback(() => {
    const currentX = smoothPosRef.current.x;
    const currentY = smoothPosRef.current.y;
    calibratedRef.current = { x: currentX, y: currentY };
    setMotionState((prev) => ({
      ...prev,
      calibratedX: Math.round(currentX),
      calibratedY: Math.round(currentY),
      deltaX: 0,
      deltaY: 0,
      activeDirection: 'CENTER',
    }));
  }, []);

  // Sensitivity Thresholds in pixels
  const getThresholds = useCallback(() => {
    switch (config.sensitivity) {
      case 'alta':
        return { x: 14, y: 12 };
      case 'baixa':
        return { x: 32, y: 26 };
      case 'media':
      default:
        return { x: 22, y: 18 };
    }
  }, [config.sensitivity]);

  // Start Camera Stream
  useEffect(() => {
    if (!config.enabled) {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
        setMediaStream(null);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject = null;
      }
      setMotionState((prev) => ({ ...prev, isStreaming: false }));
      return;
    }

    let isMounted = true;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 320 },
            height: { ideal: 240 },
            facingMode: 'user',
          },
          audio: false,
        });

        if (isMounted) {
          setMediaStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              if (videoRef.current) {
                videoRef.current.play().catch(console.warn);
                setMotionState((prev) => ({ ...prev, isStreaming: true, permissionDenied: false }));
              }
            };
          }
        }
      } catch (err) {
        console.warn('Camera access error:', err);
        if (isMounted) {
          setMotionState((prev) => ({ ...prev, isStreaming: false, permissionDenied: true }));
        }
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [config.enabled]);

  // Process Video Frame for Head Tracking
  useEffect(() => {
    if (!config.enabled || !motionState.isStreaming) return;

    const width = 320;
    const height = 240;

    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && video.readyState >= 2 && canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, width, height);
          const frame = ctx.getImageData(0, 0, width, height);
          const data = frame.data;

          // Normalized Chrominance and Luminance tracking for reliable face detection
          let totalX = 0;
          let totalY = 0;
          let matchCount = 0;

          // Sample pixels in central/upper video frame (where head/face naturally resides)
          for (let y = 16; y < height - 16; y += 3) {
            for (let x = 16; x < width - 16; x += 3) {
              const idx = (y * width + x) * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              const sum = r + g + b;

              if (sum > 50) {
                const normR = r / sum;
                const normG = g / sum;
                // Universal skin chrominance locus in normalized RGB space
                const isSkin = normR > 0.33 && normR < 0.62 && normG > 0.23 && normG < 0.42 && r > b && (r - b) > 6;
                if (isSkin) {
                  totalX += x;
                  totalY += y;
                  matchCount++;
                }
              }
            }
          }

          // Fallback: If skin matches are too low (low lighting or monochrome camera), use luminance center of mass
          if (matchCount < 35) {
            totalX = 0;
            totalY = 0;
            matchCount = 0;
            for (let y = 24; y < height - 24; y += 4) {
              for (let x = 24; x < width - 24; x += 4) {
                const idx = (y * width + x) * 4;
                const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
                if (lum > 60) {
                  const weight = lum / 255;
                  totalX += x * weight;
                  totalY += y * weight;
                  matchCount += weight;
                }
              }
            }
          }

          if (matchCount > 20) {
            let avgX = totalX / matchCount;
            const avgY = totalY / matchCount;

            if (config.invertX) {
              avgX = width - avgX;
            }

            // Smooth position with exponential moving average updating the accumulator
            const smoothX = smoothPosRef.current.x * 0.65 + avgX * 0.35;
            const smoothY = smoothPosRef.current.y * 0.65 + avgY * 0.35;
            smoothPosRef.current = { x: smoothX, y: smoothY };

            const deltaX = Math.round(smoothX - calibratedRef.current.x);
            const deltaY = Math.round(smoothY - calibratedRef.current.y);

            const thresholds = getThresholds();
            let newDir: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | 'CENTER' = 'CENTER';

            if (deltaX < -thresholds.x) {
              newDir = 'LEFT';
            } else if (deltaX > thresholds.x) {
              newDir = 'RIGHT';
            } else if (deltaY < -thresholds.y) {
              newDir = 'UP';
            } else if (deltaY > thresholds.y) {
              newDir = 'DOWN';
            }

            const now = Date.now();
            // Throttle navigation trigger actions (minimum 320ms between gestures)
            if (newDir !== 'CENTER' && now - lastActionTimeRef.current > 320) {
              lastActionTimeRef.current = now;

              if (newDir === 'LEFT') {
                callbacks.onMoveLeft?.();
                callbacks.onAnswerNo?.();
              } else if (newDir === 'RIGHT') {
                callbacks.onMoveRight?.();
                callbacks.onAnswerYes?.();
              } else if (newDir === 'UP') {
                callbacks.onJump?.();
              } else if (newDir === 'DOWN') {
                callbacks.onCrouch?.();
              }
            }

            setMotionState((prev) => ({
              ...prev,
              headX: Math.round(smoothX),
              headY: Math.round(smoothY),
              calibratedX: Math.round(calibratedRef.current.x),
              calibratedY: Math.round(calibratedRef.current.y),
              deltaX,
              deltaY,
              activeDirection: newDir,
            }));
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(processFrame);
    };

    animFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [config.enabled, config.invertX, config.sensitivity, motionState.isStreaming, callbacks, getThresholds]);

  return {
    videoRef,
    canvasRef,
    motionState,
    calibrateCenter,
    mediaStream,
  };
}
