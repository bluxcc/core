import { ChipIcon, KeyIcon, ShieldIcon, WalletIcon } from "../../assets/Icons";
import { useAppStore } from "../../store";
import AnimatedGradient from "../../utils/animatedGradient";

const About = () => {
  const appearance = useAppStore((store) => store.config.appearance);
  const icons = [ShieldIcon, KeyIcon, WalletIcon, ChipIcon];

  return (
    <div
      className="bluxcc:flex bluxcc:flex-col bluxcc:select-none bluxcc:items-center bluxcc:justify-center bluxcc:text-center bluxcc:font-medium bluxcc:my-8"
      style={{ color: appearance.textColor }}
    >
      <AnimatedGradient
        theme={"purple"}
        animationSpeed={3}
        style={{ borderRadius: appearance.borderRadius }}
        className="bluxcc:size-[264px] bluxcc:mx-6 bluxcc:overflow-hidden bluxcc:flex bluxcc:items-center"
      >
        <div className="bluxcc:marquee_track bluxcc:gap-2.5 bluxcc:z-40">
          {[...icons, ...icons].map((Icon, idx) => (
            <div
              key={idx}
              className="bluxcc:size-[82px] bluxcc:flex bluxcc:items-center bluxcc:animate-borderRadius bluxcc:justify-center bluxcc:bg-primary-500"
            >
              <Icon fill="#ffffff" />
            </div>
          ))}
        </div>
      </AnimatedGradient>
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
