import React, { useState } from 'react';
import { StrKey } from '@stellar/stellar-sdk';
import { HorizonServer } from '@stellar/stellar-sdk/lib/horizon/server';

import { Route } from '../../../enums';
import { useAppStore } from '../../../store';
import Button from '../../../components/Button';
import { useLang } from '../../../hooks/useLang';
import Divider from '../../../components/Divider';
import InputField from '../../../components/Input';
import { ArrowDropUp, QuestionMark } from '../../../assets/Icons';
import { sendTransaction } from '../../../exports/blux';
import { StellarSmallLogo } from '../../../assets/Logos';
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

  const handleChange =
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: '' }));
    };

  const handleOpenAssets = () => {
    store.setSelectAsset({
      ...store.selectAsset,
      for: 'send',
    });

    store.setRoute(Route.SELECT_ASSET);
  };

  const handleMaxClick = () => {
    const balance = Number(store.selectAsset.asset.assetBalance).toString();

    setForm((prev) => ({ ...prev, amount: balance }));
  };

  const handlePasteClick = async () => {
    const text = await navigator.clipboard.readText();

    setForm((prev) => ({ ...prev, address: text }));
  };

  const handleSubmit = async () => {
    const errorMessages: typeof errors = {};

    if (!form.amount) {
      errorMessages.amount = t('amountRequired');
    } else if (
      Number(form.amount) > Number(store.selectAsset.asset.assetBalance || '0')
    ) {
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
          store.selectAsset.asset,
          store.user?.address as string,
          store.stellar?.servers.horizon as HorizonServer,
          store.stellar?.activeNetwork || '',
        );

        store.closeModal();

        setTimeout(() => {
          sendTransaction(xdr, { network: store.stellar?.activeNetwork || '' });
        }, 250);
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
              <span
                onClick={handleMaxClick}
                style={{ color: store.config.appearance.accentColor }}
                className="bluxcc:mr-2 bluxcc:inline-flex bluxcc:cursor-pointer"
              >
                {t('max')}{' '}
                <ArrowDropUp fill={store.config.appearance.accentColor} />
              </span>
            }
            onButtonClick={handleOpenAssets}
            button={
              <span className="bluxcc:flex bluxcc:justify-between bluxcc:!gap-1">
                <span className="bluxcc:flex bluxcc:items-center">
                  {store.selectAsset.asset.assetType === 'native' ? (
                    <StellarSmallLogo
                      fill={getContrastColor(
                        store.config.appearance.background,
                      )}
                    />
                  ) : (
                    <QuestionMark
                      fill={getContrastColor(
                        store.config.appearance.fieldBackground,
                      )}
                    />
                  )}
                </span>
                {store.selectAsset.asset.assetCode}
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
