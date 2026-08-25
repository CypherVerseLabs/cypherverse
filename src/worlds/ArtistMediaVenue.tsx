import {
  StandardReality,
  LostWorld,
  Model,
  Button,
  Image,
  Video,
} from "cyengine";
import Analytics from "ideas/Analytics";
import Link from "ideas/Link";
import SpeakerRadio from "ideas/players/SpeakerRadio";
import YouTubePlayer from "ideas/players/YouTubePlayer";
import Title from "ideas/Title";



export default function ArtistMediaVenue() {
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

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <Title
        position={[0, 3.2, -6]}
      >
        ARTIST MEDIA WORLD
      </Title>

      <Link
        href="/"
        position={[0, 2.7, -6]}
      >
        back to hub
      </Link>

      {/* ================================================= */}
      {/* ARTIST / 3D MODEL */}
      {/* ================================================= */}

      <group position={[-4, 0, -6]}>
        <Title position={[0, 2.2, 0]}>
          ARTIST
        </Title>

        <Model
          normalize
          center
          src="./cyLogo.glb"
        />
      </group>

      {/* ================================================= */}
      {/* MUSIC SPEAKER */}
      {/* ================================================= */}

      <group position={[4, 0, -4]}>
        <Title position={[0, 2, 0]}>
          RADIO
        </Title>

        <SpeakerRadio
          position={[0, 0, 0]}
          distance={6}
          volume={1}
        />
      </group>

      {/* ================================================= */}
      {/* MUSIC VIDEO */}
      {/* ================================================= */}

      <group position={[0, 1.5, -8]}>
        <Title position={[0, 2.5, 0]}>
          MUSIC VIDEO
        </Title>

        <Video
          src="https://lbemedia.net/videos/Tohbala%20Show%201.mp4"
          size={4}
          position={[0, 0, 0]}
          rotation={[0, Math.PI, 0]}
          muted
          framed
        />
      </group>

      {/* ================================================= */}
      {/* YOUTUBE */}
      {/* ================================================= */}

      <group position={[6, 2, -10]}>
        <Title position={[0, 2.5, 0]}>
          YOUTUBE
        </Title>

        <YouTubePlayer
          videoId="SskCJNrzM5w"
          width={640}
          height={360}
          position={[0, 0, 0]}
          rotation={[0, Math.PI, 0]}
          muted
        />
      </group>

      {/* ================================================= */}
      {/* ALBUM / IMAGE */}
      {/* ================================================= */}

      <group position={[-6, 1, -10]}>
        <Title position={[0, 2, 0]}>
          ALBUM
        </Title>

        <Image
          src="./cyLogoGold.glb"
        />
      </group>

      {/* ================================================= */}
      {/* ARTIST INFO */}
      {/* ================================================= */}

      <group position={[0, 0, -3]}>
        <Title position={[0, 1.5, 0]}>
          TOHBALA
        </Title>

        <Button
          position={[0, -1, 0]}
          onClick={() =>
            console.log("Artist profile")
          }
        >
          artist profile
        </Button>
      </group>
    </StandardReality>
  );
}