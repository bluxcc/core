import { useAppStore } from '../../store';

const Divider = () => {
  const appearance = useAppStore((store) => store.config.appearance);

  return (
    <div className="bluxcc:flex bluxcc:h-8 bluxcc:w-full bluxcc:items-center bluxcc:justify-center">
      <div
        className="bluxcc:absolute bluxcc:right-0 bluxcc:left-0"
        style={{
          borderTopWidth: appearance.borderWidth,
          borderTopColor: appearance.borderColor,
        }}
      />
    </div>
  );
};

export default Divider;
