import dynamic from "next/dynamic";

const Playground = dynamic(import("worlds/Playground"), { ssr: false });

export default function PlaygroundPage() {
  return <Playground />;
};