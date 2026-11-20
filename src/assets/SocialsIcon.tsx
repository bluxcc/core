export const SocialsIcon = ({
  fill = '#0C1083',
  radius = '0px',
}: {
  fill?: string;
  radius?: string;
}) => {
  const positions = [4, 10.5, 17];

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={fill}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {positions.map((y) =>
        positions.map((x) => (
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width={3}
            height={3}
            rx={radius}
          />
        )),
      )}
    </svg>
  );
};
