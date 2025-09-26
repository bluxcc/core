import { useEffect, useState } from 'react';
import Button from '../../components/Button';
import Divider from '../../components/Divider';
import QRCode from '../../components/QRCode';
import { useLang } from '../../hooks/useLang';
import { store, useAppStore } from '../../store';

import { Core } from '@walletconnect/core';

import { WalletConnectLogo } from '../../assets/Logos';
import { copyText } from '../../utils/helpers';

const WalletConnect = () => {
  const t = useLang();
  const store = useAppStore((store) => store);
  const { setAlert } = useAppStore((store) => store);
  const appearance = store.config.appearance;
  const [uri, setUri] = useState('');

  const handleCopyURI = (uri: string) => {
    copyText(uri);
    setAlert('info', t('address_copied'));
    setTimeout(() => {
      setAlert('none', '');
    }, 1000);
  };
  useEffect(() => {
    const core = new Core({ projectId: store.config.walletConnect?.projectId });
  }, []);

  return (
    <div className="bluxcc:flex bluxcc:w-full bluxcc:flex-col bluxcc:items-center bluxcc:justify-center bluxcc:text-center">
      <div
        className={`bluxcc:mt-4 bluxcc:flex bluxcc:size-[208px] bluxcc:items-center bluxcc:justify-center`}
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
          value={uri}
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
            backgroundColor: appearance.background,
          }}
        >
          <WalletConnectLogo
            fill={appearance.accentColor}
            background={appearance.fieldBackground}
          />
        </div>
      </div>
      <div className="bluxcc:mt-4 bluxcc:font-medium">
        <p className="bluxcc:text-lg">Scan this QR code with your phone</p>
      </div>
      <Divider />
      <Button
        size="large"
        state="enabled"
        variant="tonal"
        style={{
          color: appearance.accentColor,
        }}
        onClick={() => handleCopyURI(uri)}
      >
        Copy URI
      </Button>
    </div>
  );
};

export default WalletConnect;
