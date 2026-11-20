/** biome-ignore-all lint/style/useNamedCaptureGroup: unnecessary */
export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function slugify(s: string) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/gu, '')
    .replace(/[\s_]+/gu, '-')
    .replace(/-+/gu, '-')
}

export function camelToTitleCase(s: string) {
  if (!s) {
    return s
  }
  return (
    s
      .replace(/([a-z0-9])([A-Z])/gu, '$1 $2')
      .replace(/([A-Z]+)([A-Z][a-z])/gu, '$1 $2')
      .replace(/[_-]+/gu, ' ')
      // biome-ignore lint/performance/useTopLevelRegex: unnecessary
      .split(/\s+/u)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  )
}
