import { useAppStore } from '../../store';
import CDNFiles from '../../constants/cdnFiles';
import CDNImage from '../../components/CDNImage';

// todo: check
const AcceptTermsAndPrivacy = () => {
  const store = useAppStore((store) => store);

  const conditions = [];

  const terms = store.apiResponse!.terms;
  const privacyPolicy = store.apiResponse!.privacyPolicy;

  if (terms) {
    conditions.push({
      logo: CDNFiles.ArrowDropDown,
      title: 'Terms',
      url: terms,
    });
  }

  if (privacyPolicy) {
    conditions.push({
      logo: CDNFiles.ArrowDropDown,
      title: 'Privacy Policy',
      url: privacyPolicy,
    });
  }

  // todo: fix the styling, :hover, :active, etc..
  return (
    <div>
      {conditions.map((c) => (
        <a href={c.url} target="_blank">
          <div>
            <CDNImage name={c.logo} />

            <p>{c.title}</p>
          </div>
        </a>
      ))}
    </div>
  );
};

export default AcceptTermsAndPrivacy;
