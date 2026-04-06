const signInLink =
  "text-gh-accent hover:text-gh-accent-hover bg-transparent border-none p-0 cursor-pointer text-sm";

interface OrganisationInputProps {
  organisation: string;
  onChange: (organisation: string) => void;
  token: string;
  onSignIn: () => void;
  className?: string;
}

export default function OrganisationInput({
  organisation,
  onChange,
  token,
  onSignIn,
  className,
}: OrganisationInputProps) {
  if (token) {
    return (
      <input
        id="org-input"
        value={organisation}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Optional — filter by organization"
        className={`${className} w-full`}
      />
    );
  }

  if (organisation) {
    return (
      <p className="text-sm text-gh-text-secondary">
        {organisation} —{" "}
        <button type="button" onClick={onSignIn} className={signInLink}>
          sign in to change
        </button>
      </p>
    );
  }

  return (
    <p className="text-sm text-gh-text-secondary">
      <button type="button" onClick={onSignIn} className={signInLink}>
        Sign in
      </button>{" "}
      to filter by organization
    </p>
  );
}
