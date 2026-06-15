import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { screenDefinitions } from '@renderer/routes'
import { NavIcon } from '@renderer/components/layout/NavIcons'

interface ScreenIconRailProps {
  mobileOpen: boolean
  onMobileClose: () => void
}

export function ScreenIconRail({
  mobileOpen,
  onMobileClose,
}: ScreenIconRailProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(false)
  const location = useLocation()
  const showLabels = expanded || mobileOpen

  useEffect(() => {
    onMobileClose()
  }, [location.pathname, onMobileClose])

  const navLinkClass = (isActive: boolean): string =>
    `focus-nav-item ${isActive ? 'focus-nav-item-active' : ''} ${
      showLabels ? '' : 'justify-center px-2'
    }`

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          aria-label="Close navigation"
          onClick={onMobileClose}
        />
      ) : null}

      <aside
        className={`relative z-40 flex shrink-0 flex-col border-r border-surface-border bg-surface-card/95 backdrop-blur-xl transition-all duration-200 md:relative md:translate-x-0 ${
          mobileOpen
            ? 'fixed inset-y-0 left-0 w-[min(260px,88vw)] translate-x-0 shadow-panel'
            : 'max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:w-[min(260px,88vw)] max-md:-translate-x-full max-md:pointer-events-none'
        } ${expanded ? 'md:w-[200px]' : 'md:w-[52px]'}`}
        aria-hidden={!mobileOpen ? undefined : false}
      >
        <div className="flex items-center justify-between border-b border-surface-border p-2">
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="focus-btn-ghost hidden w-full px-2 py-2 text-xs md:inline-flex"
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse navigation rail' : 'Expand navigation rail'}
          >
            {expanded ? 'Collapse' : 'Menu'}
          </button>
          <button
            type="button"
            onClick={onMobileClose}
            className="focus-btn-ghost w-full px-2 py-2 text-xs md:hidden"
            aria-label="Close navigation"
          >
            Close
          </button>
        </div>

        <nav
          className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2"
          aria-label="Screen navigation"
        >
          <NavLink to="/" end className={({ isActive }) => navLinkClass(isActive)} title="Chat">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              className="h-4 w-4 shrink-0"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 10h8M8 14h5M6 4h12a2 2 0 012 2v10l-4-3H6a2 2 0 01-2-2V6a2 2 0 012-2z"
              />
            </svg>
            {showLabels ? <span>Chat</span> : null}
          </NavLink>

          {screenDefinitions.map((screen) => (
            <NavLink
              key={screen.path}
              to={screen.path}
              className={({ isActive }) => navLinkClass(isActive)}
              title={screen.label}
            >
              <NavIcon path={screen.path} />
              {showLabels ? <span className="truncate">{screen.label}</span> : null}
            </NavLink>
          ))}
        </nav>

        {location.pathname !== '/' ? (
          <div className="border-t border-surface-border p-2">
            <NavLink
              to="/"
              onClick={onMobileClose}
              className="focus-btn-ghost block w-full text-center text-xs"
            >
              {showLabels ? 'Back to chat' : 'Chat'}
            </NavLink>
          </div>
        ) : null}
      </aside>
    </>
  )
}
