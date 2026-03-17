/**
 * Vitest global setup - provides Nuxt auto-import stubs for store tests.
 */
import { vi } from 'vitest'
import { ref, computed, watch, onMounted, reactive, toRefs } from 'vue'

// Stub Nuxt auto-imports that the store/components rely on
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('watch', watch)
vi.stubGlobal('onMounted', onMounted)
vi.stubGlobal('reactive', reactive)
vi.stubGlobal('toRefs', toRefs)
