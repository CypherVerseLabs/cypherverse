import dynamic from "next/dynamic";

const CypherVerse = dynamic(import("worlds/CypherVerse"), { ssr: false });

export default function CypherVersePage() {
  return <CypherVerse />;
};