import SendForm from "./SendForm";
import { useLang } from "../../../hooks/useLang";
import { useAppStore } from "../../../store";

const Send = () => {
  const t = useLang();
  const { loading } = useAppStore((store) => store.balances);

  if (loading) {
    return <p>{t("loading")}</p>;
  }

  return <SendForm />;
};

export default Send;
