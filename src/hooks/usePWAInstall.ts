import { useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isWindows, setIsWindows] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect standalone mode (already installed or running in native PWA app window)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: window-controls-overlay)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsInstalled(isStandalone);

    // Detect OS & Platform
    if (typeof window !== 'undefined' && window.navigator) {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const platform = window.navigator.platform?.toLowerCase() || '';

      const isWin = /win32|win64|windows|wsl/.test(userAgent) || /win32|win64/.test(platform);
      setIsWindows(isWin);

      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIOS(isIOSDevice);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.warn('Install prompt error:', err);
    }
    return false;
  };

  // Generate downloadable Windows Batch Installer script (.BAT) that creates a desktop shortcut
  const downloadWindowsInstaller = () => {
    const currentUrl = window.location.href;
    const appTitle = "Sobrecarga Digital - Jogo 3D";
    const batContent = `@echo off
:: Windows Desktop Shortcut Creator for Sobrecarga Digital
title Instalação do Jogo Sobrecarga Digital - Windows
color 0A
cls
echo =======================================================
echo    INSTALADOR DO JOGO SOBRECARGA DIGITAL PARA WINDOWS
echo =======================================================
echo.
echo Criando atalho do jogo na sua Area de Trabalho e Menu Iniciar...
echo.

set "URL=${currentUrl}"
set "SHORTCUT_NAME=${appTitle}"
set "DESKTOP_PATH=%USERPROFILE%\\Desktop\\%SHORTCUT_NAME%.url"

echo [InternetShortcut] > "%DESKTOP_PATH%"
echo URL=%URL% >> "%DESKTOP_PATH%"
echo IconIndex=0 >> "%DESKTOP_PATH%"

echo.
echo =======================================================
echo   SUCESSO! O jogo foi instalado na sua Area de Trabalho.
echo   Nome do Atalho: %SHORTCUT_NAME%
echo =======================================================
echo.
echo Abrindo o jogo agora...
start "" "%DESKTOP_PATH%"
timeout /t 3 >nul
exit
`;

    const blob = new Blob([batContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Instalar_Sobrecarga_Digital_Windows.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isWindows,
    isIOS,
    promptInstall,
    downloadWindowsInstaller,
  };
}
