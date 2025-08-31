import { translate } from "../utils/translate";
import { TranslationKey } from "../constants/locales";

export const useLang = () => {
  const lang = "es";

  return (key: TranslationKey, vars?: Record<string, string>) =>
    translate(key, lang, vars || {});
};
