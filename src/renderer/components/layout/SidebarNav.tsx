import { NavLink } from 'react-router-dom'
import { screenDefinitions } from '@renderer/routes'
import { NavIcon } from './NavIcons'

export function SidebarNav(): React.JSX.Element {
  return (
    <aside className="relative z-10 flex w-[220px] shrink-0 flex-col border-r border-surface-border bg-surface-card/60 backdrop-blur-xl">
      <div className="border-b border-surface-border px-shell py-5">
        <div className="flex items-center gap-2">
          <span className="focus-live-dot" aria-hidden="true" />
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-accent-mint">
            System Online
          </p>
        </div>
        <h1 className="mt-2 font-display text-xl font-bold tracking-tight text-text-primary">
          Focus OS
        </h1>
        <p className="mt-0.5 text-xs text-text-muted">Automated day orchestration</p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-3" aria-label="Main navigation">
        {screenDefinitions.map((screen) => (
          <NavLink
            key={screen.path}
            to={screen.path}
            end={screen.path === '/'}
            className={({ isActive }) =>
              `focus-nav-item ${isActive ? 'focus-nav-item-active' : ''}`
            }
          >
            <NavIcon path={screen.path} />
            {screen.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-surface-border p-4">
        <p className="font-mono text-[10px] text-text-muted">v0.1.0 · Local engine</p>
      </div>
    </aside>
  )
}
