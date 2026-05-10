declare module '*/migration/index' {
  interface Migrations {
    run: (callback: (err?: any) => void) => void
  }
  const migrations: Migrations
  export = migrations
}
