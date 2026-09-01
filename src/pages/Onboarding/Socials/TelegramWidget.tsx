import { useEffect, useRef } from 'react';

type TelegramWidgetProps = {
  botUsername: string;
  onAuth: (user: Record<string, unknown>) => void;
};

const CALLBACK = '__bluxTelegramAuth';

type TelegramWindow = Window & {
  [CALLBACK]?: (user: Record<string, unknown>) => void;
};

// Telegram's Login Widget must run on the customer's origin — BotFather binds
// each bot to a single domain, so the Blux API popup cannot host it. The
// script reads data-* attributes off its own tag and replaces itself with an
// iframe; data-onauth is evaluated as JS, so the callback lives on window.
const TelegramWidget = ({ botUsername, onAuth }: TelegramWidgetProps) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const onAuthRef = useRef(onAuth);
  onAuthRef.current = onAuth;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const name = botUsername.replace(/^@/, '').trim();
    if (!name) {
      return;
    }

    (window as TelegramWindow)[CALLBACK] = (user) => {
      onAuthRef.current(user);
    };

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', name);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '8');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-onauth', `${CALLBACK}(user)`);
    host.replaceChildren();
    host.appendChild(script);

    return () => {
      delete (window as TelegramWindow)[CALLBACK];
      host.replaceChildren();
    };
  }, [botUsername]);

  return (
    <div
      ref={hostRef}
      className="bluxcc:mt-2 bluxcc:flex bluxcc:min-h-10 bluxcc:justify-center"
    />
  );
};

export default TelegramWidget;
