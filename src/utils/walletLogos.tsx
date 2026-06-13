import {
  BitGetLogo,
  OneKeyLogo,
  CactusLinkLogo,
  FordefiLogo,
  TrezorLogo,
} from '../assets';
import CDNImage from '../components/CDNImage';
import CDNFiles from '../constants/cdnFiles';

const handleLogos = (
  walletName: string,
  isDark: boolean,
  size: 'small' | 'large' = 'small',
) => {
  const smallStyle =
    'bluxcc:flex bluxcc:justify-center bluxcc:items-center bluxcc:size-10!';
  switch (walletName) {
    case 'Rabet':
      return (
        <CDNImage
          className={size === 'small' ? smallStyle : ''}
          name={CDNFiles.Rabet}
          props={{ fill: isDark ? '#ffffff' : '#B8BAC4' }}
        />
      );
    case 'Freighter':
      return isDark ? (
        <CDNImage
          className={size === 'small' ? smallStyle : ''}
          name={CDNFiles.DarkFreighter}
          props={{}}
        />
      ) : (
        <CDNImage
          className={size === 'small' ? smallStyle : ''}
          name={CDNFiles.Freighter}
          props={{ fill: '#310CCC' }}
        />
      );
    case 'Albedo':
      return (
        <CDNImage
          className={size === 'small' ? smallStyle : ''}
          name={CDNFiles.Albedo}
          props={{}}
        />
      );
    case 'LOBSTR':
      return (
        <CDNImage
          className={size === 'small' ? smallStyle : ''}
          name={CDNFiles.Lobstr}
          props={{ fill: isDark ? '#ffffff' : '#1a8da0' }}
        />
      );
    case 'xBull':
      return (
        <CDNImage
          className={size === 'small' ? smallStyle : ''}
          name={CDNFiles.XBull}
          props={{ fill: isDark ? '#ffffff' : '#C19CFC' }}
        />
      );
    case 'Hana':
      return (
        <CDNImage
          className={size === 'small' ? smallStyle : ''}
          name={CDNFiles.Hana}
          props={{ fill: isDark ? '#E6E0F7' : '#221542' }}
        />
      );
    case 'Hot':
      return (
        <CDNImage
          className={size === 'small' ? smallStyle : ''}
          name={CDNFiles.Hot}
          props={{}}
        />
      );
    case 'Wallet Connect':
      return (
        <CDNImage
          className={size === 'small' ? smallStyle : ''}
          name={CDNFiles.WalletConnect}
          props={{ fill: isDark ? '#ffffff' : '#0988f1' }}
        />
      );
    case 'Klever':
      return (
        <CDNImage
          className={size === 'small' ? smallStyle : ''}
          name={CDNFiles.Klever}
          props={{}}
        />
      );
    //todo
    case 'Bitget':
      return (
        <BitGetLogo fill={isDark ? '#05C3DD' : '#00F0FF'} />
        // <CDNImage
        //   className={size === 'small' ? smallStyle : ''}
        //   name={CDNFiles.Klever}
        //   props={{}}
        // />
      );
    //todo
    case 'Onekey':
      return (
        <OneKeyLogo />
        // <CDNImage
        //   className={size === 'small' ? smallStyle : ''}
        //   name={CDNFiles.Klever}
        //   props={{}}
        // />
      );
    case 'Ledger':
      return (
        <CDNImage
          className={size === 'small' ? smallStyle : ''}
          name={CDNFiles.Ledger}
          props={{ fill: isDark ? '#ffffff' : '#000000' }}
        />
      );
    //todo
    case 'Cactus Link':
      return <CactusLinkLogo />;
    //todo
    case 'Fordefi':
      return <FordefiLogo />;
    //todo
    case 'Trezor':
      return <TrezorLogo fill={isDark ? '#ffffff' : '#171717'} />;
    default:
      return null;
  }
};

export default handleLogos;
