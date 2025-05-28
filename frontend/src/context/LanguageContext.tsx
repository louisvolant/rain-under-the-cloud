//src/context/LanguageContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'fr' | 'es'; // Define your supported languages

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string; // Translation function with optional replacements
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Define a type for your translation modules
type TranslationModule = { default: Record<string, string> };

const loadTranslations = async (lang: Language): Promise<Record<string, string>> => {
  try {
    const mod = await import(`@/locales/${lang}.json`) as TranslationModule;
    return mod.default;
  } catch (error) {
    console.error(`Failed to load translations for ${lang}:`, error);
    // Fallback to English if loading fails
    const defaultMod = await import(`@/locales/en.json`) as TranslationModule;
    return defaultMod.default;
  }
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en'); // Default to English
  const [currentTranslations, setCurrentTranslations] = useState<Record<string, string>>({});
  const [isLoadingTranslations, setIsLoadingTranslations] = useState(true);

  useEffect(() => {
    const initializeLanguage = async () => {
      const savedLanguage = localStorage.getItem('language') as Language;
      const initialLang: Language = (savedLanguage && ['en', 'fr', 'es'].includes(savedLanguage)) ? savedLanguage : 'en';
      setLanguageState(initialLang);
      const translations = await loadTranslations(initialLang);
      setCurrentTranslations(translations);
      setIsLoadingTranslations(false);
    };
    initializeLanguage();
  }, []);

  const setLanguage = async (lang: Language) => {
    if (language === lang) return; // Avoid re-loading if already set
    setIsLoadingTranslations(true);
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    const translations = await loadTranslations(lang);
    setCurrentTranslations(translations);
    setIsLoadingTranslations(false);
  };

  const t = (key: string, replacements?: Record<string, string | number>): string => {
    let translatedText = currentTranslations[key] || key; // Fallback to key if not found

    if (replacements) {
      for (const placeholder in replacements) {
        if (Object.prototype.hasOwnProperty.call(replacements, placeholder)) {
          translatedText = translatedText.replace(`{${placeholder}}`, String(replacements[placeholder]));
        }
      }
    }
    return translatedText;
  };

  if (isLoadingTranslations) {
    // Optionally render a loading spinner or null while translations are loading
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}