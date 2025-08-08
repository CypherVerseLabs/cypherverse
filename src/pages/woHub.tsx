import dynamic from "next/dynamic";


const WHub = dynamic(import("worlds/Bitconi"), { ssr: false });

export default function WoHub() {
  return <WHub />;
};