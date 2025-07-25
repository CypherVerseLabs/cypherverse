import dynamic from "next/dynamic";

const Bitconi = dynamic(import("worlds/Bitconi"), { ssr: false });

export default function BitconiPage() {
  return <Bitconi />;
};