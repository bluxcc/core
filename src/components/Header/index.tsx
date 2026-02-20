import Alert from '../Alert';
import CDNImage from '../CDNImage';
import { useAppStore } from '../../store';
import { useLang } from '../../hooks/useLang';
import { hexToRgba } from '../../utils/helpers';
import CDNFiles from '../../constants/cdnFiles';

interface HeaderProps {
  icon?: 'info' | 'back';
  onInfo?: () => void;
  onBack?: () => void;
  title?: string;
  isPersistent?: boolean;
  closeButton?: boolean;
  onClose: () => void;
}

const Header = ({
  icon,
  onInfo,
  onBack,
  title = ' ',
  closeButton = false,
  onClose,
  isPersistent,
}: HeaderProps) => {
  const config = useAppStore((state) => state.config);
  const modal = useAppStore((state) => state.modal);

  const t = useLang();
  const textColor = hexToRgba(config.appearance.textColor, 0.7);
  const showAlert = modal.alert.type !== 'none';

  const IconWrapper = ({
    onClick,
    children,
  }: {
    onClick?: () => void;
    children: React.ReactNode;
  }) => (
    <button
      id="bluxcc-button"
      onClick={onClick}
      className="bluxcc:flex bluxcc:size-5 bluxcc:items-center bluxcc:justify-center bluxcc:bg-transparent"
    >
      {children}
    </button>
  );

  const showLeftIcon = () => {
    if (icon === 'info')
      return (
        <IconWrapper onClick={onInfo}>
          <CDNImage name={CDNFiles.About} props={{ fill: textColor }} />
        </IconWrapper>
      );
    if (icon === 'back')
      return (
        <IconWrapper onClick={onBack}>
          <CDNImage name={CDNFiles.ArrowLeft} props={{ fill: textColor }} />
        </IconWrapper>
      );
    return <div className="bluxcc:size-5" />;
  };

  const showRightIcon = () => {
    if (!closeButton || isPersistent) return <div className="bluxcc:size-5" />;

    return (
      <IconWrapper onClick={onClose}>
        <CDNImage name={CDNFiles.Close} props={{ fill: textColor }} />
      </IconWrapper>
    );
  };

  return (
    <header
      className="bluxcc:flex bluxcc:h-16 bluxcc:w-full bluxcc:items-center bluxcc:justify-between"
      style={{ fontFamily: config.appearance.fontFamily }}
    >
      {showLeftIcon()}

      <div className="bluxcc:flex bluxcc:w-full bluxcc:items-center bluxcc:justify-center">
        {showAlert ? (
          <Alert type={modal.alert.type} message={modal.alert.message} />
        ) : (
          <p className="bluxcc:grow bluxcc:select-none bluxcc:text-center bluxcc:text-base bluxcc:font-medium">
            {t(title)}
          </p>
        )}
      </div>

      {showRightIcon()}
    </header>
  );
};

export default Header;
