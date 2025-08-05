import type { EventEmitter } from 'eventemitter3';
import type React from 'react';

export interface TarjimClientConfig {
  useSingleInstance?: boolean;
  projectId: string;
  tarjimApikey: string;
  defaultLanguage: string;
  defaultNamespace: string;
  supportedLanguages: string[];
  additionalNamespaces?: string[];
  cachedTarjimData?: any;
  keyCase?: 'lower' | 'original' | 'preserve';
}

export interface TranslationConfig {
  namespace?: string;
  mappings?: Record<string, string>;
  subkey?: string;
  skipTid?: boolean;
  skipAssignTid?: boolean;
  SEO?: 'page_title' | 'open_graph' | 'twitter_card' | 'page_description';
}

export declare class TarjimClient extends EventEmitter {
  constructor(config: TarjimClientConfig);
  __T(key: string, config?: TranslationConfig): string | React.ReactNode;
  __TS(key: string, config?: TranslationConfig): string | React.ReactNode;
  __TM(key: string, attributes?: Record<string, any>): Record<string, any>;
  __TSEO(key: string, config?: TranslationConfig): void;
  __TI(key: string, attributes?: Record<string, any>): Record<string, any>;
  __TD(key: string, config?: TranslationConfig): Record<string, string> | Record<string, Record<string, string>>;

  getCurrentLocale(): string;
  setCurrentLocale(locale: string): boolean;
  getIsLoadingTranslations(): boolean;
}

export declare const tarjimFunctions: {
  __T: () => void;
  __TS: () => void;
  __TM: () => void;
  __TSEO: () => void;
  __TI: () => void;
  __TD: () => void;
  getCurrentLocale: () => void;
  setCurrentLocale: () => void;
  getIsLoadingTranslations: () => void;
};
