import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppLanguage } from '../types';
import { SUPPORTED_LANGUAGES, TRANSLATIONS, TRANSLATED_SAS_QUESTIONS, LanguageInfo } from './translations';

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: string, defaultVal?: string) => string;
  getLocalizedQuestion: (id: number, fallbackText: string) => string;
  currentLanguageInfo: LanguageInfo;
  languages: LanguageInfo[];
}

const LANGUAGE_STORAGE_KEY = 'fomo_app_language';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode; initialLanguage?: AppLanguage }> = ({
  children,
  initialLanguage,
}) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    if (initialLanguage) return initialLanguage;
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as AppLanguage | null;
      if (saved && (saved === 'pt' || saved === 'es' || saved === 'en' || saved === 'de')) {
        return saved;
      }
    } catch (e) {}
    return 'pt';
  });

  const setLanguage = (newLang: AppLanguage) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
    } catch (e) {}
    // Trigger window event so standalone canvas or components can react if needed
    window.dispatchEvent(new CustomEvent('app-language-changed', { detail: { language: newLang } }));
  };

  const t = (key: string, defaultVal?: string): string => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.pt;
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    // Fallback to Portuguese dictionary if key is missing in target language
    if (TRANSLATIONS.pt && TRANSLATIONS.pt[key]) {
      return TRANSLATIONS.pt[key];
    }
    return defaultVal || key;
  };

  const getLocalizedQuestion = (id: number, fallbackText: string): string => {
    if (language === 'pt') return fallbackText;
    const questionsInLang = TRANSLATED_SAS_QUESTIONS[language];
    if (questionsInLang && questionsInLang[id]) {
      return questionsInLang[id];
    }
    return fallbackText;
  };

  const currentLanguageInfo =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    document.documentElement.lang = currentLanguageInfo.locale;
  }, [currentLanguageInfo]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        getLocalizedQuestion,
        currentLanguageInfo,
        languages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Graceful fallback if called outside provider
    const fallbackInfo = SUPPORTED_LANGUAGES[0];
    return {
      language: 'pt',
      setLanguage: () => {},
      t: (key: string, defaultVal?: string) => TRANSLATIONS.pt[key] || defaultVal || key,
      getLocalizedQuestion: (_id: number, fallbackText: string) => fallbackText,
      currentLanguageInfo: fallbackInfo,
      languages: SUPPORTED_LANGUAGES,
    };
  }
  return context;
};
