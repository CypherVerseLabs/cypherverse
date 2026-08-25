import dynamic from "next/dynamic";

const ArtistMediaVenue = dynamic(import("worlds/ArtistMediaVenue"), { ssr: false });

export default function StarterPage() {
  return <ArtistMediaVenue />;
};