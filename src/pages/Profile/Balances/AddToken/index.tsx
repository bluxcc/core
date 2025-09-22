import React, { useState } from "react";
import InputField from "../../../../components/Input";
import { useAppStore } from "../../../../store";
import Divider from "../../../../components/Divider";
import Button from "../../../../components/Button";
import { hexToRgba, humanizeAmount } from "../../../../utils/helpers";
import { StellarLogo } from "../../../../assets/Logos";

const AddToken = () => {
  const [form, setForm] = useState({
    address: "",
  });
  const [errors, setErrors] = useState({});

  let asset = {
    logo: <StellarLogo />,
    name: "xlm",
    valueInCurrency: 203,
  };

  const appearance = useAppStore((store) => store.config.appearance);

  const handleChange =
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: "" }));
    };
  const handleButtonClick = () => {};

  return (
    <div>
      <InputField
        autoFocus
        type="text"
        label={"Enter token address"}
        placeholder="Enter address"
        value={form.address}
        onChange={handleChange("address")}
        onButtonClick={handleButtonClick}
        button={
          <span
            style={{ color: appearance.accentColor }}
            className="bluxcc:flex bluxcc:justify-between"
          >
            Check
          </span>
        }
      />
      <div
        className="h-[224px] bluxcc:my-4"
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
        <Button
          state="enabled"
          variant="outline"
          className="bluxcc:cursor-default!"
        >
          Cancel
        </Button>

        <Button state="enabled" variant="fill" size="large">
          Add Token
        </Button>
      </div>
    </div>
  );
};

export default AddToken;
