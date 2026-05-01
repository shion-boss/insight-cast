export const TOOL_PATHS = ['/dashboard', '/projects', '/interviews', '/articles', '/settings', '/onboarding']

export function classifyArea(path: string): 'tool' | 'admin' | 'site' {
  if (path.startsWith('/admin')) return 'admin'
  if (TOOL_PATHS.some((p) => path === p || path.startsWith(p + '/'))) return 'tool'
  return 'site'
}

export function isSitePath(path: string): boolean {
  return classifyArea(path) === 'site'
}
