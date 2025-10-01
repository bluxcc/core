import { useAppStore } from '../../store';
import { hexToRgba } from '../../utils/helpers';
import { AboutIcon, ArrowLeft, Close } from '../../assets/Icons';
import Alert from '../Alert';

interface HeaderProps {
  icon?: 'info' | 'back';
  onInfo?: () => void;
  onBack?: () => void;
  title: string;
  closeButton?: boolean;
  onClose: () => void;
}

const Header = ({
  icon,
  onInfo,
  onBack,
  title,
  closeButton = false,
  onClose,
}: HeaderProps) => {
  const appearance = useAppStore((store) => store.config.appearance);
  const { modal } = useAppStore((store) => store);

  return (
    <div className="bluxcc:flex bluxcc:w-full bluxcc:items-center bluxcc:justify-between bluxcc:h-16">
      {icon === 'info' ? (
        <div
          onClick={onInfo}
          className="bluxcc:flex bluxcc:size-5 bluxcc:cursor-pointer bluxcc:items-center bluxcc:justify-center"
        >
          <AboutIcon fill={hexToRgba(appearance.textColor, 0.7)} />
        </div>
      ) : icon === 'back' ? (
        <div
          onClick={onBack}
          className="bluxcc:flex bluxcc:size-5 bluxcc:cursor-pointer bluxcc:items-center bluxcc:justify-center"
        >
          <ArrowLeft fill={hexToRgba(appearance.textColor, 0.7)} />
        </div>
      ) : (
        <div className="bluxcc:size-5" />
      )}

      <div className="bluxcc:flex bluxcc:justify-center bluxcc:items-center bluxcc:w-full">
        {modal.alert.type === 'none' ? (
          <p className="bluxcc:grow bluxcc:text-center bluxcc:text-base bluxcc:font-medium bluxcc:select-none">
            {title}
          </p>
        ) : (
          <div>
            <Alert type={modal.alert.type} message={modal.alert.message} />
          </div>
        )}
      </div>

      {closeButton ? (
        <div onClick={onClose} className="bluxcc:size-5 bluxcc:cursor-pointer">
          <Close fill={hexToRgba(appearance.textColor, 0.7)} />
        </div>
      ) : (
        <div className="bluxcc:size-5" />
      )}
    </div>
  );
};

export default Header;
