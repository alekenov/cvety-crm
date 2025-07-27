import * as React from "react"

function useMediaQuery(query: string, defaultValue = false): boolean {
  const getMatches = (query: string): boolean => {
    // Prevent SSR issues
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches
    }
    return defaultValue
  }

  const [matches, setMatches] = React.useState<boolean>(() => getMatches(query))

  React.useEffect(() => {
    const matchMedia = window.matchMedia(query)

    // Triggered at the first client-side load and if query changes
    const handleChange = () => {
      setMatches(getMatches(query))
    }

    handleChange()

    // Listen for changes
    if (matchMedia.addListener) {
      matchMedia.addListener(handleChange)
    } else {
      matchMedia.addEventListener('change', handleChange)
    }

    return () => {
      if (matchMedia.removeListener) {
        matchMedia.removeListener(handleChange)
      } else {
        matchMedia.removeEventListener('change', handleChange)
      }
    }
  }, [query, defaultValue])

  return matches
}

// Modern implementation using useSyncExternalStore for better performance
function useMediaQuerySync(query: string, defaultValue = false): boolean {
  const subscribe = React.useCallback(
    (callback: () => void) => {
      const matchMedia = window.matchMedia(query)
      
      // Legacy support
      if (matchMedia.addListener) {
        matchMedia.addListener(callback)
      } else {
        matchMedia.addEventListener('change', callback)
      }
      
      return () => {
        if (matchMedia.removeListener) {
          matchMedia.removeListener(callback)
        } else {
          matchMedia.removeEventListener('change', callback)
        }
      }
    },
    [query]
  )

  const getSnapshot = () => {
    return window.matchMedia(query).matches
  }

  const getServerSnapshot = () => {
    return defaultValue
  }

  return React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )
}

// Export the modern implementation as default
export { useMediaQuerySync as useMediaQuery }

// Predefined media queries for common breakpoints
export const useIsMobile = () => useMediaQuery("(max-width: 768px)")
export const useIsTablet = () => useMediaQuery("(min-width: 768px) and (max-width: 1024px)")
export const useIsDesktop = () => useMediaQuery("(min-width: 1024px)")