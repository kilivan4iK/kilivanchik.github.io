<script setup lang="ts">
const mapbox = useMapbox()
const { isDesktopOrTablet } = useDevice()

const contents = ref()
const defaultHeight = ref('auto')
const panelHeight = ref('auto')

const visDesktop = ref(false)
const visMobile = ref(false)

const visibillity = computed(() => isDesktopOrTablet ? visDesktop.value : visMobile.value)

const lngLabel = computed(() => isDesktopOrTablet ? 'Longitude\u200A:' : 'Lng\u200A:')
const latLabel = computed(() => isDesktopOrTablet ? 'Latitude\u200A:' : 'Lat\u200A:')
const zoomLabel = computed(() => isDesktopOrTablet ? 'Zoom Lv\u200A:' : 'Zoom\u200A:')
const angleLabel = computed(() => isDesktopOrTablet ? 'Grid Angle\u200A:' : 'Angle\u200A:')

const cornerCoords = computed(() => {
  if (!mapbox.value.grid) {
    return {
      topLeft: '--, --',
      topRight: '--, --',
      bottomLeft: '--, --',
      bottomRight: '--, --',
    }
  }

  const { gridCorner } = getPoint(mapbox.value.grid)
  const format = (value: number) => Number.isFinite(value) ? value.toFixed(5) : '--'
  const toText = (longitude: number, latitude: number) => `${format(longitude)}, ${format(latitude)}`

  return {
    topLeft: toText(gridCorner.topleft.Longitude, gridCorner.topleft.Latitude),
    topRight: toText(gridCorner.topright.Longitude, gridCorner.topright.Latitude),
    bottomLeft: toText(gridCorner.bottomleft.Longitude, gridCorner.bottomleft.Latitude),
    bottomRight: toText(gridCorner.bottomright.Longitude, gridCorner.bottomright.Latitude),
  }
})

type CornerKey = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'

const copiedCorner = ref<CornerKey | null>(null)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

const copyByExecCommand = (text: string) => {
  if (typeof document === 'undefined') {
    return false
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  textarea.style.pointerEvents = 'none'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  const copied = document.execCommand('copy')
  document.body.removeChild(textarea)
  return copied
}

const copyCorner = async (corner: CornerKey) => {
  const value = cornerCoords.value[corner]
  if (value.includes('--')) {
    return
  }

  let copied = false
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value)
      copied = true
    } catch {
      copied = copyByExecCommand(value)
    }
  } else {
    copied = copyByExecCommand(value)
  }

  if (!copied) {
    return
  }

  copiedCorner.value = corner
  if (copiedTimer) {
    clearTimeout(copiedTimer)
  }
  copiedTimer = setTimeout(() => {
    copiedCorner.value = null
  }, 1200)
}

const changeVisibillity = () => {
  if (isDesktopOrTablet) {
    visDesktop.value = !visDesktop.value
  }
  else {
    visMobile.value = !visMobile.value
  }
}

const onLngLatChange = () => {
  setGrid(mapbox, [mapbox.value.settings.lng, mapbox.value.settings.lat], true)
}

const onZoomChange = () => {
  mapbox.value.map?.zoomTo(mapbox.value.settings.zoom)
}

const onAngleChange = () => {
  setGrid(mapbox, [mapbox.value.settings.lng, mapbox.value.settings.lat], false)
}

const heightSet = () => {
  nextTick(() => {
    const { height } = getComputedStyle(contents.value)
    defaultHeight.value = '0'
    panelHeight.value = height
  })
}

const onResize = () => {
  heightSet()
}

useListen('panel:updateHeight', () => {
  heightSet()
})

useListen('panel:tabChange', () => {
  heightSet()
})

onMounted(() => {
  window.addEventListener('resize', onResize, true)
  heightSet()
})

onBeforeUnmount(() => {
  if (copiedTimer) {
    clearTimeout(copiedTimer)
  }
})
</script>

