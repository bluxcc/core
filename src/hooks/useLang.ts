import { useAppStore } from '../store';
import { LanguageKey } from '../types';
import { translate } from '../utils/helpers';
import { TranslationKey } from '../constants/locales';

export const useLang = () => {
  const lang = useAppStore((store) => store.config.lang) as LanguageKey;

  return (key: TranslationKey, vars?: Record<string, string>) =>
    translate(key, lang || 'en', vars || {});
};
