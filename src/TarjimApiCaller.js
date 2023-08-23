import { isJson, isEmpty } from './helpers.js';

class TarjimApiCaller {
	
	/**
	 *
	 */
	constructor(config) {
		this.init(config);
	}

	/**
	 *
	 */
	init(config) {
		this.projectId = config.projectId;
		this.tarjimApikey = config.tarjimApikey;
		this.defaultNamespace = config.defaultNamespace;
		this.supportedLanguages = config.supportedLanguages;
		this.additionalNamespaces = config.additionalNamespaces; 
		this.allNamespaces = additionalNamespaces;
		this.allNamespaces.unshift(defaultNamespace);
		this.getMetaEndpoint = `https://app.tarjim.io/api/v1/translationkeys/json/meta/${this.projectId}?apikey=${this.tarjimApikey}`;
		this.getTranslationsEndpoint = `https://app.tarjim.io/api/v1/translationkeys/jsonByNameSpaces`;
	}

	/**
	 *
	 */
	async translationsNeedUpdate() {
		let returnValue;
		try {
			let response = await fetch(this.getMetaEndpoint);
			let result = await response.json();
			let apiLastUpdated = result.result.data.meta.results_last_update;
			if (true || localeLastUpdated < apiLastUpdated) {
				returnValue = true;
			}
			else {
				returnValue = false;
			}
		} catch(err) {
			console.log('Translations api error: ', err);
			returnValue = true;
		}

		return returnValue;
	}

	/**
	 *
	 */
	async getTranslationsFromApi() {
		let _translations = {};

		try {
			let response = await fetch(this.getTranslationsEndpoint, {
				method: 'POST',
				body: JSON.stringify({
					'project_id': projectId,
					'namespaces': allNamespaces,
					'apikey': tarjimApikey,
				}),
			});
			let result = await response.json();
			if (result.hasOwnProperty('result')){
				result = result.result.data
			}
			let apiTranslations = result;
			_translations = apiTranslations;
		} catch(err) {
			console.log('Translations api error: ', err);
			_translations = translationKeys;
		}

		return _translations;
	}
}

export default TarjimApiCaller;
