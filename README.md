<a href="https://tarjim.io"><img src="https://tarjim.io/wp-content/uploads/2022/02/final-logo-01.svg" width="450px" alt="Tarjim logo"></a>

## [Tarjim Docs](https://app.tarjim.io/en/documentation)

---

## Installation

```bash
npm install tarjim-react-client
```

---

## Usage

### ✅ Step 1: Create `tarjimConfig`

<details>
<summary><strong>JavaScript</strong></summary>

```js
// tarjimConfig.js
import cachedTarjimData from 'path-to-cached-tarjim-json-file';

const tarjimConfig = {
  projectId: 'tarjim-project-id',
  tarjimApikey: 'tarjim-api-key',
  defaultLanguage: 'default-language',
  defaultNamespace: 'default-namespace',
  supportedLanguages: ['project-languages'],
  additionalNamespaces: [],
  cachedTarjimData: cachedTarjimData,
  useSingleInstance: true,
  keyCase: 'lower', // or 'original' | 'preserve'
};

export default tarjimConfig;
```
</details>

<details>
<summary><strong>TypeScript</strong></summary>

```ts
// tarjimConfig.ts
import { TarjimClientConfig } from 'tarjim-react-client';
import { cachedTarjimData } from './path-to-cached-tarjim-json-file';

export const tarjimConfig: TarjimClientConfig = {
  projectId: 'tarjim-project-id',
  tarjimApikey: 'tarjim-api-key',
  defaultLanguage: 'default-language',
  defaultNamespace: 'default-namespace',
  supportedLanguages: ['project-languages'],
  additionalNamespaces: [],
  cachedTarjimData,
  useSingleInstance: true,
  keyCase: 'lower',
};
```
</details>

---

## Step 2: Initialize the client

```js
import TarjimClient from 'tarjim-react-client';

const tarjimClient = new TarjimClient(tarjimConfig);
```

You can listen for loading completion:

```js
tarjimClient.on('finishedLoadingTranslations', () => {
  // Translations are ready
});
```

---

## 💡 TarjimClient Functions

| Function                        | Description                                |
|--------------------------------|--------------------------------------------|
| `__T('key')`                   | Returns a `<span>` with the translated value |
| `__TS('key')`                  | Returns raw string value (no span)         |
| `__TM('key', attributes)`      | Returns attributes for `<img />`           |
| `__TSEO('key', { SEO })`      | Updates meta tags for SEO                  |
| `__TI('key')`                 | Translate image source                     |
| `__TD('key', config)`         | Get translation for all languages          |
| `getCurrentLocale()`          | Returns active locale                      |
| `setCurrentLocale('ar')`      | Sets active locale                         |
| `getIsLoadingTranslations()`  | Returns loading state                      |

---

## 🔄 Example: Using with Context Provider

<details>
<summary><strong>JavaScript</strong></summary>

```js
// context/LocalizationProvider.js
import React, { useState, useEffect, createContext } from 'react';
import { TarjimClient, tarjimFunctions } from 'tarjim-react-client';
import tarjimConfig from '../tarjimConfig';

export const LocalizationContext = createContext({
  ...tarjimFunctions,
  setCurrentLanguage: () => {},
  tarjimIsLoading: true,
});

export const LocalizationProvider = ({ children }) => {
  const [tarjimClient] = useState(new TarjimClient(tarjimConfig));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const language =
      localStorage.getItem('tarjimClientLanguage') || 'en';

    tarjimClient.setCurrentLocale(language);

    tarjimClient.on('finishedLoadingTranslations', () => {
      setIsLoading(false);
    });
  }, []);

  const setCurrentLanguage = (_locale) => {
    const result = tarjimClient.setCurrentLocale(_locale);
    localStorage.setItem('tarjimClientLanguage', _locale);
    return result;
  };

  return (
    <LocalizationContext.Provider
      value={{
        ...tarjimClient,
        setCurrentLanguage,
        tarjimIsLoading: isLoading,
      }}
    >
      {children}
    </LocalizationContext.Provider>
  );
};
```
</details>

<details>
<summary><strong>TypeScript</strong></summary>

```tsx
// context/LocalizationProvider.tsx
import React, {
  useState,
  useEffect,
  createContext,
  ReactNode,
} from 'react';
import { TarjimClient, TarjimClientConfig, tarjimFunctions } from 'tarjim-react-client';
import { tarjimConfig } from '../tarjimConfig';

interface LocalizationContextType {
  tarjimIsLoading: boolean;
  setCurrentLanguage: (_locale: string) => boolean;
  __T: (key: string, config?: any) => any;
  __TS: (key: string, config?: any) => string;
  __TM: (key: string, attrs?: Record<string, string>) => string;
  __TSEO: (key: string, config?: any) => any;
  __TI: (key: string, attrs?: Record<string, string>) => string;
  __TD: (key: string, config?: any) => any;
}

export const LocalizationContext = createContext<LocalizationContextType>({
  ...tarjimFunctions,
  setCurrentLanguage: () => false,
  tarjimIsLoading: true,
});

interface Props {
  children: ReactNode;
}

export const LocalizationProvider = ({ children }: Props) => {
  const [tarjimClient] = useState(() => new TarjimClient(tarjimConfig));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const language =
      localStorage.getItem('tarjimClientLanguage') || 'en';

    tarjimClient.setCurrentLocale(language);

    tarjimClient.on('finishedLoadingTranslations', () => {
      setIsLoading(false);
    });
  }, [tarjimClient]);

  const setCurrentLanguage = (_locale: string): boolean => {
    const result = tarjimClient.setCurrentLocale(_locale);
    localStorage.setItem('tarjimClientLanguage', _locale);
    return result;
  };

  return (
    <LocalizationContext.Provider
      value={{
        __T: tarjimClient.__T,
        __TS: tarjimClient.__TS,
        __TM: tarjimClient.__TM,
        __TSEO: tarjimClient.__TSEO,
        __TI: tarjimClient.__TI,
        __TD: tarjimClient.__TD,
        setCurrentLanguage,
        tarjimIsLoading: isLoading,
      }}
    >
      {children}
    </LocalizationContext.Provider>
  );
};
```
</details>

---

## Example: Using `__T` in components

```tsx
import { useContext } from 'react';
import { LocalizationContext } from './context/LocalizationProvider';

const MyComponent = () => {
  const { __T, setCurrentLanguage } = useContext(LocalizationContext);

  return (
    <>
      <h1>{__T('home.title')}</h1>
      <button onClick={() => setCurrentLanguage('fr')}>Français</button>
    </>
  );
};
```

---

## ✅ Tip: How to generate `cachedTarjimData`

Call this API and save `response.result.data`:

```
GET https://app.tarjim.io/api/v1/translationkeys/jsonByNameSpaces?project_id=XXX&namespace[]=default
```
