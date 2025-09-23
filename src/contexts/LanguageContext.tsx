import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '@/types';

// Import translation files
import enTranslations from '@/locales/en.json';
import arTranslations from '@/locales/ar.json';
import frTranslations from '@/locales/fr.json';

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
  languages: Language[];
}

const languages: Language[] = [
  { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr' },
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
];

const defaultLanguage = languages[0]; // Now defaults to French

// Translation data
const translations: Record<string, any> = {
  en: enTranslations,
  ar: arTranslations,
  fr: frTranslations,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(defaultLanguage);

  useEffect(() => {
    const savedLang = localStorage.getItem('language');
    if (savedLang) {
      const lang = languages.find(l => l.code === savedLang);
      if (lang) {
        setCurrentLanguage(lang);
      }
    }
  }, []);

  useEffect(() => {
    document.documentElement.dir = currentLanguage.dir;
    document.documentElement.lang = currentLanguage.code;
    localStorage.setItem('language', currentLanguage.code);
  }, [currentLanguage]);

  const setLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
  };

  const t = (key: string): string => {
    // Split the key by dots to navigate nested objects
    const keys = key.split('.');
    let translation = translations[currentLanguage.code];
    
    // Navigate through the nested object
    for (const k of keys) {
      if (translation && typeof translation === 'object' && k in translation) {
        translation = translation[k];
      } else {
        // If translation not found, try English as fallback
        let fallbackTranslation = translations['en'];
        for (const fallbackKey of keys) {
          if (fallbackTranslation && typeof fallbackTranslation === 'object' && fallbackKey in fallbackTranslation) {
            fallbackTranslation = fallbackTranslation[fallbackKey];
          } else {
            return key; // Return the key if no translation found
          }
        }
        return fallbackTranslation || key;
      }
    }
    
    return translation || key;
  };

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    t,
    dir: currentLanguage.dir,
    languages,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
