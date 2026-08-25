import dynamic from "next/dynamic";

const Capitil = dynamic(import("worlds/Capitil"), { ssr: false });

export default function CapitilPage() {
  return <Capitil />;
};