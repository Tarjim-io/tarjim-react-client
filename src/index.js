import DOMPurify from 'isomorphic-dompurify';
import React from 'react';
import memoize from 'lodash.memoize';

let tarjimReactClientInstance
class TarjimClient {
	
	/**
	 *
	 */
	constructor(config) {
		let useSingleInstance = config.hasOwnProperty('useSingleInstance') ? config.useSingleInstance : true;

		if (useSingleInstance) {
			if (tarjimReactClientInstance) {
				return tarjimReactClientInstance;
			}
			else {
				this.init(config)
				tarjimReactClientInstance = this;
			}
		}
		else {
			this.init(config)
		}
	}

	/**
	 *
	 */
	init(config) {
		// Project config
		this.projectId = config.projectId;
		this.tarjimApikey = config.tarjimApikey;
		this.defaultLanguage = config.defaultLanguage;
		this.defaultNamespace = config.defaultNamespace;
		this.supportedLanguages = config.supportedLanguages;
		this.additionalNamespaces = !this.isEmpty(config.additionalNamespaces) ? config.additionalNamespaces : []; 
		this.allNamespaces = this.additionalNamespaces;
		this.allNamespaces.unshift(this.defaultNamespace);

		// Cache
		this.cachedTarjimData = !this.isEmpty(config.cachedTarjimData) ? config.cachedTarjimData : {};
		this.localeLastUpdated = 0;

		// Local storage
		this.localStorageKey = this.projectId+'-'+this.allNamespaces.toString()+'-tarjim-cached-translations';

		// Api endpoints
		this.getMetaEndpoint = `https://app.tarjim.io/api/v1/translationkeys/json/meta/${this.projectId}?apikey=${this.tarjimApikey}`;
		this.getTranslationsEndpoint = `https://app.tarjim.io/api/v1/translationkeys/jsonByNameSpaces`;

		// DOMPurify config
		DOMPurify.setConfig({ALLOWED_ATTR: ['style', 'class', 'className', 'href', 'tabindex']})
		DOMPurify.addHook('afterSanitizeAttributes', function (node) {
			// set all elements owning target to target=_blank
			if ('href' in node) {
				node.setAttribute('target', '_blank');
				node.setAttribute('rel', 'noopener noreferrer');
			}
		});

		this.loadInitialTranslations();

		//this.setTranslations(this.cachedTarjimData);
		this.initTranslations();

	}

	/**
	 *
	 */
	async initTranslations() {
		let tarjimFinishedLoadingTranslations = new CustomEvent('tarjimFinishedLoadingTranslations');
		this.setIsTranslationsLoading(true);
		if (this.cachedTarjimData.hasOwnProperty('meta') && this.cachedTarjimData.meta.hasOwnProperty('results_last_update')) {
			this.localeLastUpdated = this.cachedTarjimData.meta.results_last_update;
		}

//		if (this.cachedTarjimData.hasOwnProperty('results')) {
//			this.setTranslations(this.cachedTarjimData.results);
//		}

		//	USEEFFECT
	//	this.loadInitialTranslations();

		this.setCurrentLocale(this.defaultLanguage);

		// Update translations 
		await this.updateTranslations();

		this.setIsTranslationsLoading(false);
		window.dispatchEvent(tarjimFinishedLoadingTranslations);
	}

	/**
	 *
	 */
	setIsTranslationsLoading(value) {
		this.isTranslationsLoading = value;
	}

	/**
	 *
	 */
	setTranslations(value) {
		this.translations = value;
	}

	/**
	 * 
	 */
	loadInitialTranslations() {
		this.setTranslations({});
		let _translations = {}
		if (this.cachedTarjimData.hasOwnProperty('results')) {
			_translations = this.cachedTarjimData.results;	
		}
		else {
			this.allNamespaces.forEach(namespace => {
				_translations[namespace] = {};
				this.supportedLanguages.forEach(language => {
					_translations[namespace][language] = {};
				})
			});
		}

		this.setTranslations(_translations);
	}

