export type FormState =
  | {
      error?: string
      message?: string
      link?: string
      credentials?: { email: string; password: string }
    }
  | undefined
