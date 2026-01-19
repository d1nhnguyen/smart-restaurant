import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './locales/en/translation.json';
import translationVN from './locales/vn/translation.json';

// Translation resources
const resources = {
    en: {
        translation: translationEN
    },
    vn: {
        translation: translationVN
    }
};

i18n
    .use(LanguageDetector) // Detect user language
    .use(initReactI18next) // Pass i18n to react-i18next
    .init({
        resources,
        fallbackLng: 'vn', // Default language
        lng: 'vn', // Initial language
        debug: false,

        interpolation: {
            escapeValue: false // React already escapes
        },

        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage']
        }
    });

export default i18n;
