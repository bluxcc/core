import React, { useState } from 'react';

import { useAppStore } from '../../../../store';
import Button from '../../../../components/Button';
import { useLang } from '../../../../hooks/useLang';
import Divider from '../../../../components/Divider';
import InputField from '../../../../components/Input';
import CDNImage from '../../../../components/CDNImage';
import { humanizeAmount } from '../../../../utils/helpers';
import CDNFiles from '../../../../constants/cdnFiles';

const AddToken = () => {
  const t = useLang();
  const [form, setForm] = useState({
    address: '',
  });
  const [errors, setErrors] = useState({});

  let asset = {
    logo: <CDNImage name={CDNFiles.Stellar} props={{}} />,
    name: 'xlm',
    valueInCurrency: 203,
  };

  const appearance = useAppStore((store) => store.config.appearance);

  const handleChange =
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: '' }));
    };
  const handleButtonClick = () => { };

  return (
    <div>
      <InputField
        autoFocus
        type="text"
        label={t('enter_token_address')}
        placeholder={t('enter_address')}
        value={form.address}
        onChange={handleChange('address')}
        onButtonClick={handleButtonClick}
        button={
          <span
            style={{ color: appearance.accentColor }}
            className="bluxcc:flex bluxcc:justify-between"
          >
            {t('check')}
          </span>
        }
      />
      <div
        className="bluxcc:h-56 bluxcc:my-4"
        style={{
          borderRadius: appearance.borderRadius,
          border: `${appearance.borderWidth} solid ${appearance.borderColor}`,
        }}
      >
        <div className="bluxcc:flex bluxcc:flex-col bluxcc:items-center bluxcc:justify-center bluxcc:gap-2">
          <div
            className="bluxcc:size-14 bluxcc:flex bluxcc:items-center bluxcc:justify-center bluxcc:rounded-full bluxcc:border"
            style={{
              borderColor: appearance.borderColor,
              borderWidth: appearance.borderWidth,
            }}
          >
            {asset.logo}
          </div>
          {asset.name}
          <div className="bluxcc:flex bluxcc:flex-col">
            <span
              className="bluxcc:text-2xl bluxcc:font-medium"
              style={{ color: appearance.accentColor }}
            >
              ${humanizeAmount(asset.valueInCurrency)}
            </span>
          </div>
        </div>
      </div>
      <Divider />
      <div className="bluxcc:flex bluxcc:gap-4">
        <Button state="disabled" variant="outline">
          {t('cancel')}
        </Button>

        <Button state="enabled" variant="fill" size="large">
          {t('add_token')}
        </Button>
      </div>
    </div>
  );
};

export default AddToken;