<template>
  <div id="info-panel">
    <section class="header">
      <div class="item">
        <button class="fab" @click="changeVisibillity">
          <font-awesome-icon v-if="!visibillity" :icon="['fas', 'bars']" class="fa-fw fa-lg" />
          <font-awesome-icon v-else :icon="['fas', 'xmark']" class="fa-fw fa-xl" />
        </button>
      </div>
      <div class="item coordinates">
        <label class="label">{{ lngLabel }}</label>
        <NumberInput v-model="mapbox.settings.lng" class="input" :max="180" :min="-180" :step="0.00001" @change="onLngLatChange" />
        <label class="label">{{ latLabel }}</label>
        <NumberInput v-model="mapbox.settings.lat" :max="85" :min="-85" :step="0.00001" @change="onLngLatChange" />
      </div>
      <div class="item info">
        <label class="label">{{ zoomLabel }}</label>
        <NumberInput v-model="mapbox.settings.zoom" :max="22" :min="0" :step="0.01" @change="onZoomChange" />
        <label class="label">{{ angleLabel }}</label>
        <NumberInput v-model="mapbox.settings.angle" :max="180" :min="-180" :step="0.01" @change="onAngleChange" />
      </div>
    </section>
    <section class="corners">
      <div class="corner-item">
        <span class="corner-label">Top Left:</span>
        <button
          type="button"
          :disabled="cornerCoords.topLeft.includes('--')"
          :class="['corner-value', 'copyable', { copied: copiedCorner === 'topLeft' }]"
          :title="copiedCorner === 'topLeft' ? 'Copied' : 'Click to copy'"
          @click="copyCorner('topLeft')"
        >
          {{ cornerCoords.topLeft }}
        </button>
      </div>
      <div class="corner-item">
        <span class="corner-label">Top Right:</span>
        <button
          type="button"
          :disabled="cornerCoords.topRight.includes('--')"
          :class="['corner-value', 'copyable', { copied: copiedCorner === 'topRight' }]"
          :title="copiedCorner === 'topRight' ? 'Copied' : 'Click to copy'"
          @click="copyCorner('topRight')"
        >
          {{ cornerCoords.topRight }}
        </button>
      </div>
      <div class="corner-item">
        <span class="corner-label">Bottom Left:</span>
        <button
          type="button"
          :disabled="cornerCoords.bottomLeft.includes('--')"
          :class="['corner-value', 'copyable', { copied: copiedCorner === 'bottomLeft' }]"
          :title="copiedCorner === 'bottomLeft' ? 'Copied' : 'Click to copy'"
          @click="copyCorner('bottomLeft')"
        >
          {{ cornerCoords.bottomLeft }}
        </button>
      </div>
      <div class="corner-item">
        <span class="corner-label">Bottom Right:</span>
        <button
          type="button"
          :disabled="cornerCoords.bottomRight.includes('--')"
          :class="['corner-value', 'copyable', { copied: copiedCorner === 'bottomRight' }]"
          :title="copiedCorner === 'bottomRight' ? 'Copied' : 'Click to copy'"
          @click="copyCorner('bottomRight')"
        >
          {{ cornerCoords.bottomRight }}
        </button>
      </div>
    </section>
    <OverlayScrollbars :class="['setting', { 'm-active': visMobile, 'd-active': visDesktop }]">
      <section ref="contents" class="contents">
        <ContentsArea />
      </section>
    </OverlayScrollbars>
  </div>
</template>

<style lang="scss" scoped>
#info-panel {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: .375rem 0 0;
  border-radius: .375rem;
  color: $textColor;
  font-size: 1rem;
  z-index: 2;
  user-select: none;
  width: calc(27.5rem + 2px);
  max-width: calc(100vw - 20px);
  @include grass;
  :deep(.setting) {
    height: v-bind(defaultHeight);
    max-height: v-bind(defaultHeight);
    transition: .4s ease;
    &.d-active {
      height: v-bind(panelHeight);
      max-height: calc(100dvh - 4.5rem - 10px);
    }
    &.m-active {
      height: v-bind(panelHeight);
      max-height: calc(100dvh - 4.5rem - 84px);
    }
  }
  @include layout {
    width: calc(100vw - 71px);
    font-size: .875rem;
  }
}
.header {
  display: flex;
  justify-content: space-between;
  padding: 0 .75rem .375rem;
  :deep(.input-wrapper) {
    @include common-input;
    & {
      background-color: transparent;
      height: 1.5rem;
    }
    .input {
      text-align: right;
    }
  }
}

.item {
  display: grid;
  gap: 0 .25rem;
}
.coordinates {
  padding-right: calc(1rem - .125em);
  grid-template-columns: auto 6.5em;
  @media screen and (max-width: 410px) {
    grid-template-columns: auto 5.25em;
  }
}
.info {
  grid-template-columns: auto 4.75em;
  @media screen and (max-width: 410px) {
    grid-template-columns: auto 3.25em;
  }
}
.label {
  height: 1.5rem;
  line-height: 1.5;
}
.corners {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: .125rem .75rem;
  padding: 0 .75rem .375rem;
  font-size: .75em;
  @media screen and (max-width: 490px) {
    grid-template-columns: 1fr;
  }
}
.corner-item {
  display: flex;
  align-items: center;
  gap: .25rem;
  min-width: 0;
}
.corner-label {
  flex: 0 0 auto;
}
.corner-value {
  flex: 1 1 auto;
  min-width: 0;
  padding: 0 .25rem;
  line-height: 1.5;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-feature-settings: "tnum";
}
.copyable {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  border: solid 1px transparent;
  outline: none;
  color: inherit;
  font: inherit;
  background-color: rgba(255, 255, 255, .08);
  border-radius: .25rem;
  text-align: left;
  cursor: pointer;
  transition: .2s ease;
  &:hover, &:focus {
    color: aquamarine;
    border-color: rgba(127, 255, 212, .7);
    background-color: rgba(0, 206, 209, .22);
  }
  &.copied {
    color: aquamarine;
    border-color: rgba(127, 255, 212, .85);
    background-color: rgba(0, 206, 209, .22);
  }
  &:disabled {
    opacity: .65;
    cursor: default;
  }
}
.fab {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  border: none;
  outline: none;
  overflow: hidden;
  display: block;
  flex-shrink: 0;
  color: $textColor;
  height: 2.5rem;
  width: 2.5rem;
  border-radius: 100%;
  text-align: center;
  background-color: rgba(255, 255, 255, .2);
  line-height: 1;
  margin: auto 1rem auto 0;
  cursor: pointer;
  @include shadow-2;
  &:hover, &:focus {
    color: aquamarine;
    background-color: rgba(0, 206, 209, .35);
    @include shadow-3;
  }
  svg {
    margin: auto;
  }
}
.contents {
  padding: 0 .75rem;
}
</style>
