const withTrailingSlash = (url: string) => (url.endsWith('/') ? url : `${url}/`)

export const env = {
  apiBaseUrl: withTrailingSlash(import.meta.env.VITE_API_BASE_URL || '/api/v1/'),
  /** Browser key for Geoapify address search (Shipbubble pickup). Optional: without it the form uses state/city pickers. */
  geoapifyKey: import.meta.env.VITE_GEOAPIFY_KEY?.trim() || '',
}
