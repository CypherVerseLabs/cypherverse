import dynamic from "next/dynamic";

const BuildMe = dynamic(import("worlds/BuildMe"), { ssr: false });

export default function StarterPage() {
  return <BuildMe />;
};