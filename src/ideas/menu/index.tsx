import {
  TextInput,
  Button,
  Switch,
  Floating,
  FacePlayer,
} from "cyengine";
import Link from "ideas/Link";
import { useState } from "react";

function Menu() {
  const [name, setName] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  return (
    <Floating height={1} speed={1}>
      <FacePlayer>
        <group position={[0, 2, -3]}>

          {/* Title */}
          <Button
            onClick={() => console.log("Ive been clicked!")}
            fontSize={0.1}
            maxWidth={1}
            textColor="#ff0000"
            color="#b9c1f3"
            outline={false}
            outlineColor="#9f9f9f"
            >
            Welcome
            </Button>

          {/* Input Field */}
          <TextInput
            value={name}
            onChange={setName}
            onSubmit={(val) => console.log("Name submitted:", val)}
            fontSize={0.1}
            width={2}
            placeholder="Enter your name"
          />

          {/* Start Button */}
          <Button
            onClick={() => console.log("Start clicked")}
            fontSize={0.1}
            maxWidth={2}
            textColor="white"
            color="#4CAF50"
          >
            Start
          </Button>

          {/* Quit Button */}
          <Button
            onClick={() => console.log("Quit clicked")}
            fontSize={0.1}
            maxWidth={2}
            textColor="white"
            color="#f44336"
          >
            Quit
          </Button>

          {/* Switch for Dark Mode */}
          <Switch
            value={darkMode}
            onChange={setDarkMode}
          />

          {/* Link to Docs */}
          <Link
            href="https://docs.cyengine.io"
        >
            Learn More
          </Link>

        </group>
      </FacePlayer>
    </Floating>
  );
}
