import { NavLink } from 'react-router-dom'
import { screenDefinitions } from '@renderer/routes'

export function SidebarNav(): React.JSX.Element {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-surface-border bg-surface-card">
      <div className="border-b border-surface-border px-shell py-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Focus OS</p>
        <h1 className="mt-1 text-lg font-semibold text-text-primary">Executive Assistant</h1>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Main navigation">
        {screenDefinitions.map((screen) => (
          <NavLink
            key={screen.path}
            to={screen.path}
            end={screen.path === '/'}
            className={({ isActive }) =>
              `focus-nav-item ${isActive ? 'focus-nav-item-active' : ''}`
            }
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-current opacity-60"
              aria-hidden="true"
            />
            {screen.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
