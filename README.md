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
import cachedTarjimData from 'path-to-cached-tarjim-json-file';

const tarjimConfig = {
	projectId: 'tarjim-project-id',
	tarjimApikey: 'tarjim-api-key',
	defaultLanguage: 'default-language',
	defaultNamespace:'default-namepsace',
	supportedLanguages: ['project-languages'],
	additionalNamespaces: [], // optional if more than one namespace used pass namespaces names
	cachedTarjimData: cachedTarjimData, // JSON object containing the results from tarjim
	useSingleInstance: true, // optional set to false if using multiple projects in same codebase and need multiple instances of the client
    keyCase: 'lower', // optional, defaults to 'lower'. Set to specify the case of the keys when pulled from tarjim. 'lower' converts all keys to lowercase and converts keys passed to __T() functions to lowercase before lookup. 'original' keeps the keys' cases as is from tarjim and preserves the cases of keys passed to __T().
}
```

N.B. the initial cachedTarjimData can be obtained from `https://app.tarjim.io/api/v1/translationkeys/jsonByNameSpaces` using your project id and namespaces (check [Tarjim docs](https://app.tarjim.io/en/documentation)) and extracting ["result"]["data"] from the fetched response into your cache file.

If cachedTarjimData is not passed with config object the client will always load the latest translations from the api


2. Pass the config object to the init() function

```javascript

import TarjimClient from 'tarjim-react-client';

let tarjimClient = new TarjimClient();
tarjimClient.init(tarjimConfig);
```

N.B. when tarjim finishes loading the translations it triggers the event 'finishedLoadingTranslations' on the tarjimClient object
```javascript 
TarjimClient.on('finishedLoadingTranslations', () => { // your logic }); 
```


### Functions

* Check loading state
```javascript
isLoading = tarjimClient.getIsLoadingTranslations();
```
* Translate:

```javascript
tarjimClient.__T('key');
// returns <span data-tid="id-in-tarjim">key value</span>
```

* Change language:

```javascript
tarjimClient.setCurrentLocale(language);
```

* Get current language:

```javascript
tarjimClient.getCurrentLocale();
```

* For placeholder, dropdown options, page title, etc... use __TS() to skip adding a span and causing render issues

```javascript
__TS('key')
// returns the value from tarjim
```
### Using variables in translations


* In your [app.tarjim.io](https://app.tarjim.io) project add the variables you want by using %%variable_name%% syntax as translation value

* In react client, pass the variable mapping in translation config

```javascript

tarjimClient.__T(key, {
mappings: {
		'var1': 'var1 value',
	}
}) 
```

### Using tarjim for media

* call __TM(key, attributes={}) function with spread operator (...)
```javascript
// optional attributes
attributes = {
	class: 'img-class-name',
	width: '100px'
};

<img {...__TM(key, attributes)} />

renders <img src='src' className='img-class-name' width='100px' />

```

**NOTE** Attributes defined in tarjim.io translation value will be overwritten by the attributes passed to __TM
  

### Using tarjim datasets
To fetch all languages for a specific key in default namespace

```javascript
__TD($key, $config = {});
```

Sample return

```javascript
{
	'en' => 'en values,
	'fr' => 'fr value'
}
```

To fetch key translations for a specific namespace, you can pass ```{'namespace' => 'your-namespace-name'}``` in the config param or ```{'namespace' => 'allNamespaces'}``` to fetch all namespaces.

Example response

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

### Using tarjim for SEO tags
* For page title
```javascript
__TSEO(key, {SEO: 'page_title'})
```
sets document.title = key's value from tarjim

* For open graph
```javascript
__TSEO(key, {SEO: 'open_graph'})
```

creates the elements and attaches them to document head
```
<meta property="og:title" content="title">
<meta property="og:description" content="desc">
<meta property="og:site_name" content="site name">
<meta property="og:url" content="url">
<meta property="og:image" content="image">
```
the content is the value provided in tarjim for key type 'Open Graph'

* For twitter cards
```javascript
__TSEO(key, {SEO: 'open_graph'})
```

creates the elements and attaches them to document head
```
<meta property="twitter:card" content="card">
<meta property="twitter:title" content="title">
<meta property="twitter:description" content="desc">
<meta property="twitter:site" content="site">
<meta property="twitter:image" content="image">
```
the content is the value provided in tarjim for key type 'Twitter card'

* For page meta description
```javascript
__TSEO(key, {SEO: 'page_description'})
```
sets the content of the meta element where name="description" if it exists, creates it otherwise
```
<meta name="description" content="description en">
```

  
### Example Usage With Provider

```javascript
// Libraries
import React ,{ useState, useEffect, createContext } from 'react';
import { TarjimClient, tarjimFunctions } from 'tarjim-react-client';
import tarjimConfig from 'tarjimConfig.js';

export const LocalizationContext = createContext({
  ...tarjimFunctions,
  setCurrentLanguage: () => {},
  tarjimIsLoading: true,
});

export const LocalizationProvider = ({children}) => {
  // State
  const [ tarjimClient, setTarjimClient ]  = useState(new TarjimClient(tarjimConfig));
  const [ locale, setLocale ] = useState('');
  const [ isLoading, setIsLoading ] = useState(true);

  let defaultLanguage = 'en';

  /**
   * 
   */
    useEffect(() => {

    // Get language from cake
      let language;
      let languageElement = document.getElementById('language');
      language = defaultLanguage;
      if (languageElement) {
        language = languageElement.getAttribute('data-language')
      }
      else {
        language = defaultLanguage;
      }

      tarjimClient.setCurrentLocale(language);

      tarjimClient.on('finishedLoadingTranslations', function() {
        setIsLoading(false);
      })

    // Disable eslint warning for next line
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   *
   */
  function setCurrentLanguage(_locale) {
    let returnVal = tarjimClient.setCurrentLocale(_locale);
    setLocale(_locale)
    return returnVal;
  }

  /**
   * Render
   */
  return (
    <LocalizationContext.Provider
      value={{
        ...(new TarjimClient(tarjimConfig)),
        tarjimIsLoading: isLoading,
        setCurrentLanguage,
      }}>
      {children}
    </LocalizationContext.Provider>
  );
}

```
