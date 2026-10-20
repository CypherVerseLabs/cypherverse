import dynamic from "next/dynamic";

const Cypher = dynamic(import("worlds/Cypher"), { ssr: false });

export default function CypherPage() {
  return <Cypher />;
};