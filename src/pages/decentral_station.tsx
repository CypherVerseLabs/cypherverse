import dynamic from "next/dynamic";

const DecentralStation = dynamic(import("worlds/DecentralStation"), { ssr: false });

export default function StarterPage() {
  return <DecentralStation />;
};