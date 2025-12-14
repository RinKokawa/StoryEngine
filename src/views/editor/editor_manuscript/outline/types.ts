export type Chapter = { id: string; name: string; synopsis: string; content?: string }
export type Volume = { id: string; name: string; chapters?: Array<Chapter> }
