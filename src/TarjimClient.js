import DOMPurify from 'isomorphic-dompurify';
import { isJson, isEmpty } from './helpers.js';
import { TarjimApiCaller } from './TarjimApiCaller.js';

class TarjimClient {
	
	/**
	 *
	 */
	constructor(config) {
		this.init(config);
		this.TarjimApiCaller = new TarjimApiCaller(config)
	}

	/**
	 *
	 */
	init(config) {
		this.projectId = config.projectId;
		this.defaultLanguage = config.defaultLanguage;
		this.defaultNamespace = config.defaultNamespace;
		this.supportedLanguages = config.supportedLanguages;
		this.additionalNamespaces = config.additionalNamespaces; 
		this.allNamespaces = additionalNamespaces;
		this.allNamespaces.unshift(defaultNamespace);
		this.localStorageKey = projectId+'-'+allNamespaces.toString()+'-tarjim-cached-translations';

		// DOMPurify config
		DOMPurify.setConfig({ALLOWED_ATTR: ['style', 'class', 'className', 'href', 'tabindex']})
		DOMPurify.addHook('afterSanitizeAttributes', function (node) {
			// set all elements owning target to target=_blank
			if ('href' in node) {
				node.setAttribute('target', '_blank');
				node.setAttribute('rel', 'noopener noreferrer');
			}
		});

		this.setTranslations({});
		this.initTranslations();
	}

	/**
	 *
	 */
	async initTranslations() {
		this.setIsTranslationsLoading(true);
		if (cachedTarjimData.hasOwnProperty('meta') && cachedTarjimData.meta.hasOwnProperty('results_last_update')) {
			localeLastUpdated = cachedTarjimData.meta.results_last_update;
		}

		if (cachedTarjimData.hasOwnProperty('results')) {
			cachedTranslations = cachedTarjimData.results;
		}

		//	USEEFFECT
		this.loadInitialTranslations();

		// Get language from DOM 
		let language;
		if ('ReactNative' != navigator.product) {
			let languageElement = document.getElementById('language');
			language = defaultLanguage;
			if (languageElement) {
				language = languageElement.getAttribute('data-language')
			}
		}
		else {
			language = defaultLanguage;
		}

		this.setCurrentLocale(language);

		// Update translations 
		await this.updateTranslations();

		this.setIsTranslationsLoading(false);
	}

	/**
	 *
	 */
	isTranslationsLoading() {
		return this.isTranslationsLoading;
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
		let _translations = {};
		this.allNamespaces.forEach(namespace => {
			_translations[namespace] = {};
			this.supportedLanguages.forEach(language => {
				if (this.translations.hasOwnProperty(namespace)) {
					if (this.translations[namespace].hasOwnProperty(language)) {
						_translations[namespace][language] = this.translations[namespace][language];
					}
					else {
						_translations[namespace][language] = {};
					}
				}
				else {
					_translations[namespace][language] = {};
				}
			})
		});
	}

	/**
	 *
	 */
	async getLocalStorageTranslations() {
		let _translations = {}
		let localStorageData = localStorage.getItem(localStorageKey);
		if (!isEmpty(localStorageData)) {
			localStorageData = JSON.parse(localStorageData);
			localeLastUpdated = localStorageData.meta.results_last_update;
			if (await this.TarjimApiCaller.translationsNeedUpdate()) {
				let apiData = await this.TarjimApiCaller.getTranslationsFromApi();
				localStorage.setItem(localStorageKey, JSON.stringify(apiData));
				_translations = apiData.results;
			}
		}
		else {
			if (await this.TarjimApiCaller.translationsNeedUpdate()) {
				let apiData = await this.TarjimApiCaller.getTranslationsFromApi();
				localStorage.setItem(localStorageKey, JSON.stringify(apiData));
				_translations = apiData.results;
			}
			else {
				if (cachedTarjimData.hasOwnProperty('results')) {
					localStorage.setItem(localStorageKey, JSON.stringify(cachedTarjimData));
					_translations = cachedTarjimData.results;
				}
				else {
					let apiData = await this.TarjimApiCaller.getTranslationsFromApi();
					localStorage.setItem(localStorageKey, JSON.stringify(apiData));
					_translations = apiData.results;
				}
			}
		}

		console.log({_translations});
		return _translations;
	}

	/**
	 *
	 */
	async updateTranslations() {
		let _translations = await getLocalStorageTranslations();

		this.setTranslations(_translations);
		// Get language from cake
		let language;
		if ('ReactNative' != navigator.product) {
			let languageElement = document.getElementById('language');
			language = defaultLanguage;
			if (languageElement) {
				language = languageElement.getAttribute('data-language')
			}
		}
		else {
			language = defaultLanguage;
		}

	}

