import dynamic from "next/dynamic";

const ProductShowroom = dynamic(import("worlds/ProductShowroom"), { ssr: false });

export default function StarterPage() {
  return <ProductShowroom />;
};