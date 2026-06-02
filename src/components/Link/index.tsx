import { useAppStore } from '../../store';

type ProfileItemProps = {
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
};
const Link = ({ label, icon, href, onClick }: ProfileItemProps) => {
  const store = useAppStore((store) => store);
  const { appearance } = store.config;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="bluxcc:flex bluxcc:no-underline bluxcc:items-center bluxcc:justify-between bluxcc:w-full bluxcc:h-12 bluxcc:px-4 bluxcc:py-3 bluxcc:my-1 bluxcc:text-sm bluxcc:font-medium bluxcc:cursor-pointer"
      style={{
        color: appearance.textColor,
        fontFamily: appearance.fontFamily,
        borderColor: appearance.borderColor,
        borderWidth: appearance.borderWidth,
        borderRadius: appearance.borderRadius,
        backgroundColor: appearance.fieldBackground,
      }}
    >
      <span>{label}</span>
      {icon}
    </a>
  );
};
export default Link;