	/**
	 *
	 */
	async updateTranslations() {
		let localStorageData = localStorage.getItem(this.localStorageKey);
		
		if (!this.isEmpty(localStorageData)) {
			localStorageData = JSON.parse(localStorageData);
			let localStorageLastUpdated = localStorageData.meta.results_last_update;

			// if local storage data is newer than cached data
			if (localStorageLastUpdated > this.localeLastUpdated) {
				this.localeLastUpdated = localStorageData;
				if (await this.translationsNeedUpdate()) {
					let apiData = await this.getTranslationsFromApi();
					localStorage.setItem(this.localStorageKey, JSON.stringify(apiData));
					this.setTranslations(apiData.results);
				}
				else {
					this.setTranslations(localStorageData.results);
				}
			} 
			// if cached data is newer than local storage
			else {
				if (await this.translationsNeedUpdate()) {
					let apiData = await this.getTranslationsFromApi();
					localStorage.setItem(this.localStorageKey, JSON.stringify(apiData));
					this.setTranslations(apiData.results);
				}
				else {
					localStorage.setItem(this.localStorageKey, JSON.stringify(this.cachedTarjimData));
				}
			}
		}
		else if (!this.isEmpty(this.cachedTarjimData)){
			if (await this.translationsNeedUpdate()) {
				let apiData = await this.getTranslationsFromApi();
				localStorage.setItem(this.localStorageKey, JSON.stringify(apiData));
				this.setTranslations(apiData.results);
			}
			else {
				localStorage.setItem(this.localStorageKey, JSON.stringify(this.cachedTarjimData));
			}
		}
		else {
			let apiData = await this.getTranslationsFromApi();
			localStorage.setItem(this.localStorageKey, JSON.stringify(apiData));
			this.setTranslations(apiData.results);
		}

		//let _translations = await this.getLocalStorageTranslations();

		//this.setTranslations(_translations);
	}

	/**
	 *
	 */
	async getLocalStorageTranslations() {
		let _translations = {}
		let localStorageData = localStorage.getItem(this.localStorageKey);
		if (!this.isEmpty(localStorageData)) {
			localStorageData = JSON.parse(localStorageData);
			this.localeLastUpdated = localStorageData.meta.results_last_update;
			if (await this.translationsNeedUpdate()) {
				let apiData = await this.getTranslationsFromApi();
				localStorage.setItem(this.localStorageKey, JSON.stringify(apiData));
				_translations = apiData.results;
			}
		}
		else {
			if (await this.translationsNeedUpdate()) {
				let apiData = await this.getTranslationsFromApi();
				localStorage.setItem(this.localStorageKey, JSON.stringify(apiData));
				_translations = apiData.results;
			}
			else {
				if (this.cachedTarjimData.hasOwnProperty('results')) {
					localStorage.setItem(this.localStorageKey, JSON.stringify(this.cachedTarjimData));
					_translations = this.cachedTarjimData.results;
				}
				else {
					let apiData = await this.getTranslationsFromApi();
					localStorage.setItem(this.localStorageKey, JSON.stringify(apiData));
					_translations = apiData.results;
				}
			}
		}

		return _translations;
	}

	/**
	 *
	 */
	async setTranslation(languageTag, isRTL = false) {
		// Set translation
		this.setCurrentLocale(languageTag);
	}

	/**
	 *
	 */
	getCurrentLocale() {
		return this.currentLocale;
	}

	/**
	 *
	 */
	setCurrentLocale(locale) {
		this.currentLocale = locale;
	}

	// Translation functions
	/**
	 *
	 */
	__T = memoize((key, config) => {
		// Sanity
		if (this.isEmpty(key)) {
			return;
		}

		let namespace = this.defaultNamespace;
		if (config && config.namespace) {
			namespace = config.namespace;
		}

		if (config && config.SEO) {
			return this.__TSEO(key, config);
		}

		let tempKey = key;
		if (typeof key === 'object' || Array.isArray(key)) {
			tempKey = key['key'];
		}

		let translationValue = this.getTranslationValue(key, namespace);
		let value = translationValue.value;
		let translationId = translationValue.translationId;
		let assignTarjimId = translationValue.assignTarjimId;
		let translation = translationValue.fullValue;

		// If type is image call __TM() instead
		//		if (translation.type && translation.type === 'image') {
		//			return __TM(key, config);
		//		}

		let renderAsHtml = false;
		let sanitized;
		if ('ReactNative' != navigator.product) {
			value = DOMPurify.sanitize(value)

			if (value.match(/<[^>]+>/g)) {
				renderAsHtml = true;
			}
		}

		//if ((typeof key === 'object' || Array.isArray(key)) && value) {
		if (config && !this.isEmpty(config.mappings) && value) {
			let mappings = config.mappings;
			if (config.subkey) {
				mappings = mappings[config.subkey];
			}
			value = this._injectValuesInTranslation(value, mappings);
		}

		if ('ReactNative' == navigator.product) {
			return  value;
		}

		if (
			(typeof translation.skip_tid !== 'undefined' && translation.skip_tid === true) ||
			(config && config.skipAssignTid) ||
			(config && config.skipTid)
		) {
			assignTarjimId = false;
			renderAsHtml = false;
		}

		if (assignTarjimId || renderAsHtml) {
			//let span = document.createElement('span');
			//span.setAttribute('data-tid', translationId);
			//span.innerHTML = value;
			//return span.outerHTML;
			return <span data-tid={translationId} dangerouslySetInnerHTML={{__html: value}}></span>
		}
		else {
			return value;
		}
	}, (key, config) =>(config ? key + JSON.stringify(config) + this.projectId + this.currentLocale : key + this.projectId + this.currentLocale))

