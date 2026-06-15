import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { screenDefinitions } from '@renderer/routes'
import { NavIcon } from '@renderer/components/layout/NavIcons'

export function ScreenIconRail(): React.JSX.Element {
  const [expanded, setExpanded] = useState(false)
  const location = useLocation()

  return (
    <aside
      className={`relative z-10 flex shrink-0 flex-col border-r border-surface-border bg-surface-card/60 backdrop-blur-xl transition-all duration-200 ${
        expanded ? 'w-[200px]' : 'w-[52px]'
      }`}
    >
      <div className="flex items-center justify-between border-b border-surface-border p-2">
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="focus-btn-ghost w-full px-2 py-2 text-xs"
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse navigation rail' : 'Expand navigation rail'}
        >
          {expanded ? 'Collapse' : 'Menu'}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-2" aria-label="Screen navigation">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `focus-nav-item ${isActive ? 'focus-nav-item-active' : ''} ${expanded ? '' : 'justify-center px-2'}`
          }
          title="Chat"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5M6 4h12a2 2 0 012 2v10l-4-3H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
          </svg>
          {expanded && <span>Chat</span>}
        </NavLink>

        {screenDefinitions.map((screen) => (
          <NavLink
            key={screen.path}
            to={screen.path}
            className={({ isActive }) =>
              `focus-nav-item ${isActive ? 'focus-nav-item-active' : ''} ${expanded ? '' : 'justify-center px-2'}`
            }
            title={screen.label}
          >
            <NavIcon path={screen.path} />
            {expanded && <span>{screen.label}</span>}
          </NavLink>
        ))}
      </nav>

      {location.pathname !== '/' && (
        <div className="border-t border-surface-border p-2">
          <NavLink to="/" className="focus-btn-ghost block w-full text-center text-xs">
            {expanded ? 'Back to chat' : 'Chat'}
          </NavLink>
        </div>
      )}
    </aside>
  )
}
