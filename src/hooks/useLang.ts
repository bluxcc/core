import { translate } from "../utils/helpers";
import { TranslationKey } from "../constants/locales";

export const useLang = () => {
  // const { value } = useProvider();
  // const lang = value.config.lang as LanguageKey;

  return (key: TranslationKey, vars?: Record<string, string>) =>
    translate(key, "en", vars || {});
};
