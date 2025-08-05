declare module 'tarjim-react-client' {
  import { EventEmitter } from 'eventemitter3';
  import { ReactNode } from 'react';

  export interface TarjimClientConfig {
    projectId: string;
    tarjimApikey: string;
    defaultLanguage: string;
    defaultNamespace: string;
    supportedLanguages: string[];
    additionalNamespaces?: string[];
    cachedTarjimData?: any;
    useSingleInstance?: boolean;
    keyCase?:string;
  }

  export class TarjimClient extends EventEmitter {
    constructor(config: TarjimClientConfig);
    setCurrentLocale(locale: string): boolean;
    getCurrentLocale(): string;
    getIsLoadingTranslations(): boolean;
    __T(key: string, config?: any): string | ReactNode;
    __TS(key: string, config?: any): string;
    __TM(key: string, attrs?: Record<string, string>): any;
    __TSEO(key: string, config?: any): void;
    __TI(key: string, attrs?: any): any;
    __TD(key: string, config?: any): Record<string, any>;
  }

  export const tarjimFunctions: {
    __T: (key: string, config?: any) => string | ReactNode;
    __TS: (key: string, config?: any) => string | ReactNode;
    __TM: (key: string, attrs?: Record<string, string>) => any;
    __TSEO: (key: string, config?: any) => void | ReactNode;
    __TI: (key: string, attrs?: any) => any | ReactNode;
    __TD: (key: string, config?: any) => Record<string, any>;
    getCurrentLocale: () => string;
    setCurrentLocale: (locale: string) => boolean;
    getIsLoadingTranslations: () => boolean;
  };

  export const version: string;
}
