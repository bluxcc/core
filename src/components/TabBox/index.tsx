import React, { useState } from 'react';
import { hexToRgba } from '../../utils/helpers';
import { useAppStore } from '../../store';

type Tab = {
  label: string;
  content: React.ReactNode;
  activeIcon: React.JSX.Element;
  inActiveIcon: React.JSX.Element;
};

type TabsProps = {
  tabs: Tab[];
};
const TabBox = ({ tabs }: TabsProps) => {
  const appearance = useAppStore((store) => store.config.appearance);
  const [activeTab, setActiveTab] = useState(0);

  return (
    <>
      <div className="bluxcc:flex bluxcc:gap-3 bluxcc:py-3">
        {tabs.map((tab, index) => {
          const isActive = activeTab === index;

          return (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              role="tab"
              aria-label={tab.label}
              aria-selected={activeTab === index}
              tabIndex={activeTab === index ? 0 : -1}
              className="bluxcc:flex bluxcc:gap-2 bluxcc:h-20 bluxcc:w-24 bluxcc:flex-col bluxcc:items-center bluxcc:justify-center bluxcc:px-7 bluxcc:py-4 bluxcc:text-sm bluxcc:font-medium bluxcc:transition-all bluxcc:duration-300"
              style={{
                background: isActive
                  ? hexToRgba(appearance.accentColor, 0.1)
                  : appearance.background,
                color: isActive ? appearance.accentColor : appearance.textColor,
                borderRadius: appearance.borderRadius,
              }}
            >
              <span>{isActive ? tab.activeIcon : tab.inActiveIcon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div
        className="bluxcc:max-h-[312px] bluxcc:h-[312px] w-full bluxcc:overflow-auto overflowStyle"
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
      >
        <div className="bluxcc:absolute bluxcc:left-0 bluxcc:right-0 bluxcc:max-h-[312px] bluxcc:h-[312px] bluxcc:overflow-auto overflowStyle">
          {tabs[activeTab]?.content}
        </div>
      </div>
    </>
  );
};
export default TabBox;
