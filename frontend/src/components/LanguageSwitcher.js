import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    const currentLang = i18n.language;

    return (
        <div className="language-switcher">
            <button
                className={`lang-btn ${currentLang === 'vn' ? 'active' : ''}`}
                onClick={() => changeLanguage('vn')}
            >
                VN
            </button>
            <button
                className={`lang-btn ${currentLang === 'en' ? 'active' : ''}`}
                onClick={() => changeLanguage('en')}
            >
                EN
            </button>
        </div>
    );
};

export default LanguageSwitcher;
