import { useLang } from '../../hooks/useLang';
import { useAppStore } from '../../store';

const PoweredByBlux = () => {
  const t = useLang();
  const appearance = useAppStore((store) => store.config.appearance);

  return (
    <div className="bluxcc:flex bluxcc:w-full bluxcc:items-center bluxcc:justify-center bluxcc:pt-4.25 bluxcc:text-center bluxcc:text-xs bluxcc:font-medium">
      <a
        aria-label="blux website"
        href="https://blux.cc"
        target="_blank"
        rel="noreferrer"
        className="bluxcc:inline-block bluxcc:text-center bluxcc:no-underline"
        style={{
          color: appearance.textColor,
          fontFamily: appearance.fontFamily,
        }}
      >
        {t('poweredByBlux')}
      </a>
    </div>
  );
};

export default PoweredByBlux;
