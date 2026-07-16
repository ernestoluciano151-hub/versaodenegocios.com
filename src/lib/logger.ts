export function logError(error: unknown, context?: string): void {
  const msg = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined
  const digest = (error as { digest?: string })?.digest
  console.error(JSON.stringify({
    level: 'ERROR',
    ts: new Date().toISOString(),
    context: context ?? 'unknown',
    message: msg,
    digest,
    stack,
  }))
}
