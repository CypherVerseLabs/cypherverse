import dynamic from "next/dynamic";

const BasketBallCourt = dynamic(import("worlds/BasketBallCourt/"), { ssr: false });

export default function BasketBallCourtPage() {
  return <BasketBallCourt />;
};