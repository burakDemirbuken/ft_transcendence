const lang = {
    eng: { next: "tur" },
    tur: { next: "deu" },
    deu: { next: "eng" },
};
const translationCache = new Map();
async function applyTranslations(translations, sectionName) {
    let section;
    if (sectionName === "navbar")
        section = document.querySelector("#navbar");
    else
        section = document.querySelector("#content");
    const dataFields = section.querySelectorAll("[data-i18n]");
    dataFields.forEach(datai18n => {
        const nestedKeys = datai18n.getAttribute("data-i18n");
        const keys = nestedKeys.split('.');
        let translation = translations[sectionName];
        for (const key of keys) {
            translation = translation[key];
            if (translation === undefined)
                break;
        }
        if (translation !== undefined)
            datai18n.textContent = translation;
    });
}
export async function getTranslations(lang) {
    if (translationCache.has(lang)) {
        return translationCache.get(lang);
    }
    const response = await fetch(`locales/${lang}.json`);
    const translations = await response.json();
    translationCache.set(lang, translations);
    return translations;
}

export async function getJsTranslations(lang) {
    const response = await fetch(`locales/jsI18n.json`);
    const translations = await response.json();
    return translations[lang];
}

class I18n {
    static async loadLanguage(section) {
        const translations = await getTranslations(localStorage.getItem("langPref"));
        applyTranslations(translations, section);
    }
    static async nextLanguage(section) {
        localStorage.setItem("langPref", lang[localStorage.getItem("langPref")].next);
        const translations = await getTranslations(localStorage.getItem("langPref"));
        applyTranslations(translations, section);
    }
}
export default I18n;
//# sourceMappingURL=I18n.js.map