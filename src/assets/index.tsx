export const CurrencyExchange = ({ fill = '#0C1083' }: { fill?: string }) => {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 -960 960 960"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M480-40q-112 0-206-51T120-227v107H40v-240h240v80h-99q48 72 126.5 116T480-120q75 0 140.5-28.5t114-77q48.5-48.5 77-114T840-480h80q0 91-34.5 171T791-169q-60 60-140 94.5T480-40Zm-36-160v-52q-47-11-76.5-40.5T324-370l66-26q12 41 37.5 61.5T486-314q33 0 56.5-15.5T566-378q0-29-24.5-47T454-466q-59-21-86.5-50T340-592q0-41 28.5-74.5T446-710v-50h70v50q36 3 65.5 29t40.5 61l-64 26q-8-23-26-38.5T482-648q-35 0-53.5 15T410-592q0 26 23 41t83 35q72 26 96 61t24 77q0 29-10 51t-26.5 37.5Q583-274 561-264.5T514-250v50h-70ZM40-480q0-91 34.5-171T169-791q60-60 140-94.5T480-920q112 0 206 51t154 136v-107h80v240H680v-80h99q-48-72-126.5-116T480-840q-75 0-140.5 28.5t-114 77q-48.5 48.5-77 114T120-480H40Z"
        fill={fill}
      />
    </svg>
  );
};

export const BuyIcon = ({ fill = '#0C1083' }: { fill?: string }) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill={fill} />
    </svg>
  );
};

export const SellIcon = ({ fill = '#0C1083' }: { fill?: string }) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 4h14v-2H5v2z" fill={fill} />
    </svg>
  );
};

export const ArrowOutward = ({ fill = '#999999' }: { fill?: string }) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <mask
        id="mask0_4197_4537"
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="24"
        height="24"
      >
        <rect width="24" height="24" fill="#D9D9D9" />
      </mask>
      <g mask="url(#mask0_4197_4537)">
        <path
          d="M6.29425 17.6443L5.25 16.6L15.0905 6.75H6.14425V5.25H17.6443V16.75H16.1443V7.80375L6.29425 17.6443Z"
          fill={fill}
        />
      </g>
    </svg>
  );
};
export const Terms = ({ fill = '#0C1083' }: { fill?: string }) => {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <mask
        id="mask0_3683_34744"
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="40"
        height="40"
      >
        <rect width="40" height="40" fill="#D9D9D9" />
      </mask>
      <g mask="url(#mask0_3683_34744)">
        <path
          d="M20 37.3069L7.5 27.9319V4.16602H32.5V27.9319L20 37.3069ZM20 34.166L30 26.6819V6.66602H10V26.6819L20 34.166ZM18.25 24.4223L27.0896 15.5827L25.3333 13.7752L18.25 20.8585L14.7179 17.3264L12.9104 19.0827L18.25 24.4223Z"
          fill={fill}
        />
      </g>
    </svg>
  );
};
export const BitGetLogo = ({ fill = '#05C3DD' }: { fill?: string }) => {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M37.1737 32.0256H51.2086L65.5665 46.3274C66.5004 47.2576 66.5052 48.7708 65.5759 49.706L47.1629 68.2582H32.7051L37.076 63.9982L53.1242 48.0114L37.2796 32.0244"
        fill={fill}
      />
      <path
        d="M42.9419 47.9755H28.907L14.5492 33.6739C13.6152 32.7435 13.6104 31.2303 14.5397 30.2951L32.9527 11.7417H47.4106L43.0397 16.0018L26.9914 31.9887L42.8358 47.9755"
        fill={fill}
      />
    </svg>
  );
};
export const OneKeyLogo = () => {
  return (
    <svg
      width="144"
      height="144"
      viewBox="0 0 144 144"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#clip0_617_11734)">
        <path d="M0 0H144V144H0V0Z" fill="#44D62C" />
        <path
          d="M78.5049 30.5303H58.4749L54.9609 41.156H66.0861V63.5379H78.5049V30.5303Z"
          fill="black"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M94.8428 90.626C94.8428 103.242 84.6155 113.469 71.9995 113.469C59.3835 113.469 49.1562 103.242 49.1562 90.626C49.1562 78.01 59.3835 67.7827 71.9995 67.7827C84.6155 67.7827 94.8428 78.01 94.8428 90.626ZM84.4722 90.6259C84.4722 97.5144 78.8879 103.099 71.9995 103.099C65.111 103.099 59.5267 97.5144 59.5267 90.6259C59.5267 83.7374 65.111 78.1532 71.9995 78.1532C78.8879 78.1532 84.4722 83.7374 84.4722 90.6259Z"
          fill="black"
        />
      </g>
      <defs>
        <clipPath id="clip0_617_11734">
          <rect width="144" height="144" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export const CactusLinkLogo = ({ fill = '#3FA76E' }: { fill?: string }) => {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="9.25" y="2.5" width="5.5" height="16" rx="2.75" fill={fill} />
      <rect x="3" y="7.5" width="3" height="7" rx="1.5" fill={fill} />
      <rect x="3" y="11.5" width="9" height="3" rx="1.5" fill={fill} />
      <rect x="18" y="5.5" width="3" height="7" rx="1.5" fill={fill} />
      <rect x="13" y="9.5" width="8" height="3" rx="1.5" fill={fill} />
      <rect x="5.5" y="19.5" width="13" height="2.5" rx="1.25" fill={fill} />
    </svg>
  );
};
export const FordefiLogo = () => {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="8" fill="#2E27F6" />
      <path d="M8 24V8h16l-4.2 4.8H13v3h8.4L17.2 20H13v4H8Z" fill="#ffffff" />
    </svg>
  );
};
export const TrezorLogo = ({ fill = '#171717' }: { fill?: string }) => {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm3 8V7a3 3 0 1 0-6 0v3h6Zm-3 4a1.75 1.75 0 0 0-.75 3.33V19.5a.75.75 0 0 0 1.5 0v-2.17A1.75 1.75 0 0 0 12 14Z"
        fill={fill}
      />
    </svg>
  );
};

