<a href="https://tarjim.io"><img src="https://tarjim.io/wp-content/uploads/2022/02/final-logo-01.svg" width="450px" alt="Tarjim logo"></a>

## [Tarjim Docs](https://app.tarjim.io/en/documentation)


## Installation

```bash
npm install tarjim-react-client
```

  

## Usage:

### Setting up

1. Create config object

```javascript
import cachedTarjimData from 'cache/cachedTarjimData';

const tarjimConfig = {
	projectId: 'tarjim-project-id',
	tarjimApikey: 'tarjim-api-key',
	defaultLanguage: 'default-language',
	defaultNamespace:'default-namepsace',
	supportedLanguages: ['project-languages'],
	additionalNamespaces: [], // optional if more than one namespace used
	cachedTarjimData: cachedTarjimData, // JSON object containing the results from tarjim
	useSingleInstance: true, // optional set to false if using multiple projects in same codebase and need multiple instances of the client
}
```

N.B. cachedTarjimData can be obtained from `https://app.tarjim.io/api/v1/translationkeys/jsonByNameSpaces`with your project id and namespaces (check [Tarjim docs](https://app.tarjim.io/en/documentation)) and use the full result;
If cachedTarjimData is not passed with config object the client will always load the latest translations from the api


2. Create Object and call init() function

```javascript

import TarjimClient from 'tarjim-react-client';

let tarjimClient = new TarjimClient();
tarjimClient.init(tarjimConfig);
```

N.B. when tarjim finishes loading the translations it triggers the event 'tarjimFinishedLoadingTranslations' on the window object

  

### Functions:
* Check loading state
```javascript
isLoading = tarjimClient.isTranslationsLoading()
```
* Transalte:

```javascript
tarjimClient.__T('key');
// returns <span data-tid="id-in-tarjim">key value</span>
```

* Change lang:

```javascript
tarjimClient.setCurrentLocale(language);
```

* Get current lang:

```javascript
tarjimClient.getCurrentLocale();
```

* For placeholder, dropdown/select options, page title, etc... use __TS() to skip adding a span

```javascript
__TS('key')
// returns the value from tarjim
```
### To use variables in translation value

* In tarjim.io add the variables you want as %%variable_name%%

* In react pass the mappings in config

```javascript

tarjimClient.__T(key, {
mappings: {
		'var1': 'var1 value',
	}
) 
```

* If the mapping array contains nested arrays ex:

```javascript
'mappings': {
	'subkey1': {
		'var1': 'var1 value',
	},
	'subkey2': {
		'var1': 'var1 value',
	},
}
```

pass subkey in react in config ex:
```javascript
tarjimClient.__T(key, {mappings: mappings, subkey: 'subkey1'})
```
* Important note

you might need to camelize the subkey before using it in __T()

  

### Using tarjim for media

* call __TM(key, attributes={}) function with spread operator (...)

* __TI() is an alias of __TM()

* usage ex:

```javascript
// optional attributes
attributes = {
	class: 'img-class-name',
	width: '100px'
};

<img {...__TM(key, attributes)} />

renders <img src='src' className='img-class-name' width='100px' />

```

*  **Important note for media attributes**:

attributes received from tarjim.io will overwrite attributes received from the function call if same attribute exists in both

so in previous example if this key has attributes: {class: 'class-from-tarjim', height:'200px'} __TM will return
```
<img  src='src'  class='class-from-tarjim'  width='100px'  height='200px'/>
```
notice that width and height are both added

  

### Using tarjim for datasets

* __TD($key, $config = {});

* returns values for all languages for a key ex:

```javascript
{
	'en' => 'en values,
	'fr' => 'fr value'
}
```

* config can be {'namespace' => $namespace} if $namespace == 'all_namespaces' returns the values for all namespaces ex:

```javascript
{
	'namespace 1' => {
		'en' => 'en values,
		'fr' => 'fr value'
	},

	'namespace 2' => {
		'en' => 'en value',
		'fr' => 'fr value'
	}
}
```

  

### Example Usage With Provider

```javascript
// Libraries
import React ,{ useState, useEffect, createContext } from 'react';
import TarjimClient from 'tarjim-react-client';
import tarjimConfig from 'tarjimConfig.js';

export const LocalizationContext = createContext({
	__T: () => {},
	__TS: () => {},
	__TM: () => {},
	__TSEO: () => {},
	__TI: () => {},
	__TD: () => {},
	getCurrentLocale: () => {},
	setCurrentLocale: () => {},
	tarjimIsLoading: () => {},
});

export const LocalizationProvider = ({children}) => {
	// State
	const [ tarjimClient, setTarjimClient ] = useState(new TarjimClient(tarjimConfig));
	const [ locale, setLocale ] = useState('');
	const [ isLoading, setIsLoading ] = useState(true);

	window.addEventListener('tarjimFinishedLoadingTranslations', function() {
		setIsLoading(false);
	})
	  
	/**
	 *
	 */
	useEffect(() => {
		// Get language from DOM
		let language = 'en';
		let languageElement = document.getElementById('language');
		if (languageElement) {
		language = languageElement.getAttribute('data-language')
		}
		tarjimClient.setCurrentLocale(language);
	}, [])

	/**
	 *
	 */
	function tarjimIsLoading() {
		return tarjimClient.isTranslationsLoading();
	} 

	/**
	 *
	 */
	function getCurrentLocale() {
		return tarjimClient.getCurrentLocale();
	}

	/**
	 *
	 */
	function setCurrentLocale(_locale) {
		let returnVal = tarjimClient.setCurrentLocale(_locale);
		setLocale(_locale)
		return returnVal;
	}

	// Translation functions
	/**
	 *
	 */
	function __T(key, config = {}) {
		return tarjimClient.__T(key, config);
	}

	/**
	 * return dataset with all languages for key
	 */
	function __TD(key, config = {}) {	
		return tarjimClient.__TD(key, config);
	}

	/**
	 * Shorthand for __T(key, {skipTid: true})
	 * skip assiging tid and wrapping in span
	 * used for images, placeholder, select options, title...
	 */ 
	function __TS(key, config = {}) {
		return tarjimClient.__TS(key, config);
	}

	/**
	 * Alias for __TM()
	 */
	function __TI(key, attributes) {
		return tarjimClient.__TI(key, attributes);
	}

	/**
	 * Used for media
	 * attributes for media eg: class, id, width...
	 * If received key doesn't have type:image return __T(key) instead
	*/
	function __TM(key, attributes={}) {
		return tarjimClient.__TM(key, attributes);
	}

	/**
	 *
	 */
	function __TSEO(key, config = {}) {
		return tarjimClient.__TSEO(key, config);
	} 

	/**
	 * Used for meta tags (Open Graph and twitter card )
	 */
	function __TMT(key) {
		return tarjimClient.__TMT(key);
	}

	/**
	 * Used for Title tag
	 */
	function __TTT(key) {
		return tarjimClient.__TTT(key);
	}

	/**
	 * Used for page meta description
	 */
	function __TMD(key) {
		return tarjimClient.__TMD(key);
	}

	/**
	 * Render
	 */
	return (
		<LocalizationContext.Provider
			value={{
			__T,
			__TS,
			__TM,
			__TSEO,
			__TI,
			__TD,
			tarjimIsLoading: isLoading,
			getCurrentLocale,
			setCurrentLocale
			}}>
			{children}
		</LocalizationContext.Provider>
	);

}

```