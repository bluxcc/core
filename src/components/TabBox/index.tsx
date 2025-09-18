import React, { useState } from "react";
import { hexToRgba } from "../../utils/helpers";
import { useAppStore } from "../../store";

type Tab = {
  label: string;
  icon: React.JSX.Element;
  content: React.ReactNode;
};

type TabsProps = {
  tabs: Tab[];
};
const TabBox = ({ tabs }: TabsProps) => {
  const appearance = useAppStore((store) => store.config.appearance);
  const [activeTab, setActiveTab] = useState(0);

  return (
    <>
      <div className="bluxcc:flex bluxcc:gap-2 bluxcc:py-3">
        {tabs.map((tab, index) => {
          const isActive = activeTab === index;

          return (
            <div
              key={index}
              onClick={() => setActiveTab(index)}
              role="tab"
              aria-label={tab.label}
              aria-selected={activeTab === index}
              tabIndex={activeTab === index ? 0 : -1}
              className="bluxcc:flex bluxcc:gap-2 bluxcc:h-20 bluxcc:max-w-[96px] bluxcc:cursor-pointer bluxcc:flex-col bluxcc:items-center bluxcc:justify-center bluxcc:px-7 bluxcc:py-4 bluxcc:text-sm bluxcc:font-medium bluxcc:transition-all bluxcc:duration-300"
              style={{
                background: isActive
                  ? hexToRgba(appearance.accentColor, 0.1)
                  : appearance.background,
                color: isActive ? appearance.accentColor : appearance.textColor,
                borderRadius: appearance.borderRadius,
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </div>
          );
        })}
      </div>

      <div
        className="bluxcc:overflow-y-auto"
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
      >
        {tabs[activeTab]?.content}
      </div>
    </>
  );
};
export default TabBox;
