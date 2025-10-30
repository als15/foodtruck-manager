import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { usePostHog } from 'posthog-js/react'

/**
 * Hook to track page views with PostHog
 * Place this in your App component to automatically track route changes
 */
export const usePageViewTracking = () => {
  const location = useLocation()
  const posthog = usePostHog()

  useEffect(() => {
    if (posthog) {
      posthog.capture('$pageview')
    }
  }, [location, posthog])
}
