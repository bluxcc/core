import { ChipIcon, KeyIcon, ShieldIcon, WalletIcon } from "../../assets/Icons";
import { useAppStore } from "../../store";

const About = () => {
  const appearance = useAppStore((store) => store.config.appearance);
  const icons = [ShieldIcon, KeyIcon, WalletIcon, ChipIcon];

  return (
    <div
      className="bluxcc:flex bluxcc:flex-col bluxcc:select-none bluxcc:items-center bluxcc:justify-center bluxcc:text-center bluxcc:font-medium bluxcc:my-8"
      style={{ color: appearance.textColor }}
    >
      <div
        className="bluxcc:size-[264px] bluxcc:mx-6 bluxcc:overflow-hidden bluxcc:flex bluxcc:items-center bluxcc:animate-gradient"
        style={{
          borderRadius: appearance.borderRadius,
          background:
            "radial-gradient(158.7% 158.7% at 0% 3.16%, #9773FF 0%, #FDE0FF 57.21%, #FFF8FF 100%)",
          backgroundSize: "120% 120%",
        }}
      >
        <div className="bluxcc:overflow-hidden bluxcc:w-full">
          <div className="bluxcc:marquee_track bluxcc:gap-2.5">
            {[...icons, ...icons].map((Icon, idx) => (
              <div
                key={idx}
                // style={{ animation: "radius-grow 12s ease infinite" }}
                className="bluxcc:size-[82px] bluxcc:flex bluxcc:items-center bluxcc:animate-borderRadius bluxcc:justify-center bluxcc:bg-primary-500"
              >
                <Icon fill="#ffffff" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="bluxcc:text-2xl bluxcc:mt-[26px] bluxcc:mb-2">
        Wallet Infrastructure for Stellar dapps
      </p>
      <p className="bluxcc:text-sm text-center">
        Blux is your gateway to Stellar. Create a wallet, manage assets, and
        sign transactions easily and securely.
      </p>
    </div>
  );
};

export default About;
