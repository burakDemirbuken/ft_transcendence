interface LangConfig {
    next: string;
}

interface Languages {
    [key: string]: LangConfig;
}

const lang: Languages = {
    eng: { next: "tur" },
    tur: { next: "deu" },
    deu: { next: "jpn" },
    jpn: { next: "eng" }
}

const translationCache = new Map();

export async function loadTranslations(lang: string) {
    if (translationCache.has(lang)) {
        return translationCache.get(lang);
    }
    const response = await fetch(`locales/${lang}.json`);
    const translations = await response.json();
    translationCache.set(lang, translations);
    return translations;
}

class I18n {
    static currentLang = "eng";

    static async switchLanguage(newLang: string) {
        this.currentLang = newLang;
        return await loadTranslations(newLang);
    }

    static async nextLanguage() {
        this.currentLang = lang[this.currentLang].next;
        return await loadTranslations(this.currentLang);
    }
}

export default I18n;