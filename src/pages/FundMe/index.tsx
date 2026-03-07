import { Route } from '../../enums';
import { useAppStore } from '../../store';
import CDNFiles from '../../constants/cdnFiles';
import CDNImage from '../../components/CDNImage';

type IFund = {
  title: string;
  route?: Route;
  logo: CDNFiles;
  url?: string;
};

// todo: check
function FundMe() {
  const store = useAppStore((store) => store);

  const fundOptions: IFund[] = [
    {
      logo: CDNFiles.ArrowDropUp,
      title: 'Moonpay',
      url:
        'https://moonpay.com' +
        store.user?.address +
        'token=xlm&network=stellar',
    },
    {
      logo: CDNFiles.ArrowLeft,
      title: 'Get fund by crypto',
      route: Route.FUND_ME_CRYPTO,
    },
  ];

  const handleFundRoute = (f: IFund) => {
    if (f.url) {
      window.open(f.url, 'blank');
    } else if (f.route) {
      store.openModal(f.route);
    }
  };

  return (
    <div>
      {fundOptions.map((f) => (
        <div
          onClick={() => {
            handleFundRoute(f);
          }}
        >
          <CDNImage name={f.logo} />

          <p>{f.title}</p>
        </div>
      ))}
    </div>
  );
}

export default FundMe;
