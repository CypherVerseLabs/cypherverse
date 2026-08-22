import dynamic from "next/dynamic";

const Orientation = dynamic(import("worlds/Orientation"), { ssr: false });

export default function StarterPage() {
  return <Orientation />;
};