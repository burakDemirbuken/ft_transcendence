const lang = {
    eng: { next: "tur" },
    tur: { next: "deu" },
    deu: { next: "jpn" },
    jpn: { next: "eng" }
};
const translationCache = new Map();
export async function loadTranslations(lang) {
    if (translationCache.has(lang)) {
        return translationCache.get(lang);
    }
    const response = await fetch(`locales/${lang}.json`);
    const translations = await response.json();
    translationCache.set(lang, translations);
    return translations;
}
class I18n {
    static async switchLanguage(newLang) {
        this.currentLang = newLang;
        return await loadTranslations(newLang);
    }
    static async nextLanguage() {
        this.currentLang = lang[this.currentLang].next;
        return await loadTranslations(this.currentLang);
    }
}
I18n.currentLang = "eng";
export default I18n;
//# sourceMappingURL=translations.js.map