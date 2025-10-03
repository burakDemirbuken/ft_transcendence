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
    deu: { next: "eng" },
};
const translationCache = new Map();
// async function applyTranslations(translations, section) {
// 	// const translations = await I18n.nextLanguage();
// 	if (section === "navbar")
// 		section = document.querySelector("#navbar");
// 	else
// 		section = document.querySelector("#content");
// 	const dataFields = section.querySelectorAll("[data-i18n]");
// 	dataFields.forEach(datai18n => {
// 		const nestedKeys = datai18n.getAttribute("data-i18n");
// 		const keys = nestedKeys.split('.');
// 		console.log(`The keys: ${keys}`);
// 		let translation = translations.section;
// 		for (const key of keys)
// 		{
// 			console.log(`Current key: ${key}`);
// 			console.log(`Current object: ${JSON.stringify(translation, null, 2)}`);
// 			translation = translation[key];
// 			console.log(`Object after child: ${translation}`);
//  			if (translation === undefined)
// 				break;
// 		}
// 		if (translation !== undefined)
// 			datai18n.textContent = translation;
// 	});
// }
export function getTranslations(lang) {
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
    // static async switchLanguage(newLang:string, section:string) {
    static switchLanguage(newLang) {
        return __awaiter(this, void 0, void 0, function* () {
            this.currentLang = newLang;
            return yield getTranslations(newLang);
            // const translations = await getTranslations(newLang);
            // applyTranslations(translations, section);
        });
    }
    static nextLanguage() {
        return __awaiter(this, void 0, void 0, function* () {
            this.currentLang = lang[this.currentLang].next;
            return yield getTranslations(this.currentLang);
        });
    }
}
I18n.currentLang = "eng";
export default I18n;
//# sourceMappingURL=translations.js.map