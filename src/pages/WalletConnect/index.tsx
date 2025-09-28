import { useAppStore } from '../../store';
import Button from '../../components/Button';
import QRCode from '../../components/QRCode';
import { useLang } from '../../hooks/useLang';
import Divider from '../../components/Divider';
import {
  copyText,
  getWalletNetwork,
  setRecentConnectionMethod,
} from '../../utils/helpers';
import { WalletConnectLogo } from '../../assets/Logos';
import { IStore } from '../../store';
import { useEffect } from 'react';
import { Route } from '../../enums';
import { walletConnectConfig } from '../../wallets/walletConnect';

const WalletConnect = () => {
  const t = useLang();
  const store = useAppStore((store) => store);

  const appearance = store.config.appearance;

  useEffect(() => {
    const connect = async () => {
      // store.connectWallet('WalletConnect');

      try {
        const { publicKey } = await walletConnectConfig.connect();

        if (publicKey && publicKey.trim() !== '') {
          const passphrase = await getWalletNetwork(walletConnectConfig);

          store.connectWalletSuccessful(publicKey, passphrase);

          setRecentConnectionMethod(walletConnectConfig.name);

          setTimeout(() => {
            store.setRoute(Route.SUCCESSFUL);
          }, 500);
        }
      } catch {
        store.setRoute(Route.FAILED);
      }
    };

    connect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopyURI = (uri: string) => {
    copyText(uri);

    store.setAlert('info', t('address_copied'));

    setTimeout(() => {
      store.setAlert('none', '');
    }, 1000);
  };

  if (!store.walletConnect) {
    // TODO: fix this
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
