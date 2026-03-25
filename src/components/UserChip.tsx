interface UserChipProps {
  username: string;
  onRemove: () => void;
}

export default function UserChip({ username, onRemove }: UserChipProps) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gh-badge text-[13px]">
      {username}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${username}`}
        className="bg-transparent border-none text-gh-text-secondary cursor-pointer text-base leading-none p-0 hover:text-gh-danger"
      >
        &times;
      </button>
    </span>
  );
}
