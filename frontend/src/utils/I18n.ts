const lang = {
	eng: { next: "tur" },
	tur: { next: "deu" },
	deu: { next: "eng" },
}

const translationCache = new Map();

// Get all data-i18n attributes, loop through the keys and apply translations
async function applyTranslations(translations) {
	const dataFields = document.querySelectorAll("[data-i18n]");
	dataFields.forEach(datai18n => {
		const nestedKeys = datai18n.getAttribute("data-i18n");
		const keys = nestedKeys.split('.');

		let translation = translations;
		for (const key of keys)
		{
			translation = translation[key];
 			if (translation === undefined)
				break;
		}

		if (translation !== undefined)
			datai18n.textContent = translation;
	});
}

// Get lang json and return it
export async function getTranslations(lang:string) {
	if (translationCache.has(lang)) {
		return translationCache.get(lang);
	}
	const response = await fetch(`locales/${lang}.json`);
	const translations = await response.json();
	translationCache.set(lang, translations);
	return translations;
}

// Get jsI18n json and return a language in it
export async function getJsTranslations(lang:string) {
	const response = await fetch(`locales/jsI18n.json`);
	const translations = await response.json();
	return translations[lang];
}

// I18n class with for translation loading and switching
class I18n {
	static async loadLanguage() {
		const translations = await getTranslations(localStorage.getItem("langPref"));
		applyTranslations(translations);
	}

	static async nextLanguage() {
		localStorage.setItem("langPref", lang[localStorage.getItem("langPref")].next);
		const translations = await getTranslations(localStorage.getItem("langPref"));
		applyTranslations(translations);
	}
}

export default I18n;