export const MoneyGramLogo = () => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="24" height="24" rx="6" fill="#E31837" />
      <path
        d="M6.4 17.2V6.8h2.35l3.25 6.55L15.25 6.8H17.6v10.4h-2.2V10.3l-2.95 5.85h-1.9L7.6 10.3v6.9H6.4Z"
        fill="white"
      />
    </svg>
  );
};

// todo: this should be CDNFiles.MoonPayLogo
export const MoonPayLogo = () => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#clip0_4355_16345)">
        <path
          d="M17.9507 8.43559C18.4879 8.43559 19.0133 8.27633 19.4601 7.97795C19.9069 7.67956 20.2552 7.25543 20.4611 6.75915C20.6669 6.26287 20.7211 5.71671 20.6167 5.18966C20.5123 4.66262 20.254 4.17835 19.8744 3.79803C19.4949 3.41771 19.0112 3.15842 18.4844 3.05292C17.9575 2.94741 17.4112 3.00042 16.9146 3.20526C16.4178 3.41009 15.993 3.75755 15.6936 4.20375C15.3944 4.64993 15.234 5.17483 15.2329 5.71212C15.2322 6.06951 15.3019 6.42353 15.4382 6.75392C15.5744 7.08431 15.7745 7.38459 16.0269 7.63756C16.2794 7.89053 16.5792 8.09123 16.9093 8.22816C17.2394 8.3651 17.5933 8.43559 17.9507 8.43559ZM9.61576 20.6742C8.30665 20.6731 7.02725 20.2839 5.93923 19.5559C4.85121 18.8279 4.0034 17.7937 3.50294 16.584C3.00249 15.3743 2.87184 14.0435 3.12751 12.7596C3.38318 11.4757 4.01369 10.2964 4.93938 9.37069C5.86506 8.445 7.04436 7.81449 8.32826 7.55882C9.61217 7.30315 10.943 7.43379 12.1527 7.93425C13.3624 8.43471 14.3966 9.28252 15.1246 10.3705C15.8526 11.4586 16.2417 12.738 16.2429 14.0471C16.2436 14.9176 16.0727 15.7797 15.74 16.584C15.4071 17.3884 14.919 18.1192 14.3035 18.7348C13.688 19.3503 12.9571 19.8385 12.1527 20.1712C11.3483 20.504 10.4862 20.675 9.61576 20.6742Z"
          fill="#7D00FF"
        />
      </g>
      <defs>
        <clipPath id="clip0_4355_16345">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export const PasskeyFingerLogo = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ width: '38px', height: '38px' }}
    >
      <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"></path>
      <path d="M14 13.12c0 2.38 0 6.38-1 8.88"></path>
      <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"></path>
      <path d="M2 12a10 10 0 0 1 18-6"></path>
      <path d="M2 16h.01"></path>
      <path d="M21.8 16c.2-2 .131-5.354 0-6"></path>
      <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"></path>
      <path d="M8.65 22c.21-.66.45-1.32.57-2"></path>
      <path d="M9 6.8a6 6 0 0 1 9 5.2v2"></path>
    </svg>
  );
};

export const PhoneIcon = ({ fill = '#0C1083' }: { fill?: string }) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.61 21 3 13.39 3 4c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2Z"
        fill={fill}
      />
    </svg>
  );
};