	/**
	 * return dataset with all languages for key
	 */
	__TD = memoize((key, config = {}) => {
		let namespace = this.defaultNamespace;
		if (config && config.namespace) {
			namespace = config.namespace;
		}

		let dataset = {};
		let value = '';
		if ('allNamespaces' === namespace) {
			this.allNamespaces.forEach(_namespace => {
				dataset[_namespace] = {};
				this.supportedLanguages.forEach(language => {
					let value = getTranslationValue(key, _namespace, language);
					if (value.keyFound) {
						value = value.value;
					}
					else {
						value = '';
					}
					dataset[_namespace][language] = value;
				})
			})
		}
		else {
			this.supportedLanguages.forEach(language => {
				let value = this.getTranslationValue(key, namespace, language);
				dataset[language] = value.value;
			})
		}

		return dataset;
	}, (key, config) =>(config ? key + JSON.stringify(config) + this.projectId + this.currentLocale : key + this.projectId + this.currentLocale))

	/**
	 * Shorthand for __T(key, {skipTid: true})
	 * skip assiging tid and wrapping in span
	 * used for images, placeholder, select options, title...
	 */
	__TS(key, config = {}) {
		config = {
			...config,
			skipTid: true,
		};
		return this.__T(key, config);
	}

	/**
	 * Alias for __TM()
	 */
	__TI(key, attributes) {
		return this.__TM(key, attributes);
	}

	/**
	 * Used for media
	 * attributes for media eg: class, id, width...
	 * If received key doesn't have type:image return __T(key) instead
	 */
	__TM = memoize((key, attributes={}) => {
		// Sanity
		if (this.isEmpty(key)) {
			return;
		}

		let namespace = this.defaultNamespace;

		if (attributes && attributes.namespace) {
			namespace = attributes.namespace;
		}

		let translationValue = this.getTranslationValue(key, namespace);
		let value = translationValue.value;
		let translationId = translationValue.translationId;
		let translation = translationValue.fullValue;

		let attributesFromRemote = {};

		let src = translation.value;
		translationId = translation.id;
		if (!this.isEmpty(translation.attributes)) {
			attributesFromRemote = translation.attributes;
		}

		// Merge attributes from tarjim.io and those received from view
		// for attributes that exist in both arrays take the value from tarjim.io
		attributes = {
			...attributes,
			...attributesFromRemote
		}

		let sanitized;
		let response;
		if ('ReactNative' != navigator.product) {
			sanitized = DOMPurify.sanitize(value);
			response = {
				'src': sanitized,
				'data-tid': translationId,
			}
		}
		else {
			sanitized = value;
			response = {
				'source': {
					'uri': sanitized
				}
			}
		}

		if (attributes && attributes.namespace) {
			delete attributes.namespace;
		}

		for (let [attribute, attributeValue] of Object.entries(attributes)) {
			// Avoid react warnings by changing class to className
			if (attribute === 'class') {
				attribute = 'className';
			}
			response[attribute] = attributeValue;
		}

		return response;
	}, (key, config) =>(config ? key + JSON.stringify(config) + this.projectId + this.currentLocale : key + this.projectId + this.currentLocale))


	__TSEO = memoize((key, config = {}) => {
		// Sanity
		if (this.isEmpty(key)) {
			return;
		}
		if (!config || !config.SEO) {
			return key;
			}

		switch(config.SEO) {
			case 'page_title':
				return this.__TTT(key);
			case 'open_graph':
				return this.__TMT(key);
			case 'twitter_card':
				return this.__TMT(key);
			case 'page_description':
				return this.__TMD(key);
			default:
				return key;
		}

	}, (key, config) =>(config ? key + JSON.stringify(config) + this.projectId + this.currentLocale : key + this.projectId + this.currentLocale))

	/**
	 * Used for meta tags (Open Graph and twitter card )
	 */
	__TMT(key) {
		// Sanity
		if (this.isEmpty(key)) {
			return;
		}

		let namespace = this.defaultNamespace;

		let translationValue = this.getTranslationValue(key, namespace);
		let value = translationValue.value;

		let tagsObject;
		let metaTag;

		// Check if array
		if ( 'object' ==  typeof(this.isJson(value)) ) {

			let tagsObject = this.isJson(value);
			var properties = Object.keys(tagsObject);

			properties.map(function (property) {
				if (tagsObject[property]) {
					metaTag = document.createElement("meta");
					metaTag.setAttribute('property', property )
					metaTag.setAttribute('content', tagsObject[property] )
					document.head.appendChild(metaTag);
			}
			});

		}

	}

