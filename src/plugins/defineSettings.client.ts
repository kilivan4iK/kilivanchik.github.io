import type { Settings } from '~/types/types'

function filterSettings(raw: any): Partial<Settings> {
  const filtered: Partial<Settings> = {}

  for (const key in raw) {
    if (key in initialValue) {
      filtered[key as keyof Settings] = raw[key]
    }
  }

  return filtered
}

const defineSettings = () => {
  const store: Settings = JSON.parse(localStorage.getItem('map-settings')!) || {}
  const filteredStore = filterSettings(store)
  const mergedStore = structuredClone({ ...initialValue, ...filteredStore })
  const config = useRuntimeConfig()

  if (!mergedStore.accessToken && config.public.mapboxToken) {
    mergedStore.accessToken = config.public.mapboxToken
  }

  return mergedStore
}

const resetSettings = () => {
  const store: Settings = structuredClone(initialValue)
  const config = useRuntimeConfig()

  if (!store.accessToken && config.public.mapboxToken) {
    store.accessToken = config.public.mapboxToken
  }

  return store
}

export default defineNuxtPlugin(() => {
  return {
    provide: {
      defineSettings,
      resetSettings,
    },
  }
})
