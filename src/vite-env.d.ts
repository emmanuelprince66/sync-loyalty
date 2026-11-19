/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_GEOAPIFY_KEY?: string
  readonly VITE_PUBLIC_SITE_URL?: string
}
interface ImportMeta { readonly env: ImportMetaEnv }
