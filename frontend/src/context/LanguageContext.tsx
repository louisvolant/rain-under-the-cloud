// src/context/LanguageContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';

type Language = 'en' | 'fr' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
  tWeather: (description: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

type TranslationModule = { default: Record<string, string> };

const loadTranslations = async (lang: Language): Promise<Record<string, string>> => {
  try {
    const mod = await import(`@/locales/${lang}.json`) as TranslationModule;
    return mod.default;
  } catch (error) {
    console.error(`Failed to load translations for ${lang}:`, error);
    const defaultMod = await import(`@/locales/en.json`) as TranslationModule;
    return defaultMod.default;
  }
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
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

  // Wrap setLanguage in useCallback to avoid infinite calls
  const setLanguage = useCallback(async (lang: Language) => {
    if (language === lang) return; // 'language' is a dependency here
    setIsLoadingTranslations(true);
    setLanguageState(lang); // 'setLanguageState' is a stable setter
    localStorage.setItem('language', lang);
    const translations = await loadTranslations(lang); // 'loadTranslations' is defined outside, so it's stable
    setCurrentTranslations(translations); // 'setCurrentTranslations' is a stable setter
    setIsLoadingTranslations(false); // 'setIsLoadingTranslations' is a stable setter
  }, [language, setLanguageState, setCurrentTranslations, setIsLoadingTranslations]); // Dependencies for setLanguage

  const t = useCallback((key: string, replacements?: Record<string, string | number>): string => {
    let translatedText = currentTranslations[key] || key;

    if (replacements) {
      for (const placeholder in replacements) {
        if (Object.prototype.hasOwnProperty.call(replacements, placeholder)) {
          translatedText = translatedText.replace(`{${placeholder}}`, String(replacements[placeholder]));
        }
      }
    }
    return translatedText;
  }, [currentTranslations]);

  const tWeather = useCallback((description: string): string => {
    // 1. Generate the translation key from the description
    const key = `weather_${description.toLowerCase().replace(/ /g, '_')}`;
    // 2. Try to get the translation using the 't' function
    // This will return 'key' itself if no translation is found
    const translatedValue = t(key);

    // 3. Check if the 't' function returned the key itself (meaning no translation was found for this key)
    // If it's the key, return the original description; otherwise, return the translated value.
    if (translatedValue === key) {
      // Fallback to original OpenWeatherMap description
      return description;
    } else {
      // Return the found translation
      return translatedValue;
    }
  }, [t]);

  const contextValue = useMemo(() => ({
    language,
    setLanguage, // Now stable
    t,
    tWeather,
  }), [language, setLanguage, t, tWeather]); // setLanguage is now a stable dependency

  if (isLoadingTranslations) {
    return null;
  }

  return (
    <LanguageContext.Provider value={contextValue}>
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