
import { Suspense, useState } from "react";
import { GroupProps } from "@react-three/fiber";
import { AudioAnalyser } from "three";
import SpeakerModel from "../Speaker/models/Speaker";
import Audio from "./components/Audio";

type SpeakerRadioProps = {
  distance?: number;
  volume?: number;
  shuffle?: boolean;
} & GroupProps;

const MUSIC_BASE_URL = "https://lbemedia.net/music/";

const musicFiles = [
  
  "deep-.mp3",
  "Recipe.mp3",
  "shoppin.mp3",
  "So Called Life.mp3",
  "Street Game.mp3",
  "Tha Movement.mp3",
  "Throw them Ls Up.mp3",
  "Unfinished bizz.mp3",
  "Where My Phone.mp3",
  "Who u Run With.mp3",
  "Anyway.mp3",
  "Bassen.mp3",
  "Down 4 Me.mp3",
  "Element of Hip Hop.mp3",
  "game tight.mp3",
  "get back.mp3",
  "get my rink on-.mp3",
  "Getto HouseWife.mp3",
  "Got Beef.mp3",
  "Hussel Kit.mp3",
  "i aint missin-.mp3",
  "I Be The 1.mp3",
  "Image.mp3",
  "Intolude.mp3",
  "Intro.mp3",
  "Keep Goin.mp3",
  "Life.mp3",
];

export default function SpeakerRadio({
  distance = 6,
  volume = 1,
  shuffle = false,
  ...restProps
}: SpeakerRadioProps) {
  const [analyser, setAnalyser] = useState<AudioAnalyser>();
  const [currentTrack, setCurrentTrack] = useState(0);

  const playlist = shuffle
    ? [...musicFiles].sort(() => Math.random() - 0.5)
    : musicFiles;

  const audioUrl = `${MUSIC_BASE_URL}${encodeURIComponent(
    playlist[currentTrack]
  )}`;

  const handleNextTrack = () => {
    setCurrentTrack((current) => (current + 1) % playlist.length);
  };

  return (
    <group name="speakerRadio" {...restProps}>
      <Audio
        url={audioUrl}
        radius={distance}
        volume={volume * 1.25}
        setAudioAnalyser={setAnalyser}
        loop={false}
        onEnded={handleNextTrack}
      />

      <Suspense fallback={null}>
        <SpeakerModel analyser={analyser} />
      </Suspense>
    </group>
  );
}
