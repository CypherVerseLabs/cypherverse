
import { useEffect, useRef, useState } from "react";
import { GroupProps, useThree } from "@react-three/fiber";
import {
  AudioAnalyser,
  AudioListener,
  PositionalAudio,
} from "three";

type MusicProps = {
  url: string;
  volume?: number;
  radius?: number;
  setAudioAnalyser?: (aa: AudioAnalyser) => void;
  fftSize?: 64 | 128 | 256 | 512 | 1024;
  loop?: boolean;
  onEnded?: () => void;
} & GroupProps;

export default function Audio(props: MusicProps) {
  const {
    url,
    volume = 1.25,
    radius = 4,
    setAudioAnalyser,
    fftSize = 128,
    loop = true,
    onEnded,
    ...restProps
  } = props;

  const { clock, camera } = useThree();

  const posAudioRef = useRef<PositionalAudio | undefined>();
  const [posAudio, setPosAudio] = useState<PositionalAudio>();

  const audioRef = useRef<HTMLAudioElement | undefined>();
  const [audio, setAudio] = useState<HTMLAudioElement>();

  const listenerRef = useRef<AudioListener | undefined>();

  // Mount
  useEffect(() => {
    if (posAudio) return;

    const createSpeaker = () => {
      if (posAudioRef.current) return;

      const listener = new AudioListener();
      camera.add(listener);

      const audioElement = document.createElement("audio");

      audioElement.src = url;
      audioElement.autoplay = false;
      audioElement.preload = "auto";
      audioElement.crossOrigin = "anonymous";
      audioElement.loop = loop;

      if (onEnded) {
        audioElement.addEventListener("ended", onEnded);
      }

      audioElement
        .play()
        .then(() => {
          if (
            Number.isFinite(audioElement.duration) &&
            audioElement.duration > 0
          ) {
            audioElement.currentTime =
              clock.getElapsedTime() % audioElement.duration;
          }
        })
        .catch((error) => {
          console.warn("Audio playback failed:", error);
        });

      const positionalAudio = new PositionalAudio(listener);

      positionalAudio.setMediaElementSource(audioElement);

      if (setAudioAnalyser) {
        setAudioAnalyser(new AudioAnalyser(positionalAudio, fftSize));
      }

      setAudio(audioElement);
      audioRef.current = audioElement;

      setPosAudio(positionalAudio);
      posAudioRef.current = positionalAudio;

      listenerRef.current = listener;
    };

    document.addEventListener("click", createSpeaker);
    document.addEventListener("touchstart", createSpeaker);

    return () => {
      document.removeEventListener("click", createSpeaker);
      document.removeEventListener("touchstart", createSpeaker);
    };
  }, [
    posAudio,
    camera,
    clock,
    fftSize,
    setAudioAnalyser,
    url,
    loop,
    onEnded,
  ]);

  // Unmount
  useEffect(() => {
    return () => {
      const listener = listenerRef.current;

      if (listener) {
        camera.remove(listener);
      }

      const audioElement = audioRef.current;

      if (audioElement) {
        if (onEnded) {
          audioElement.removeEventListener("ended", onEnded);
        }

        audioElement.pause();
        audioElement.removeAttribute("src");
        audioElement.load();
      }

      const sound = posAudioRef.current;

      if (sound) {
        if (sound.isPlaying) {
          sound.stop();
        }

        if (sound.source && (sound.source as any)._connected) {
          sound.disconnect();
        }
      }
    };
  }, [camera, onEnded]);

  // Update URL
  useEffect(() => {
    if (!audio) return;

    const newUrl = new URL(url, window.location.href).href;

    if (audio.src === newUrl) return;

    audio.pause();
    audio.src = url;
    audio.load();

    audio
      .play()
      .then(() => {
        if (
          Number.isFinite(audio.duration) &&
          audio.duration > 0
        ) {
          audio.currentTime =
            clock.getElapsedTime() % audio.duration;
        }
      })
      .catch((error) => {
        console.warn("Audio playback failed:", error);
      });
  }, [audio, url, clock]);

  // Update positional parameters
  if (posAudio) {
    posAudio.setDistanceModel("linear");
    posAudio.setRolloffFactor(1);
    posAudio.setRefDistance(1);
    posAudio.setVolume(volume);
    posAudio.setMaxDistance(Math.max(1, radius));
    posAudio.setDirectionalCone(160, 210, 0.1);
  }

  return <group {...restProps}>{posAudio && null}</group>;
}

