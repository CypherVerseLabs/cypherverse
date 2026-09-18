import dynamic from "next/dynamic";

const Found = dynamic(
  () => import("../worlds/Found"),
  {
    ssr: false,
  }
);

export default function FoundPage() {
  return <Found />;
}
