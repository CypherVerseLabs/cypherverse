import dynamic from "next/dynamic";

const Editor = dynamic(
  () => import("../worlds/Editor"),
  {
    ssr: false,
  }
);

export default function EditorPage() {
  return <Editor />;
}