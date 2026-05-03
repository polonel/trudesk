import { useEffect } from 'react'
import { useThemeStore } from '../store/theme.store'

/**
 * Syncs the Zustand theme preference to the <html> `dark` class.
 * Must be rendered inside the React tree so Zustand is available,
 * but returns null — it's purely a side-effect component.
 */
export default function ThemeSync() {
  const theme = useThemeStore(s => s.theme)

  useEffect(() => {
    const apply = (dark: boolean) =>
      document.documentElement.classList.toggle('dark', dark)

    if (theme === 'dark') {
      apply(true)
      return
    }
    if (theme === 'light') {
      apply(false)
      return
    }

    // 'system' — mirror OS preference and react to changes
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    apply(mq.matches)
    const handler = (e: MediaQueryListEvent) => apply(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  return null
}
