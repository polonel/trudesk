export type LocalVerifyDone = (err: Error | null, user?: Express.User | false, options?: { flash: string }) => void
export type TotpVerifyDone = (err: Error | false | null, key?: string, period?: number) => void
export type JwtVerifyDone = (err: { type: string } | null, user?: Express.User) => void
