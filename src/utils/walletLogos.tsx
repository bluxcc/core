import {
  BitGetLogo,
  OneKeyLogo,
  CactusLinkLogo,
  FordefiLogo,
  TrezorLogo,
  MetaMaskLogo,
} from '../assets';
import { VarialLogo } from '../assets/VarialLogo';
import CDNImage from '../components/CDNImage';
import CDNFiles from '../constants/cdnFiles';
import { SupportedWallet } from '../enums';

const handleLogos = (
  wallet: SupportedWallet,
  isDark: boolean,
  size: 'small' | 'large' = 'small',
) => {
  const smallStyle =
    'bluxcc:flex bluxcc:justify-center bluxcc:items-center bluxcc:size-10!';
  switch (wallet) {
    case SupportedWallet.MetaMask:
      return <MetaMaskLogo />;
    case 'Rabet':
      return (
        <CDNImage
          className={size === 'small' ? smallStyle : ''}
          name={CDNFiles.Rabet}
          props={{ fill: isDark ? '#ffffff' : '#B8BAC4' }}
        />
      );
    case SupportedWallet.Freighter:
      return <VarialLogo />;
    case 'Albedo':
      return (
        <CDNImage
          className={size === 'small' ? smallStyle : ''}
          name={CDNFiles.Albedo}
          props={{}}
        />
      );
    case SupportedWallet.Lobstr:
      return (
        <CDNImage
          className={size === 'small' ? smallStyle : ''}
          name={CDNFiles.Lobstr}
          props={{ fill: isDark ? '#ffffff' : '#1a8da0' }}
        />
      );
    case SupportedWallet.Xbull:
      return (
        <CDNImage
          className={size === 'small' ? smallStyle : ''}
          name={CDNFiles.XBull}
          props={{ fill: isDark ? '#ffffff' : '#C19CFC' }}
        />
      );
    case SupportedWallet.Hana:
      return (
        <CDNImage
          className={size === 'small' ? smallStyle : ''}
          name={CDNFiles.Hana}
          props={{ fill: isDark ? '#E6E0F7' : '#221542' }}
        />
      );
    case SupportedWallet.Hot:
      return (
        <CDNImage
          className={size === 'small' ? smallStyle : ''}
          name={CDNFiles.Hot}
          props={{}}
        />
      );
    case SupportedWallet.WalletConnect:
      return (
        <CDNImage
          className={size === 'small' ? smallStyle : ''}
          name={CDNFiles.WalletConnect}
          props={{ fill: isDark ? '#ffffff' : '#0988f1' }}
        />
      );
    case SupportedWallet.Klever:
      return (
        <CDNImage
          className={size === 'small' ? smallStyle : ''}
          name={CDNFiles.Klever}
          props={{}}
        />
      );
    //todo
    case SupportedWallet.Bitget:
      return (
        <BitGetLogo fill={isDark ? '#05C3DD' : '#00F0FF'} />
        // <CDNImage
        //   className={size === 'small' ? smallStyle : ''}
        //   name={CDNFiles.Klever}
        //   props={{}}
        // />
      );
    //todo
    case SupportedWallet.Onekey:
      return (
        <OneKeyLogo />
        // <CDNImage
        //   className={size === 'small' ? smallStyle : ''}
        //   name={CDNFiles.Klever}
        //   props={{}}
        // />
      );
    case SupportedWallet.Ledger:
      return (
        <CDNImage
          className={size === 'small' ? smallStyle : ''}
          name={CDNFiles.Ledger}
          props={{ fill: isDark ? '#ffffff' : '#000000' }}
        />
      );
    //todo
    case SupportedWallet.CactusLink:
      return <CactusLinkLogo />;
    //todo
    case SupportedWallet.Fordefi:
      return <FordefiLogo />;
    //todo
    case SupportedWallet.Trezor:
      return <TrezorLogo fill={isDark ? '#ffffff' : '#171717'} />;
    default:
      return null;
  }
};

export default handleLogos;
