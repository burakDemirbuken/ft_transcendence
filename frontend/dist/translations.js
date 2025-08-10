var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const lang = {
    eng: { next: "tur" },
    tur: { next: "deu" },
    deu: { next: "jpn" },
    jpn: { next: "eng" }
};
const translationCache = new Map();
export function loadTranslations(lang) {
    return __awaiter(this, void 0, void 0, function* () {
        if (translationCache.has(lang)) {
            return translationCache.get(lang);
        }
        const response = yield fetch(`locales/${lang}.json`);
        const translations = yield response.json();
        translationCache.set(lang, translations);
        return translations;
    });
}
class I18n {
    static switchLanguage(newLang) {
        return __awaiter(this, void 0, void 0, function* () {
            this.currentLang = newLang;
            return yield loadTranslations(newLang);
        });
    }
    static nextLanguage() {
        return __awaiter(this, void 0, void 0, function* () {
            this.currentLang = lang[this.currentLang].next;
            return yield loadTranslations(this.currentLang);
        });
    }
}
I18n.currentLang = "eng";
export default I18n;
//# sourceMappingURL=translations.js.map