import { useState } from 'react'
import PatInput from './PatInput'
import UserChip from './UserChip'

const inputClass =
  'px-3 py-2 rounded-lg border border-gh-border bg-gh-card text-gh-text-primary text-sm outline-none focus:border-gh-accent'

interface SettingsDrawerProps {
  open: boolean
  onClose: () => void
  pat: string
  setPat: (v: string) => void
  users: string[]
  setUsers: (v: string[]) => void
}

export default function SettingsDrawer({
  open,
  onClose,
  pat,
  setPat,
  users,
  setUsers,
}: SettingsDrawerProps) {
  const [userInput, setUserInput] = useState('')

  function addUser() {
    const u = userInput.trim().toLowerCase()
    if (u && !users.includes(u)) {
      setUsers([...users, u])
    }
    setUserInput('')
  }

  function removeUser(username: string) {
    setUsers(users.filter((x) => x !== username))
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-20 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[340px] bg-gh-bg border-l border-gh-border z-30 transform transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gh-border">
          <h2 className="text-base font-semibold">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="bg-transparent border-none text-gh-text-secondary hover:text-gh-text-primary cursor-pointer text-xl leading-none p-1"
          >
            &times;
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5 overflow-y-auto h-[calc(100%-57px)]">
          {/* PAT section */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gh-text-secondary font-medium uppercase tracking-wider">
              Personal Access Token
            </label>
            <PatInput value={pat} onChange={setPat} />
            <p className="text-[11px] text-gh-text-secondary">
              Requires <code className="bg-gh-badge px-1 py-0.5 rounded text-[11px]">read:user</code> scope.
              Stored in your browser only.
            </p>
          </div>

          {/* Users section */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gh-text-secondary font-medium uppercase tracking-wider">
              Users
            </label>
            <div className="flex gap-2">
              <input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addUser()
                }}
                placeholder="Add username..."
                className={`${inputClass} flex-1`}
              />
              <button
                type="button"
                onClick={addUser}
                className="px-3 py-2 rounded-lg border-none cursor-pointer font-semibold text-sm transition-opacity hover:opacity-85 bg-gh-badge text-gh-text-primary"
              >
                Add
              </button>
            </div>
            {users.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {users.map((u) => (
                  <UserChip key={u} username={u} onRemove={() => removeUser(u)} />
                ))}
              </div>
            )}
            {users.length === 0 && (
              <p className="text-[12px] text-gh-text-secondary">
                No users added yet. Add GitHub usernames above.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
