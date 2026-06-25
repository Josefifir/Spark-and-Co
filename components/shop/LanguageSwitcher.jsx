'use client';

import { useState } from 'react';
import { useLocale } from '@/lib/i18n/LocaleContext';
import { getLocales } from '@/lib/i18n/LocaleContext';

// align="right" (default) opens to the right of the button — correct in desktop header
// align="left" opens to the left — correct in the mobile drawer (buttons are near left edge)
export default function LanguageSwitcher({ align = "right" }) {
  const { locale, setLocale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const locales = getLocales();

  const currentLocale = locales.find(l => l.code === locale) || locales[0];

  const handleLocaleChange = (newLocale) => {
    setLocale(newLocale);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-paper-dim hover:text-paper border border-hairline hover:border-steel rounded-sm transition-colors"
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        <span className="text-base">{currentLocale.flag}</span>
        <span className="text-xs font-mono-tech">{currentLocale.code.toUpperCase()}</span>
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Dropdown */}
          <div className={`absolute ${align === "left" ? "left-0" : "right-0"} mt-2 w-40 bg-panel border border-hairline rounded-sm shadow-lg z-20`}>
            <div className="py-1">
              {locales.map((loc) => (
                <button
                  key={loc.code}
                  onClick={() => handleLocaleChange(loc.code)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-graphite transition-colors flex items-center justify-between ${
                    locale === loc.code ? 'bg-graphite text-flame' : 'text-paper-dim'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">{loc.flag}</span>
                    <span>{loc.name}</span>
                  </span>
                  {locale === loc.code && (
                    <svg className="w-3.5 h-3.5 text-flame" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Made with Bob
