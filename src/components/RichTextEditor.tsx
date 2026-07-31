import { useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  onInsertImage?: (() => void) | undefined;
};

const TOOLS: { label: string; command: string; arg?: string; title: string }[] = [
  { label: "B", command: "bold", title: "Bold" },
  { label: "I", command: "italic", title: "Italic" },
  { label: "U", command: "underline", title: "Underline" },
  { label: "H2", command: "formatBlock", arg: "H2", title: "Heading" },
  { label: "P", command: "formatBlock", arg: "P", title: "Paragraph" },
  { label: "“ ”", command: "formatBlock", arg: "BLOCKQUOTE", title: "Quote" },
  { label: "• List", command: "insertUnorderedList", title: "Bullet list" },
  { label: "1. List", command: "insertOrderedList", title: "Numbered list" },
];

export function RichTextEditor({ value, onChange, onInsertImage }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function exec(command: string, arg?: string) {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    onChange(ref.current?.innerHTML ?? "");
  }

  function addLink() {
    const url = window.prompt("Link URL");
    if (url) exec("createLink", url);
  }

  return (
    <div className="border border-input bg-card">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-secondary px-2 py-1.5">
        {TOOLS.map((t) => (
          <button
            key={t.label}
            type="button"
            title={t.title}
            onClick={() => exec(t.command, t.arg)}
            className="px-2 py-1 text-xs font-semibold hover:bg-background"
          >
            {t.label}
          </button>
        ))}
        <button
          type="button"
          onClick={addLink}
          className="px-2 py-1 text-xs font-semibold hover:bg-background"
        >
          Link
        </button>
        {onInsertImage && (
          <button
            type="button"
            onClick={onInsertImage}
            className="px-2 py-1 text-xs font-semibold hover:bg-background"
          >
            Image
          </button>
        )}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(ref.current?.innerHTML ?? "")}
        onBlur={() => onChange(ref.current?.innerHTML ?? "")}
        className="story-body min-h-56 px-3 py-3 outline-none"
      />
    </div>
  );
}

export function insertHtmlAtCursor(html: string) {
  document.execCommand("insertHTML", false, html);
}