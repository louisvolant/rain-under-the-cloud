// src/components/LanguageSwitcher.tsx
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useLocale } from 'next-intl';

const LanguageSwitcher = () => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [language, setLanguage] = useState<string>(locale);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || locale;
    setLanguage(savedLanguage);
    document.documentElement.lang = savedLanguage;
  }, [locale]);

  const changeLanguage = (lng: string) => {
    setLanguage(lng);
    localStorage.setItem('language', lng);
    document.documentElement.lang = lng;
    const newPath = pathname.replace(/^\/[^\/]+/, `/${lng}`);
    router.push(newPath);
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => changeLanguage('en')}
        className={`p-1 rounded ${language === 'en' ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
        title="English"
      >
        <Image src="/flags/en.png" alt="English" width={24} height={24} />
      </button>
      <button
        onClick={() => changeLanguage('fr')}
        className={`p-1 rounded ${language === 'fr' ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
        title="Français"
      >
        <Image src="/flags/fr.png" alt="Français" width={24} height={24} />
      </button>
      <button
        onClick={() => changeLanguage('es')}
        className={`p-1 rounded ${language === 'es' ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
        title="Español"
      >
        <Image src="/flags/es.png" alt="Español" width={24} height={24} />
      </button>
    </div>
  );
};

export default LanguageSwitcher;