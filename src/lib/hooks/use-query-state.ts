import { useCallback, useEffect, useState } from 'react'

export interface UseQueryStateOptions<T = string> {
  defaultValue?: T
  history?: 'replace' | 'push'
  serialize?: (value: T) => string
  deserialize?: (value: string | null) => T | null
  clearOnDefault?: boolean
  scroll?: boolean
}

type SetStateAction<T> = (T | null) | ((prevState: T | null) => T | null)

const QUERY_STATE_EVENT = 'astro-query-state-change'

interface QueryStateCustomEventDetail {
  key: string
  value: string | null
}

const getSearchParamFromUrl = (key: string): string | null => {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  return params.get(key)
}

const updateUrlQueryParam = (
  key: string,
  value: string | null,
  historyMode: 'replace' | 'push' = 'replace',
  scroll: boolean = false
) => {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)
  const currentVal = url.searchParams.get(key)

  if (value === null || value === '') {
    if (!url.searchParams.has(key)) return
    url.searchParams.delete(key)
  } else {
    if (currentVal === value) return
    url.searchParams.set(key, value)
  }

  const newSearch = url.searchParams.toString()
  const newRelativePathQuery = url.pathname + (newSearch ? `?${newSearch}` : '') + url.hash

  if (historyMode === 'push') {
    window.history.pushState(window.history.state, '', newRelativePathQuery)
  } else {
    window.history.replaceState(window.history.state, '', newRelativePathQuery)
  }

  if (scroll) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Notify other query-state hooks
  window.dispatchEvent(
    new CustomEvent<QueryStateCustomEventDetail>(QUERY_STATE_EVENT, {
      detail: { key, value },
    })
  )
}

/**
 * React hook to synchronize state with URL query parameters without page reloads (similar to nuqs).
 * Works reliably in Astro client islands.
 *
 * @param key The query parameter key (e.g. 's', 'q', 'category')
 * @param options Options for default value, history mode, serialization and deserialization
 * @returns [state, setState] tuple
 */
export function useQueryState<T = string>(
  key: string,
  options: UseQueryStateOptions<T> = {}
): [
  T | null,
  (action: SetStateAction<T>, overrideOptions?: Partial<UseQueryStateOptions<T>>) => void,
] {
  const {
    defaultValue = null as unknown as T,
    history = 'replace',
    serialize = (val: T) => (typeof val === 'string' ? val : String(val)),
    deserialize = (val: string | null) => val as unknown as T | null,
    clearOnDefault = true,
    scroll = false,
  } = options

  const [state, setState] = useState<T | null>(defaultValue)
  // 2. Read from URL after hydration completes
  useEffect(() => {
    const raw = getSearchParamFromUrl(key)
    if (raw !== null) {
      const parsed = deserialize(raw)
      setState(parsed !== null ? parsed : defaultValue)
    }
    const syncFromUrl = () => {
      const currentRaw = getSearchParamFromUrl(key)
      if (currentRaw !== null) {
        const parsed = deserialize(currentRaw)
        setState(parsed !== null ? parsed : defaultValue)
      } else {
        setState(defaultValue)
      }
    }
    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<QueryStateCustomEventDetail>
      if (customEvent.detail && customEvent.detail.key === key) {
        const customRaw = customEvent.detail.value
        if (customRaw !== null) {
          const parsed = deserialize(customRaw)
          setState(parsed !== null ? parsed : defaultValue)
        } else {
          setState(defaultValue)
        }
      }
    }
    window.addEventListener('popstate', syncFromUrl)
    window.addEventListener(QUERY_STATE_EVENT, handleCustomChange)
    return () => {
      window.removeEventListener('popstate', syncFromUrl)
      window.removeEventListener(QUERY_STATE_EVENT, handleCustomChange)
    }
  }, [key, defaultValue, deserialize])

  const setQueryState = useCallback(
    (action: SetStateAction<T>, overrideOptions?: Partial<UseQueryStateOptions<T>>) => {
      const effectiveHistory = overrideOptions?.history ?? history
      const effectiveClearOnDefault = overrideOptions?.clearOnDefault ?? clearOnDefault
      const effectiveScroll = overrideOptions?.scroll ?? scroll

      setState(prevState => {
        const nextValue =
          typeof action === 'function'
            ? (action as (prevState: T | null) => T | null)(prevState)
            : action

        let serialized: string | null = null

        if (nextValue === null || nextValue === undefined || nextValue === '') {
          serialized = null
        } else if (
          effectiveClearOnDefault &&
          defaultValue !== null &&
          defaultValue !== undefined &&
          nextValue === defaultValue
        ) {
          serialized = null
        } else {
          serialized = serialize(nextValue)
        }

        updateUrlQueryParam(key, serialized, effectiveHistory, effectiveScroll)

        return nextValue
      })
    },
    [key, history, clearOnDefault, scroll, defaultValue, serialize]
  )

  return [state, setQueryState]
}
