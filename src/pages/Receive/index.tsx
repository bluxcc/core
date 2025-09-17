import { useAppStore } from "../../store";
import Button from "../../components/Button";
import QRCode from "../../components/QRCode";
import { LargeCopy } from "../../assets/Icons";
import { hexToRgba } from "../../utils/helpers";
import { SmallBlux } from "../../assets/bluxLogo";

const Receive = () => {
  const store = useAppStore((store) => store);
  const appearance = store.config.appearance;
  const address = store.user?.address as string;

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
          value="https://demo.blux.cc/"
          size={184}
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
          <SmallBlux
            fill={appearance.accentColor}
            background={appearance.fieldBackground}
          />
        </div>
      </div>

      <div className="bluxcc:mt-4 bluxcc:space-y-2 bluxcc:font-medium">
        <p>Your Address</p>
        <div
          className="bluxcc:w-full bluxcc:px-3 bluxcc:py-2.5 bluxcc:whitespace-normal"
          style={{
            borderRadius: appearance.borderRadius,
            color: appearance.textColor,
            borderColor: appearance.borderColor,
            backgroundColor: appearance.fieldBackground,
            borderWidth: appearance.borderWidth,
          }}
        >
          <div
            className="bluxcc:w-[292px] bluxcc:text-sm bluxcc:break-all"
            style={{
              color: hexToRgba(appearance.textColor, 0.7),
            }}
          >
            {address}
          </div>
        </div>
      </div>

      {/* divider */}
      <div className="bluxcc:flex bluxcc:h-8 bluxcc:w-full bluxcc:items-center bluxcc:justify-center">
        <div
          className="bluxcc:absolute bluxcc:right-0 bluxcc:left-0"
          style={{
            borderTopWidth: appearance.borderWidth,
            borderTopColor: appearance.borderColor,
          }}
        />
      </div>

      <Button
        size="large"
        state="enabled"
        variant="tonal"
        style={{
          color: appearance.accentColor,
        }}
        endIcon={<LargeCopy fill={appearance.accentColor} />}
      >
        Copy address
      </Button>
    </div>
  );
};

export default Receive;
