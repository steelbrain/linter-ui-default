// Electron types
declare module 'electron' {
  export const shell: {
    openExternal(url: string): void
  }
}
