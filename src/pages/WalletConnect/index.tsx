import { useEffect, useState } from "react";
import Button from "../../components/Button";
import Divider from "../../components/Divider";
import QRCode from "../../components/QRCode";
import { useLang } from "../../hooks/useLang";
import { useAppStore } from "../../store";

import { Core } from "@walletconnect/core";
import SignClient from "@walletconnect/sign-client";
import { WalletConnectLogo } from "../../assets/Logos";
import { copyText } from "../../utils/helpers";

// todo get project id from config.walletConnectId
const projectId = "xyz";
const metadata = {
  name: "My DApp",
  description: "A description of your dApp",
  url: "https://www.blux.cc/",
  icons: [],
};

const WalletConnect = () => {
  const t = useLang();
  const store = useAppStore((store) => store);
  const { setAlert } = useAppStore((store) => store);
  const appearance = store.config.appearance;
  const [uri, setUri] = useState("");

  const handleCopyURI = (uri: string) => {
    copyText(uri);
    setAlert("info", t("address_copied"));
    setTimeout(() => {
      setAlert("none", "");
    }, 1000);
  };
  useEffect(() => {
    const core = new Core({ projectId });

    SignClient.init({
      core,
      metadata,
    })
      .then((signClient) => {
        console.log("SignClient initialized:", signClient);

        signClient.on("session_request", (event) => {
          console.log("Session request received:", event);
        });

        signClient.on("session_disconnect", (event) => {
          console.log("Session disconnected:", event);
        });

        return signClient;
      })
      .then((signClient) => {
        return signClient.connect({
          requiredNamespaces: {
            eip155: {
              chains: ["eip155:1"],
              methods: ["eth_sendTransaction", "personal_sign"],
              events: ["chainChanged", "accountsChanged"],
            },
          },
        });
      })
      .then(({ uri, approval }) => {
        console.log("Connection URI generated:", uri);
        setUri(uri);

        approval()
          .then((session) => {
            console.log("Session established:", session.self.publicKey);
          })
          .catch((error) => {
            console.error("Connection rejected:", error);
          });
      })
      .catch((error) => {
        console.error("Initialization or connection failed:", error);
      });
  }, []);

  return (
    <div className="bluxcc:flex bluxcc:w-full bluxcc:flex-col bluxcc:items-center bluxcc:justify-center bluxcc:text-center">
      <div
        className={`bluxcc:mt-4 bluxcc:flex bluxcc:size-[208px] bluxcc:items-center bluxcc:justify-center`}
        style={{
          position: "relative",
          borderRadius: appearance.borderRadius,
          color: appearance.textColor,
          borderColor: appearance.borderColor,
          backgroundColor: appearance.fieldBackground,
          borderWidth: appearance.borderWidth,
        }}
      >
        <QRCode
          size={184}
          value={uri}
          bgColor={appearance.fieldBackground}
          fgColor={appearance.accentColor}
          level="Q"
        />
        <div
          className="bluxcc:z-20"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: appearance.background,
          }}
        >
          <WalletConnectLogo
            fill={appearance.accentColor}
            background={appearance.fieldBackground}
          />
        </div>
      </div>
      <div className="bluxcc:mt-4 bluxcc:font-medium">
        <p className="bluxcc:text-lg">Scan this QR code with your phone</p>
      </div>
      <Divider />
      <Button
        size="large"
        state="enabled"
        variant="tonal"
        style={{
          color: appearance.accentColor,
        }}
        onClick={() => handleCopyURI(uri)}
      >
        Copy URI
      </Button>
    </div>
  );
};

export default WalletConnect;
