import dynamic from "next/dynamic";

const BuildMe = dynamic(import("worlds/Bitconi"), { ssr: false });

export default function BuildPage() {
  return <BuildMe />;
};