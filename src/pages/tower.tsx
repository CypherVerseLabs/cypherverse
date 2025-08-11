import dynamic from "next/dynamic";

const Tower = dynamic(import("worlds/Tower/"), { ssr: false });

export default function TowerPage() {
  return <Tower />;
};