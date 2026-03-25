import { useState } from 'react'

interface PatInputProps {
  value: string
  onChange: (value: string) => void
}

export default function PatInput({ value, onChange }: PatInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative flex-1 min-w-[200px]">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="ghp_..."
        className="w-full pr-[50px] px-3 py-2 rounded-lg border border-gh-border bg-gh-card text-gh-text-primary text-sm outline-none focus:border-gh-accent"
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none text-gh-text-secondary cursor-pointer text-xs"
      >
        {visible ? 'Hide' : 'Show'}
      </button>
    </div>
  )
}
