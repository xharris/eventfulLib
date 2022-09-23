export * from '../libs/log'

export interface Logging {
  methods: {
    debug: (...args: any[]) => any
    info: (...args: any[]) => any
    warn: (...args: any[]) => any
    error: (...args: any[]) => any
  }
  extend: (extension: string) => Logging['methods']
  getLogs?: () => Promise<string | void>
}
