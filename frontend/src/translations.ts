
const lang = {
	eng: { next: "tur" },
	tur: { next: "deu" },
	deu: { next: "eng" },
}

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

export async function getTranslations(lang:string) {
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

	// static async switchLanguage(newLang:string, section:string) {
	static async switchLanguage(newLang:string) {
		this.currentLang = newLang;
		return await getTranslations(newLang);
		// const translations = await getTranslations(newLang);
		// applyTranslations(translations, section);
	}

	static async nextLanguage() {
		this.currentLang = lang[this.currentLang].next;
		return await getTranslations(this.currentLang);
	}
}

export default I18n;

