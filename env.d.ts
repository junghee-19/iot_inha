declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL?: string;
  readonly VITE_CRAWL_API_URL?: string;
  readonly VITE_WS_URL?: string;
  readonly GEMINI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
