import {
  HotLogo,
  HanaLogo,
  RabetLogo,
  XBullLogo,
  LobstrLogo,
  AlbedoLogo,
  FreighterLogo,
  WalletConnectLogo,
} from '../assets/Logos';

const handleLogos = (walletName: string, isDark: boolean) => {
  switch (walletName) {
    case 'Rabet':
      return <RabetLogo fill={isDark ? '#ffffff' : '#B8BAC4'} />;
    case 'Freighter':
      return <FreighterLogo fill={isDark ? '#7863FF' : '#310CCC'} />;
    case 'Albedo':
      return <AlbedoLogo />;
    case 'LOBSTR':
      return <LobstrLogo fill={isDark ? '#ffffff' : '#1a8da0'} />;
    case 'xBull':
      return <XBullLogo fill={isDark ? '#FFFFFF' : '#C19CFC'} />;
    case 'Hana':
      return <HanaLogo fill={isDark ? '#E6E0F7' : '#221542'} />;
    case 'Hot':
      return <HotLogo />;
    case 'WalletConnect':
      return <WalletConnectLogo fill={isDark ? '#ffffff' : '#0988f1'} />;
    default:
      return null;
  }
};

export default handleLogos;