	/**
	 *
	 */
	async setTranslation(languageTag, isRTL = false) {
		// Set translation
		setCurrentLocale(languageTag);
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
	__T(key, config) {
		// Sanity
		if (isEmpty(key)) {
			return;
		}

		let namespace = defaultNamespace;
		if (config && config.namespace) {
			namespace = config.namespace;
		}

		if (config && config.SEO) {
			return __TSEO(key, config);
		}

		let tempKey = key;
		if (typeof key === 'object' || Array.isArray(key)) {
			tempKey = key['key'];
		}

		let translationValue = getTranslationValue(key, namespace);
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
		if (config && !isEmpty(config.mappings) && value) {
			let mappings = config.mappings;
			if (config.subkey) {
				mappings = mappings[config.subkey];
			}
			value = _injectValuesInTranslation(value, mappings);
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
			return <span data-tid={translationId} dangerouslySetInnerHTML={{__html: value}}></span>
		}
		else {
			return value;
		}
	}

	/**
	 * return dataset with all languages for key
	 */
	__TD(key, config = {}) {
		let namespace = defaultNamespace;
		if (config && config.namespace) {
			namespace = config.namespace;
		}

		let dataset = {};
		let value = '';
		if ('allNamespaces' === namespace) {
			allNamespaces.forEach(_namespace => {
				dataset[_namespace] = {};
				supportedLanguages.forEach(language => {
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
			supportedLanguages.forEach(language => {
				let value = getTranslationValue(key, namespace, language);
				dataset[language] = value.value;
			})
		}

		return dataset;
	}

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
		return __T(key, config);
	}

	/**
	 * Alias for __TM()
	 */
	__TI(key, attributes) {
		return __TM(key, attributes);
	}

	/**
	 * Used for media
	 * attributes for media eg: class, id, width...
	 * If received key doesn't have type:image return __T(key) instead
	 */
	__TM(key, attributes={}) {
		// Sanity
		if (isEmpty(key)) {
			return;
		}

		let namespace = defaultNamespace;

		if (attributes && attributes.namespace) {
			namespace = attributes.namespace;
		}

		let translationValue = getTranslationValue(key, namespace);
		let value = translationValue.value;
		let translationId = translationValue.translationId;
		let translation = translationValue.fullValue;

		let attributesFromRemote = {};

		let src = translation.value;
		translationId = translation.id;
		if (!isEmpty(translation.attributes)) {
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
	}


	__TSEO(key, config = {}) {
		// Sanity
		if (isEmpty(key)) {
			return;
		}
		if (!config || !config.SEO) {
			return key;
			}

		switch(config.SEO) {
			case 'page_title':
				return __TTT(key);
			case 'open_graph':
				return __TMT(key);
			case 'twitter_card':
				return __TMT(key);
			case 'page_description':
				return __TMD(key);
			default:
				return key;
		}

	}

	/**
	 * Used for meta tags (Open Graph and twitter card )
	 */
	__TMT(key) {
		// Sanity
		if (isEmpty(key)) {
			return;
		}

		let namespace = defaultNamespace;

		let translationValue = getTranslationValue(key, namespace);
		let value = translationValue.value;

		let tagsObject;
		let metaTag;

		// Check if array
		if ( 'object' ==  typeof(isJson(value)) ) {

			let tagsObject = isJson(value);
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
		if (isEmpty(key)) {
			return;
		}

		let namespace = defaultNamespace;

		let translationValue = getTranslationValue(key, namespace);
		let value = translationValue.value;

		let titleTag;

		document.title = value;

	}

	/**
	 * Used for page meta description
	 */
	__TMD(key) {
		// Sanity
		if (isEmpty(key)) {
			return;
		}

		let namespace = defaultNamespace;

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
	getTranslationValue(key, namespace, language = '') {
		if (isEmpty(this.translations)) {
			loadInitialTranslations();
		}

		if (isEmpty(language)) {
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
	}

	/**
	 *
	 */
	_injectValuesInTranslation(translationString, mappings) {
		let regex = /%%.*?%%/g;
		let valuesKeysArray = translationString.match(regex);


		let percentRegex = new RegExp('%%', 'mg')
		//translationString = translationString.replace(percentRegex,'');

		if (!isEmpty(valuesKeysArray)) {
			for (let i = 0; i < valuesKeysArray.length; i++) {
				let valueKeyStripped = valuesKeysArray[i].replace(percentRegex,'').toLowerCase();

				regex = new RegExp('%%'+valueKeyStripped+'%%', 'ig')
				translationString = translationString.replace(regex, mappings[valueKeyStripped]);
			}
		}

		return translationString;
	}

}

export default TarjimClient;
