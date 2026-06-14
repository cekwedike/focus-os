import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function useAppNavigationEvents(): void {
  const navigate = useNavigate()

  useEffect(() => {
    return window.focusOS.onNavigate((payload) => {
      navigate(payload.path)
    })
  }, [navigate])
}
