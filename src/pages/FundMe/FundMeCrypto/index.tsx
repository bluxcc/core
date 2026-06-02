import { useAppStore } from '../../../store';
import QRCode from '../../../components/QRCode';
import { useLang } from '../../../hooks/useLang';
import CDNFiles from '../../../constants/cdnFiles';
import CDNImage from '../../../components/CDNImage';
import {
  copyText,
  hexToRgba,
  humanizeAmount,
  shortenAddress,
} from '../../../utils/helpers';

const FundMeCrypto = () => {
  const t = useLang();
  const store = useAppStore((store) => store);
  const appearance = store.config.appearance;
  const address = store.user?.address as string;
  const balances = store.balances.balances;
  let xlmAmount = '0';

  const { setAlert } = store;

  const xlmAsset = balances.find((x) => x.asset_type === 'native');

  if (xlmAsset) {
    xlmAmount = xlmAsset.balance;
  }

  // todo: add page texts to locales.ts

  const handleCopyAddress = () => {
    copyText(address)
      .then(() => {
        copyText(address);
        setAlert('copy', 'Address Copied');
        setTimeout(() => {
          setAlert('none', '');
        }, 1000);
      })
      .catch(() => {});
  };

  return (
    <div className="bluxcc:flex bluxcc:w-full bluxcc:flex-col bluxcc:items-center bluxcc:justify-center bluxcc:text-center">
      <div
        className={`bluxcc:mt-4 bluxcc:flex bluxcc:size-52 bluxcc:items-center bluxcc:justify-center`}
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
          value={address}
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
            background: appearance.background,
          }}
        >
          <CDNImage
            name={CDNFiles.SmallBlux}
            props={{
              fill: appearance.accentColor,
              background: appearance.fieldBackground,
            }}
          />
        </div>
      </div>

      <p
        style={{
          color: appearance.textColor,
        }}
        className="bluxcc:my-4"
      >
        Scan this QR code or copy your wallet address to receive payments
      </p>
      <div
        className="bluxcc:px-2.5 bluxcc:py-3 bluxcc:w-full"
        style={{
          color: appearance.textColor,
          borderColor: appearance.borderColor,
          borderWidth: appearance.borderWidth,
          borderRadius: appearance.borderRadius,
          backgroundColor: appearance.fieldBackground,
        }}
      >
        <div className="bluxcc:py-2 bluxcc:font-medium bluxcc:flex bluxcc:text-sm bluxcc:justify-between bluxcc:items-center">
          <span className="">Your Address</span>

          <span
            className="bluxcc:flex bluxcc:justify-center bluxcc:items-center bluxcc:gap-1 bluxcc:text-[15px]"
            style={{
              color: hexToRgba(appearance.accentColor, 0.7),
            }}
            onClick={handleCopyAddress}
          >
            {address ? shortenAddress(address, 5) : ''}
            <CDNImage
              name={CDNFiles.Copy}
              props={{ fill: hexToRgba(appearance.accentColor, 0.7) }}
            />
          </span>
        </div>

        <div
          className="bluxcc:my-2"
          style={{
            borderRadius: appearance.borderRadius,
            borderTop: `${appearance.borderWidth} dashed ${appearance.borderColor}`,
          }}
        />

        <div className="bluxcc:py-2 bluxcc:font-medium bluxcc:flex bluxcc:text-sm bluxcc:justify-between bluxcc:items-center">
          <span className="">Your Balance</span>

          <span
            style={{
              color: hexToRgba(appearance.textColor, 0.7),
            }}
          >
            {humanizeAmount(xlmAsset?.balance as string)} XLM
          </span>
        </div>
      </div>
    </div>
  );
};

export default FundMeCrypto;
