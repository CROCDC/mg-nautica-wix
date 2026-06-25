import type { ReactNode } from "react";
import type { RicosContent, RicosNode } from "@/lib/wix";

// Boat descriptions are simple Ricos: PARAGRAPH + TEXT, with rare LINK/UNDERLINE.
function renderText(node: RicosNode, key: number) {
  const decorations = node.textData?.decorations ?? [];
  let el: ReactNode = node.textData?.text ?? "";
  if (decorations.some((d) => d.type === "BOLD")) el = <strong>{el}</strong>;
  if (decorations.some((d) => d.type === "ITALIC")) el = <em>{el}</em>;
  if (decorations.some((d) => d.type === "UNDERLINE")) el = <u>{el}</u>;
  const link = decorations.find((d) => d.type === "LINK")?.linkData?.link?.url;
  if (link) {
    el = (
      <a href={link} target="_blank" rel="noopener noreferrer">
        {el}
      </a>
    );
  }
  return <span key={key}>{el}</span>;
}

export default function RichText({ content }: { content: RicosContent }) {
  return (
    <>
      {content.nodes.map((node, i) => {
        if (node.type !== "PARAGRAPH") return null;
        const children = node.nodes ?? [];
        // Empty paragraphs are spacers — paragraph margins already provide the gap.
        if (!children.length) return null;
        return <p key={i}>{children.map(renderText)}</p>;
      })}
    </>
  );
}
