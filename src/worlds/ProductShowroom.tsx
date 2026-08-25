import { StandardReality, LostWorld, Model, Button, Image } from "cyengine";
import Analytics from "ideas/Analytics";
import Link from "ideas/Link";
import Test from "ideas/Text";
import Title from "ideas/Title";
import { useState } from "react";


const PRODUCTS = [
  {
    name: "Cyber Logo",
    price: "$199",
    model: "./cyLogo.glb",
    image: "./cyLogo.glb",
  },
  {
    name: "Cyber Logo Gold",
    price: "$299",
    model: "./cyLogoGold.glb",
    image: "./cyLogoGold.glb",
  },
  {
    name: "Featured 3D Product",
    price: "$499",
    model:
      "https://d1htv66kutdwsl.cloudfront.net/ae483f1d-77dc-4402-963d-b4105cd6c944/334823a4-b069-45fb-92e8-c88c2b55ba4a.glb",
    image: "./cyLogoGold.glb",
  },
];

export default function ProductShowroom() {
  const [index, setIndex] = useState(0);

  const product = PRODUCTS[index];

  const next = () => {
    setIndex((current) => (current + 1) % PRODUCTS.length);
  };

  const previous = () => {
    setIndex(
      (current) =>
        (current - 1 + PRODUCTS.length) % PRODUCTS.length
    );
  };

  return (
    <StandardReality
      environmentProps={{
        dev: process.env.NODE_ENV === "development",
        canvasProps: {
          frameloop: "always",
        },
      }}
      playerProps={{ flying: false }}
    >
      <Analytics />

      <LostWorld />

      {/* Header */}
      <Title position={[0, 2.8, -5]}>
        PRODUCT SHOWROOM
      </Title>

      <Link
        href="/"
        position={[0, 2.35, -5]}
      >
        back to hub
      </Link>

      {/* Main product */}
      <group position={[0, 0, -5]}>
        <Test name={product.name}>
          <Model
            normalize
            center
            src={product.model}
          />
        </Test>
      </group>

      {/* Product name */}
      <Title
        position={[-2.5, 1.5, -5]}
      >
        {product.name}
      </Title>

      {/* Price */}
      <Title
        position={[-2.5, 1.1, -5]}
      >
        {product.price}
      </Title>

      {/* Product image */}
      <group position={[2.5, 0.8, -5]}>
        <Image src={product.image} />
      </group>

      {/* Navigation */}
      <Button
        onClick={previous}
        position={[-2, -1, -5]}
      >
        previous
      </Button>

      <Button
        onClick={next}
        position={[1, -1, -5]}
      >
        next
      </Button>

      {/* Purchase */}
      <Button
        onClick={() => {
          console.log(
            "Buy product:",
            product.name
          );
        }}
        position={[0, -1.6, -5]}
      >
        buy now
      </Button>
    </StandardReality>
  );
}