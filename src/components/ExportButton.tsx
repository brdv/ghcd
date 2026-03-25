import { useExport } from "../lib/useExport";

interface ExportButtonProps {
  elementSelector: string;
}

export default function ExportButton({ elementSelector }: ExportButtonProps) {
  const handleOnExport = useExport(elementSelector);

  return (
    <button
      type="button"
      onClick={handleOnExport}
      className={`p-2 rounded-lg bg-gh-badge text-gh-text-secondary transition-colors border-none shrink-0 ${"hover:text-gh-text-primary cursor-pointer"}`}
      aria-label="Export as PNG"
    >
      <svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    </button>
  );
}
