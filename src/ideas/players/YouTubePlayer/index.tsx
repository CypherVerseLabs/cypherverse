
import { GroupProps, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useMemo, useRef, useState } from "react";
import { Vector3 } from "three";
import { useLimiter } from "cyengine";

type YouTubePlayerProps = {
  videoId: string;
  width?: number;
  height?: number;

  videoDistance?: number;

  controls?: boolean;
  muted?: boolean;
} & GroupProps;

export default function YouTubePlayer({
  videoId,

  width = 640,
  height = 360,

  videoDistance = 5,

  controls = true,
  muted = false,

  ...restProps
}: YouTubePlayerProps) {
  const group = useRef<any>(null);

  const [play, setPlay] = useState(false);

  const dummy = useMemo(() => new Vector3(), []);

  const limiter = useLimiter(10);

  useFrame(({ clock, camera }) => {
    if (!limiter.isReady(clock) || !group.current) return;

    group.current.getWorldPosition(dummy);

    const distance = camera.position.distanceTo(dummy);

    if (!play && distance < videoDistance) {
      setPlay(true);
    }

    if (play && distance > videoDistance) {
      setPlay(false);
    }
  });

  const src = useMemo(() => {
    const params = new URLSearchParams({
      autoplay: play ? "1" : "0",
      controls: controls ? "1" : "0",
      playsinline: "1",
      rel: "0",
      mute: muted ? "1" : "0",
    });

    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  }, [videoId, play, controls, muted]);

  return (
    <group
      ref={group}
      name="youtube-player"
      {...restProps}
    >
      {play && (
        <Html
          transform
          center
          distanceFactor={1}
          position-z={0.001}
          style={{
            width: `${width}px`,
            height: `${height}px`,
            overflow: "hidden",
            background: "#000",
          }}
        >
          <iframe
            src={src}
            width={width}
            height={height}
            title="YouTube Player"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              border: "none",
              background: "#000",
            }}
          />
        </Html>
      )}
    </group>
  );
}