	/**
	 * Used for Title tag
	 */
	__TTT(key) {
		// Sanity
		if (this.isEmpty(key)) {
			return;
		}

		let namespace = this.defaultNamespace;

		let translationValue = this.getTranslationValue(key, namespace);
		let value = translationValue.value;

		let titleTag;

		document.title = value;

	}

	/**
	 * Used for page meta description
	 */
	__TMD(key) {
		// Sanity
		if (this.isEmpty(key)) {
			return;
		}

		let namespace = this.defaultNamespace;

		let translationValue = getTranslationValue(key, namespace);
		let value = translationValue.value;

		let metaTag;

		document.querySelector('meta[name="description"]').setAttribute("content", value);

	}


	/**
	 * Get value for key from translations object
	 * returns array with
	 * value => string to render or media src
	 * translationId => id to assign to data-tid
	 * assignTarjimId => boolean
	 * fullValue => full object for from $_T to retreive extra attributes if needed
	 */
	getTranslationValue = memoize((key, namespace, language = '') => {
		if (this.isEmpty(this.translations)) {
			this.loadInitialTranslations();
		}

		if (this.isEmpty(language)) {
			language = this.currentLocale;
		}

		let tempKey = key;
		let keyFound = false;
		if (typeof key === 'object' || Array.isArray(key)) {
			tempKey = key['key'];
		}

		let translation;
		if (
			this.translations.hasOwnProperty(namespace) &&
			this.translations[namespace][language].hasOwnProperty(tempKey.toLowerCase())
		) {
			keyFound = true;
			translation = this.translations[namespace][language][tempKey.toLowerCase()];
		}
		else {
			translation = tempKey;
		}

		let translationString;
		let assignTarjimId = false;
		let translationId;
		if (typeof translation === 'object' || Array.isArray(translation)) {
			translationString = translation.value;
			translationId = translation.id;
			assignTarjimId = true;
		}
		else {
			translationString = translation;
		}

		let result = {
			'value': translationString,
			'translationId': translationId,
			'assignTarjimId': assignTarjimId,
			'fullValue': translation,
			'keyFound': keyFound
		};


		return result;
	}, (key, config) =>(config ? key + JSON.stringify(config) + this.projectId + this.currentLocale : key + this.projectId + this.currentLocale))

	/**
	 *
	 */
	_injectValuesInTranslation = memoize((translationString, mappings) => {
		let regex = /%%.*?%%/g;
		let valuesKeysArray = translationString.match(regex);


		let percentRegex = new RegExp('%%', 'mg')
		//translationString = translationString.replace(percentRegex,'');

		if (!this.isEmpty(valuesKeysArray)) {
			for (let i = 0; i < valuesKeysArray.length; i++) {
				let valueKeyStripped = valuesKeysArray[i].replace(percentRegex,'').toLowerCase();

				regex = new RegExp('%%'+valueKeyStripped+'%%', 'ig')
				translationString = translationString.replace(regex, mappings[valueKeyStripped]);
			}
		}

		return translationString;
	}, (key, config) =>(config ? key + JSON.stringify(config) + this.projectId + this.currentLocale : key + this.projectId + this.currentLocale))

	/**
	 *
	 */
	async translationsNeedUpdate() {
		let returnValue;
		try {
			let response = await fetch(this.getMetaEndpoint);
			let result = await response.json();
			let apiLastUpdated = result.result.data.meta.results_last_update;
			if (this.localeLastUpdated < apiLastUpdated) {
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
					'project_id': this.projectId,
					'namespaces': this.allNamespaces,
					'apikey': this.tarjimApikey,
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
			_translations = this.translations;
		}

		return _translations;
	}


	/**
	 *
	 */
	isJson(str) {
		try {
			let value = JSON.parse(str);
			return value
		} catch (e) {
			return str;
		}
	}

	/**
	 *
	 */
	isEmpty(variable) {

		if (variable === false) {
			return true;
		}

		if (Array.isArray(variable)) {
			return variable.length === 0;
		}

		if (variable === undefined || variable === null) {
			return true;
		}

		if (typeof variable === 'string' && variable.trim() === '') {
			return true;
		}

		if (typeof variable === 'object') {
			return (Object.entries(variable).length === 0 &&
				!(variable instanceof Date));
		}

		return false;
	}
}

export default TarjimClient;
