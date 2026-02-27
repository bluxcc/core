import { useState, useEffect } from 'react';

import { Route } from '../../../enums';
import Button from '../../../components/Button';
import { useLang } from '../../../hooks/useLang';
import Divider from '../../../components/Divider';
import CDNFiles from '../../../constants/cdnFiles';
import { BluxEvent } from '../../../utils/events';
import CDNImage from '../../../components/CDNImage';
import OTPInput from '../../../components/Input/OTPInput';
import { BLUX_JWT_STORE } from '../../../constants/consts';
import { getState, IUser, useAppStore } from '../../../store';
import loginResolver from '../../../stellar/processes/loginResolver';
import { setRecentLoginConfig } from '../../../utils/checkRecentLogins';
import { apiGetUser, apiSendOtp, apiVerifyOtp } from '../../../utils/api';

const OTP = () => {
  const t = useLang();
  const store = useAppStore((store) => store);

  const user = store.user;
  const appearance = store.config.appearance;

  const email = user?.authValue;
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState(false);

  const handleResendCode = async () => {
    try {
      await apiSendOtp(store.config.appId, store.user?.authValue || '');
    } catch (e) {
      // TODO
      // SHOW ERROR, SOMETHING FAILED AND IT IS THERE IN e.message.
    }
  };

  const verifyOTPRequest = async (otpString: string): Promise<void> => {
    setError(false);

    getState().emitter.emit(BluxEvent.LoginStarted, {
      method: 'email',
      authValue: store.user?.authValue,
    });

    try {
      const JWT = await apiVerifyOtp(
        store.config.appId,
        store.user as IUser,
        otpString,
      );

      if (JWT) {
        setError(false);

        localStorage.setItem(BLUX_JWT_STORE, JWT);
        setRecentLoginConfig('email', store.user?.authValue || '');

        store.setAuth({
          isAuthenticated: true,
          JWT,
        });

        const result = await apiGetUser(JWT);

        store.connectWalletSuccessful(
          result.public_key,
          store.stellar?.activeNetwork || '',
        );

        setTimeout(() => {
          store.setRoute(Route.SUCCESSFUL);

          setTimeout(() => {
            store.closeModal();

            loginResolver(store);

            store.setIsAuthenticated(true);

            const user = getState().user;

            if (user) {
              getState().emitter.emit(BluxEvent.Login, { user });
            }
          }, 1000);
        });
      }
    } catch (cause) {
      getState().emitter.emit(BluxEvent.LoginFailed, {
        message: 'Email login failed.',
        cause,
      });

      setError(true);

      setTimeout(() => setOtp(Array(6).fill('')), 1000);
    }
  };

  useEffect(() => {
    const otpValue = otp.join('');

    if (otpValue.length === 6) {
      verifyOTPRequest(otpValue);
    }
  }, [otp, email]);

  return (
    <div className="bluxcc:mt-4 bluxcc:flex bluxcc:w-full bluxcc:flex-col bluxcc:items-center bluxcc:justify-center bluxcc:select-none">
      <div
        style={{
          borderColor: appearance.borderColor,
          borderWidth: appearance.borderWidth,
        }}
        className="bluxcc:mb-6 bluxcc:flex bluxcc:h-20 bluxcc:w-20 bluxcc:items-center bluxcc:justify-center bluxcc:overflow-hidden bluxcc:rounded-full bluxcc:border-2"
      >
        <CDNImage
          name={CDNFiles.Email}
          props={{ fill: appearance.textColor }}
        />
      </div>

      <div className="bluxcc:flex-col bluxcc:space-y-1 bluxcc:text-center">
        <p className="bluxcc:text-xl bluxcc:font-medium">
          {t('enterConfirmationCodeTitle')}
        </p>
        {error ? (
          <p className="bluxcc:flex bluxcc:h-10 bluxcc:items-center bluxcc:justify-center bluxcc:text-sm bluxcc:text-alert-error">
            {t('invalidCodeError')}
          </p>
        ) : (
          <p className="bluxcc:h-10 bluxcc:text-sm">
            {t('enterConfirmationCodeHelp')}
          </p>
        )}
      </div>

      <div className="bluxcc:mt-6 bluxcc:text-center">
        <OTPInput otp={otp} setOtp={setOtp} error={error} />
      </div>

      <Divider />

      <Button
        size="medium"
        state="enabled"
        variant="text"
        onClick={handleResendCode}
        style={{
          color: appearance.accentColor,
        }}
      >
        {t('resendCode')}
      </Button>
    </div>
  );
};

export default OTP;
