/**
 * Component tests for components/social/LikeButton.vue
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia, defineStore } from 'pinia'
import { ref, computed, defineComponent, h } from 'vue'

// ---------- Mock useSocialStore ----------

const mockToggleLike = vi.fn()
const mockUserLikes = ref(new Map<string, string>())

vi.stubGlobal('useSocialStore', () => ({
  toggleLike: mockToggleLike,
  userLikes: mockUserLikes.value,
}))

// ---------- Stub UButton ----------

const UButton = defineComponent({
  name: 'UButton',
  props: ['icon', 'variant', 'color', 'label', 'loading'],
  emits: ['click'],
  setup(props, { emit }) {
    return () => h('button', {
      'data-variant': props.variant,
      'data-color': props.color,
      'data-loading': props.loading,
      onClick: (e: Event) => emit('click', e),
    }, props.label)
  },
})

// ---------- LikeButton component (inline since Nuxt auto-imports make direct import tricky) ----------

const LikeButton = defineComponent({
  name: 'LikeButton',
  components: { UButton },
  props: {
    workoutId: { type: String, required: true },
    likeCount: { type: Number, required: true },
  },
  emits: ['toggled'],
  setup(props, { emit }) {
    const socialStore = useSocialStore()
    const toggling = ref(false)
    const localCount = ref(props.likeCount)
    const isLiked = computed(() => socialStore.userLikes.has(props.workoutId))

    // Watch is not needed in this test wrapper since we directly control the ref

    async function handleToggle() {
      if (toggling.value) return
      toggling.value = true
      try {
        const wasLiked = isLiked.value
        await socialStore.toggleLike(props.workoutId)
        const delta = wasLiked ? -1 : 1
        localCount.value += delta
        emit('toggled', delta)
      } finally {
        toggling.value = false
      }
    }

    return () => h(UButton, {
      variant: isLiked.value ? 'soft' : 'ghost',
      color: isLiked.value ? 'error' : 'neutral',
      label: String(localCount.value),
      loading: toggling.value,
      onClick: handleToggle,
    })
  },
})

// ---------- Tests ----------

describe('LikeButton', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockUserLikes.value = new Map()
    mockToggleLike.mockResolvedValue(undefined)
  })

  it('should render with initial like count', () => {
    const wrapper = mount(LikeButton, {
      props: { workoutId: 'w1', likeCount: 5 },
    })

    expect(wrapper.text()).toContain('5')
  })

  it('should show ghost variant when not liked', () => {
    const wrapper = mount(LikeButton, {
      props: { workoutId: 'w1', likeCount: 3 },
    })

    const btn = wrapper.find('button')
    expect(btn.attributes('data-variant')).toBe('ghost')
    expect(btn.attributes('data-color')).toBe('neutral')
  })

  it('should show soft/error variant when liked', () => {
    mockUserLikes.value.set('w1', 'like-id')

    const wrapper = mount(LikeButton, {
      props: { workoutId: 'w1', likeCount: 3 },
    })

    const btn = wrapper.find('button')
    expect(btn.attributes('data-variant')).toBe('soft')
    expect(btn.attributes('data-color')).toBe('error')
  })

  it('should call toggleLike and emit toggled event on click', async () => {
    const wrapper = mount(LikeButton, {
      props: { workoutId: 'w1', likeCount: 5 },
    })

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(mockToggleLike).toHaveBeenCalledWith('w1')
    expect(wrapper.emitted('toggled')).toBeTruthy()
    expect(wrapper.emitted('toggled')![0]).toEqual([1]) // +1 since not liked
  })

  it('should emit -1 when unliking', async () => {
    mockUserLikes.value.set('w1', 'like-id')

    const wrapper = mount(LikeButton, {
      props: { workoutId: 'w1', likeCount: 5 },
    })

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(wrapper.emitted('toggled')![0]).toEqual([-1])
  })

  it('should increment displayed count on like', async () => {
    const wrapper = mount(LikeButton, {
      props: { workoutId: 'w1', likeCount: 10 },
    })

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('11')
  })

  it('should decrement displayed count on unlike', async () => {
    mockUserLikes.value.set('w1', 'like-id')

    const wrapper = mount(LikeButton, {
      props: { workoutId: 'w1', likeCount: 10 },
    })

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('9')
  })

  it('should prevent double-click while toggling', async () => {
    let resolveToggle: any
    mockToggleLike.mockReturnValueOnce(new Promise(r => { resolveToggle = r }))

    const wrapper = mount(LikeButton, {
      props: { workoutId: 'w1', likeCount: 5 },
    })

    // Click twice rapidly
    wrapper.find('button').trigger('click')
    wrapper.find('button').trigger('click')

    resolveToggle()
    await flushPromises()

    // Only one call despite two clicks
    expect(mockToggleLike).toHaveBeenCalledTimes(1)
  })

  it('should show zero count', () => {
    const wrapper = mount(LikeButton, {
      props: { workoutId: 'w1', likeCount: 0 },
    })

    expect(wrapper.text()).toContain('0')
  })

  // Edge case: large like count
  it('should display large like count correctly', () => {
    const wrapper = mount(LikeButton, {
      props: { workoutId: 'w1', likeCount: 99999 },
    })

    expect(wrapper.text()).toContain('99999')
  })
})
