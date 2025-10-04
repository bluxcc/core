import {
  HotLogo,
  HanaLogo,
  RabetLogo,
  XBullLogo,
  LobstrLogo,
  AlbedoLogo,
  FreighterLogo,
  WalletConnectLogo,
  KleverLogo,
  DarkFreighterLogo,
} from '../assets/Logos';

const handleLogos = (walletName: string, isDark: boolean) => {
  switch (walletName) {
    case 'Rabet':
      return <RabetLogo fill={isDark ? '#ffffff' : '#B8BAC4'} />;
    case 'Freighter':
      return isDark ? (
        <DarkFreighterLogo />
      ) : (
        <FreighterLogo fill={'#310CCC'} />
      );
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
    case 'Wallet Connect':
      return <WalletConnectLogo fill={isDark ? '#ffffff' : '#0988f1'} />;
    case 'Klever':
      return <KleverLogo />;
    default:
      return null;
  }
};

export default handleLogos;
