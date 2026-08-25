import dynamic from "next/dynamic";

const Teaser = dynamic(import("worlds/Teaser"), { ssr: false });

export default function TeaserPage() {
  return <Teaser />;
};