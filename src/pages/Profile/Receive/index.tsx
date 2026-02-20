import { useAppStore } from '../../../store';
import Button from '../../../components/Button';
import QRCode from '../../../components/QRCode';
import { useLang } from '../../../hooks/useLang';
import Divider from '../../../components/Divider';
import CDNFiles from '../../../constants/cdnFiles';
import CDNImage from '../../../components/CDNImage';
import { copyText, hexToRgba } from '../../../utils/helpers';

const Receive = () => {
  const t = useLang();
  const store = useAppStore((store) => store);
  const { setAlert } = useAppStore((store) => store);
  const appearance = store.config.appearance;
  const address = store.user?.address as string;

  const handleCopyAddress = () => {
    copyText(address);
    setAlert('copy', t('address_copied'));
    setTimeout(() => {
      setAlert('none', '');
    }, 1000);
  };

  return (
    <div className="bluxcc:flex bluxcc:w-full bluxcc:flex-col bluxcc:items-center bluxcc:justify-center bluxcc:text-center">
      <div
        className={`bluxcc:mt-4 bluxcc:flex bluxcc:size-52 bluxcc:items-center bluxcc:justify-center`}
        style={{
          position: 'relative',
          borderRadius: appearance.borderRadius,
          color: appearance.textColor,
          borderColor: appearance.borderColor,
          backgroundColor: appearance.fieldBackground,
          borderWidth: appearance.borderWidth,
        }}
      >
        <QRCode
          size={184}
          value={address}
          bgColor={appearance.fieldBackground}
          fgColor={appearance.accentColor}
          level="Q"
        />
        <div
          className="bluxcc:z-20"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: appearance.background,
          }}
        >
          <CDNImage
            name={CDNFiles.SmallBlux}
            props={{
              fill: appearance.accentColor,
              background: appearance.fieldBackground,
            }}
          />
        </div>
      </div>

      <div className="bluxcc:mt-4 bluxcc:space-y-2 bluxcc:font-medium">
        <p className="bluxcc:text-lg">Your Address</p>
        <div
          className="bluxcc:w-full bluxcc:px-2.5 bluxcc:py-3 bluxcc:h-14"
          style={{
            borderRadius: appearance.borderRadius,
            color: appearance.textColor,
            borderColor: appearance.borderColor,
            backgroundColor: appearance.fieldBackground,
            borderWidth: appearance.borderWidth,
          }}
        >
          <p
            className="bluxcc:w-73 bluxcc:text-sm bluxcc:leading-4! bluxcc:break-all"
            style={{
              color: hexToRgba(appearance.textColor, 0.7),
            }}
          >
            {address}
          </p>
        </div>
      </div>

      <Divider />

      <Button
        size="large"
        state="enabled"
        variant="tonal"
        style={{
          color: appearance.accentColor,
        }}
        onClick={handleCopyAddress}
        endIcon={
          <CDNImage
            name={CDNFiles.LargeCopy}
            props={{
              fill: appearance.accentColor,
            }}
          />
        }
      >
        {t('copy_address')}
      </Button>
    </div>
  );
};

export default Receive;
