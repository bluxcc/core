import React, { useState } from 'react';
import { Horizon, StrKey } from '@stellar/stellar-sdk';

import { Route } from '../../../enums';
import { useAppStore } from '../../../store';
import Button from '../../../components/Button';
import { useLang } from '../../../hooks/useLang';
import Divider from '../../../components/Divider';
import InputField from '../../../components/Input';
import CDNFiles from '../../../constants/cdnFiles';
import CDNImage from '../../../components/CDNImage';
import AssetLogo from '../../../components/AssetLogo';
import useMaxAmount from '../../../hooks/useMaxAmount';
import { sendTransaction } from '../../../exports/blux';
import { getContrastColor } from '../../../utils/helpers';
import paymentTransaction from '../../../stellar/paymentTransaction';

type SendFormValues = {
  memo: string;
  amount: string;
  address: string;
};

const SendForm = () => {
  const t = useLang();
  const store = useAppStore((store) => store);
  const [errors, setErrors] = useState<Partial<SendFormValues>>({});
  const [form, setForm] = useState<SendFormValues>({
    memo: '',
    amount: '',
    address: '',
  });

  const { appearance } = store.config;
  const handleChange =
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: '' }));
    };

  const handleOpenAssets = () => {
    store.setSelectAsset({
      ...store.selectAsset,
      field: 'send',
    });

    store.setRoute(Route.SELECT_ASSET);
  };

  // Most the account can actually send for the selected asset: balance minus
  // selling liabilities, and for XLM also minus the reserve and fee buffer.
  const maxAmount = useMaxAmount(store.selectAsset.sendAsset);

  const handleMaxClick = () => {
    setForm((prev) => ({ ...prev, amount: maxAmount }));
  };

  const handlePasteClick = async () => {
    const text = await navigator.clipboard.readText();

    setForm((prev) => ({ ...prev, address: text }));
  };

  const handleSubmit = async () => {
    const errorMessages: typeof errors = {};

    if (!form.amount) {
      errorMessages.amount = t('amountRequired');
    } else if (Number(form.amount) > Number(maxAmount)) {
      errorMessages.amount = t('amountExceedsBalance');
    }

    if (!form.address) {
      errorMessages.address = t('addressRequired');
    } else if (!StrKey.isValidEd25519PublicKey(form.address)) {
      errorMessages.address = t('addressInvalid');
    }

    setErrors(errorMessages);

    if (Object.keys(errorMessages).length === 0) {
      try {
        const xdr = await paymentTransaction(
          form.memo,
          form.amount,
          form.address,
          store.selectAsset.sendAsset,
          store.user?.address as string,
          store.stellar?.servers.horizon as Horizon.Server,
          store.stellar?.activeNetwork || '',
        );

        store.closeModal();

        setTimeout(() => {
          sendTransaction(xdr, { network: store.stellar?.activeNetwork || '' });
        }, 400);
      } catch (e: any) {
        errorMessages.address = e.message;

        setErrors(errorMessages);
      }
    }
  };

  return (
    <>
      <div>
        <div className="bluxcc:relative bluxcc:mb-1">
          <InputField
            autoFocus
            type="number"
            label={t('amount')}
            placeholder="0.00"
            value={form.amount}
            onChange={handleChange('amount')}
            error={errors.amount}
            customLabel={
              <button
                id="bluxcc-button"
                type="button"
                onClick={handleMaxClick}
                style={{
                  color: appearance.accentColor,
                  fontFamily: appearance.fontFamily,
                }}
                className="bluxcc:mr-2 bluxcc:inline-flex bluxcc:bg-transparent"
              >
                {t('max')}{' '}
                <CDNImage
                  name={CDNFiles.ArrowDropUp}
                  props={{ fill: appearance.accentColor }}
                />
              </button>
            }
            onButtonClick={handleOpenAssets}
            button={
              <span
                className="bluxcc:flex bluxcc:bg-transparent bluxcc:items-center bluxcc:gap-1 bluxcc:max-h-8"
                style={{
                  backgroundColor: appearance.fieldBackground,
                }}
              >
                <div
                  style={{
                    fontFamily: appearance.fontFamily,
                    background: appearance.background,
                    borderRadius: appearance.borderRadius,
                    borderColor: appearance.borderColor,
                    borderWidth: appearance.borderWidth,
                    color: appearance.textColor,
                  }}
                  className="bluxcc:flex bluxcc:mr-2 bluxcc:size-7 bluxcc:shrink-0 bluxcc:items-center bluxcc:justify-center bluxcc:overflow-hidden bluxcc:transition-[border-radius] bluxcc:duration-300"
                >
                  <AssetLogo
                    assetCode={store.selectAsset.sendAsset.assetCode}
                    assetIssuer={store.selectAsset.sendAsset.assetIssuer}
                    assetType={store.selectAsset.sendAsset.assetType}
                    fill={getContrastColor(appearance.fieldBackground)}
                  />
                </div>

                <span
                  style={{
                    fontFamily: appearance.fontFamily,
                    color: appearance.textColor,
                  }}
                >
                  {store.selectAsset.sendAsset.assetCode}
                </span>

                <CDNImage
                  name={CDNFiles.ArrowDropDown}
                  props={{ fill: appearance.accentColor }}
                />
              </span>
            }
          />
        </div>

        <div className="bluxcc:mb-1">
          <InputField
            label={t('to')}
            placeholder={t('enterAddress')}
            value={form.address}
            onChange={handleChange('address')}
            error={errors.address}
            button={t('paste')}
            onButtonClick={handlePasteClick}
          />
        </div>

        <div>
          <InputField
            optionalField
            label={t('memo')}
            placeholder={t('enterMemo')}
            value={form.memo}
            onChange={handleChange('memo')}
          />
        </div>

        <Divider />

        <Button
          size="large"
          variant="outline"
          state="enabled"
          onClick={handleSubmit}
        >
          {t('sendButton')}
        </Button>
      </div>
    </>
  );
};

export default SendForm;
