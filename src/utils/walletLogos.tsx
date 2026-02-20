import CDNImage from '../components/CDNImage';
import CDNFiles from '../constants/cdnFiles';

const handleLogos = (walletName: string, isDark: boolean) => {
  switch (walletName) {
    case 'Rabet':
      return (
        <CDNImage
          name={CDNFiles.Rabet}
          props={{ fill: isDark ? '#ffffff' : '#B8BAC4' }}
        />
      );
    case 'Freighter':
      return isDark ? (
        <CDNImage name={CDNFiles.DarkFreighter} props={{}} />
      ) : (
        <CDNImage name={CDNFiles.Freighter} props={{ fill: '#310CCC' }} />
      );
    case 'Albedo':
      return <CDNImage name={CDNFiles.Albedo} props={{}} />;
    case 'LOBSTR':
      return (
        <CDNImage
          name={CDNFiles.Lobstr}
          props={{ fill: isDark ? '#ffffff' : '#1a8da0' }}
        />
      );
    case 'xBull':
      return (
        <CDNImage
          name={CDNFiles.XBull}
          props={{ fill: isDark ? '#ffffff' : '#C19CFC' }}
        />
      );
    case 'Hana':
      return (
        <CDNImage
          name={CDNFiles.Hana}
          props={{ fill: isDark ? '#E6E0F7' : '#221542' }}
        />
      );
    case 'Hot':
      return <CDNImage name={CDNFiles.Hot} props={{}} />;
    case 'Wallet Connect':
      return (
        <CDNImage
          name={CDNFiles.WalletConnect}
          props={{ fill: isDark ? '#ffffff' : '#0988f1' }}
        />
      );
    case 'Klever':
      return <CDNImage name={CDNFiles.Klever} props={{}} />;
    case 'Ledger':
      return (
        <CDNImage
          name={CDNFiles.Ledger}
          props={{ fill: isDark ? '#ffffff' : '#000000' }}
        />
      );
    default:
      return null;
  }
};

export default handleLogos;
