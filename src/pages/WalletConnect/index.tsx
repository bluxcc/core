import { useEffect } from 'react';

import { useAppStore } from '../../store';
import Button from '../../components/Button';
import QRCode from '../../components/QRCode';
import { useLang } from '../../hooks/useLang';
import { SupportedWallet } from '../../enums';
import { walletsConfig } from '../../wallets';
import { copyText } from '../../utils/helpers';
import Divider from '../../components/Divider';
import { WalletConnectLogo } from '../../assets/Logos';
import connectWalletProcess from '../../stellar/processes/connectWalletProcess';

const WalletConnect = () => {
  const t = useLang();
  const store = useAppStore((store) => store);

  const appearance = store.config.appearance;

  useEffect(() => {
    const connect = async () => {
      connectWalletProcess(store, walletsConfig[SupportedWallet.WalletConnect]);
    };

    connect();
  }, []);

  const handleCopyURI = (uri: string) => {
    copyText(uri);

    store.setAlert('info', t('address_copied'));

    setTimeout(() => {
      store.setAlert('none', '');
    }, 1000);
  };

  if (!store.walletConnect) {
    return null;
  }

  const uri = store.walletConnect.connection.uri;

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
          imgSize={40}
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
