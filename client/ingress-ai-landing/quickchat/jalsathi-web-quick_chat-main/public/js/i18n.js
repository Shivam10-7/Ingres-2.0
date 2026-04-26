// Internationalization system for JalSathi
class I18n {
  constructor() {
    this.currentLanguage = localStorage.getItem('jalsathi-language') || 'en';
    this.translations = {};
    this.init();
  }

  async init() {
    await this.loadTranslations();
    this.applyTranslations();
  }

  async loadTranslations() {
    // Load all supported languages
    const languages = ['en', 'hi', 'bn', 'te', 'mr', 'ta', 'gu', 'kn', 'or', 'pa'];

    for (const lang of languages) {
      try {
        const response = await fetch(`./js/translations/${lang}.json`);
        if (response.ok) {
          this.translations[lang] = await response.json();
        }
      } catch (error) {
        console.warn(`Failed to load translations for ${lang}:`, error);
      }
    }
  }

  getTranslation(key, language = this.currentLanguage) {
    const keys = key.split('.');
    let value = this.translations[language];

    for (const k of keys) {
      value = value?.[k];
    }

    return value || key; // Fallback to key if translation not found
  }

  setLanguage(language) {
    this.currentLanguage = language;
    localStorage.setItem('jalsathi-language', language);
    this.applyTranslations();

    // Dispatch custom event for language change
    window.dispatchEvent(new CustomEvent('languageChanged', {
      detail: { language }
    }));
  }

  applyTranslations() {
    // Update all elements with data-i18n attribute
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.getTranslation(key);

      if (element.tagName === 'INPUT' && element.placeholder) {
        element.placeholder = translation;
      } else if (element.tagName === 'OPTION') {
        element.textContent = translation;
      } else {
        element.textContent = translation;
      }
    });

    // Update page title
    const titleKey = document.querySelector('title')?.getAttribute('data-i18n');
    if (titleKey) {
      document.title = this.getTranslation(titleKey);
    }

    // Update document language
    document.documentElement.lang = this.currentLanguage;
  }

  getSupportedLanguages() {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
      { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
      { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
      { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
      { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
      { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
      { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
      { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
      { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' }
    ];
  }

  getCurrentLanguage() {
    return this.currentLanguage;
  }
}

// Create global i18n instance
window.i18n = new I18n();

// Language selector component
class LanguageSelector {
  constructor(container) {
    this.container = container;
    this.isOpen = false;
    this.init();
  }

  init() {
    this.render();
    this.attachEvents();
  }

  render() {
    const languages = window.i18n.getSupportedLanguages();
    const currentLang = languages.find(lang => lang.code === window.i18n.getCurrentLanguage());

    this.container.innerHTML = `
      <div class="language-selector">
        <button class="language-toggle" aria-label="Select language">
          <svg class="globe-icon" viewBox="0 0 24 24" width="20" height="20">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l.15-.15c.2-.2.35-.45.35-.75V14c0-.55-.45-1-1-1h-.5v-1h.75c.55 0 1-.45 1-1v-.5c0-.55-.45-1-1-1H9v1.5h.5v.5H9V12h1.5c.55 0 1 .45 1 1v.5c0 .55-.45 1-1 1H9.5v1H11zm4.5-1.5c0 .55-.45 1-1 1H13v1h1.5c.55 0 1 .45 1 1v.5c0 .55-.45 1-1 1h-1.5c-.55 0-1-.45-1-1v-1.5c0-.55.45-1 1-1H14v-1h-.5c-.55 0-1-.45-1-1v-.5c0-.55.45-1 1-1h.5v1H13.5c-.55 0-1 .45-1 1v.5c0 .55.45 1 1 1H15z"/>
          </svg>
          <span class="current-lang">${currentLang?.nativeName || 'English'}</span>
          <svg class="chevron-icon" viewBox="0 0 24 24" width="16" height="16">
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        </button>
        <div class="language-dropdown" style="display: none;">
          ${languages.map(lang => `
            <button class="language-option ${lang.code === window.i18n.getCurrentLanguage() ? 'active' : ''}"
                    data-lang="${lang.code}">
              <span class="lang-native">${lang.nativeName}</span>
              <span class="lang-name">${lang.name}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    this.toggleBtn = this.container.querySelector('.language-toggle');
    this.dropdown = this.container.querySelector('.language-dropdown');
  }

  attachEvents() {
    this.toggleBtn.addEventListener('click', () => this.toggleDropdown());

    this.container.addEventListener('click', (e) => {
      if (e.target.classList.contains('language-option')) {
        const langCode = e.target.getAttribute('data-lang');
        this.selectLanguage(langCode);
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.closeDropdown();
      }
    });
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
    this.dropdown.style.display = this.isOpen ? 'block' : 'none';
    this.toggleBtn.setAttribute('aria-expanded', this.isOpen);
  }

  closeDropdown() {
    this.isOpen = false;
    this.dropdown.style.display = 'none';
    this.toggleBtn.setAttribute('aria-expanded', 'false');
  }

  selectLanguage(langCode) {
    window.i18n.setLanguage(langCode);
    this.closeDropdown();
    this.render(); // Re-render to update current language display
  }
}

// Auto-initialize language selector when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const languageContainer = document.getElementById('language-selector');
  if (languageContainer) {
    new LanguageSelector(languageContainer);
  }
});
