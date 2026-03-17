/**
 * Unit tests for stores/social.ts
 *
 * Firebase Firestore is fully mocked. We test the store's business logic:
 * toggleLike, addComment, deleteComment, fetchComments, resetGallery, etc.
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'

// ---------- Mock Firebase Firestore ----------

const mockBatch = {
  set: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  commit: vi.fn().mockResolvedValue(undefined),
}

const mockGetDocs = vi.fn()
const mockGetDoc = vi.fn()

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db: any, ...pathSegments: string[]) => ({
    path: pathSegments.join('/'),
    type: 'collection',
  })),
  doc: vi.fn((...args: any[]) => {
    // doc(collection) - auto-id
    if (args.length === 1 && args[0]?.type === 'collection') {
      return { id: 'auto-generated-id', path: `${args[0].path}/auto-generated-id` }
    }
    // doc(db, collection, id)
    return { id: args[2] ?? 'unknown', path: `${args[1]}/${args[2] ?? 'unknown'}` }
  }),
  addDoc: vi.fn().mockResolvedValue({ id: 'new-doc-id' }),
  deleteDoc: vi.fn().mockResolvedValue(undefined),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  updateDoc: vi.fn().mockResolvedValue(undefined),
  query: vi.fn((_col: any, ...constraints: any[]) => ({ _col, constraints })),
  where: vi.fn((field: string, op: string, value: any) => ({ field, op, value, type: 'where' })),
  orderBy: vi.fn((field: string, dir?: string) => ({ field, dir, type: 'orderBy' })),
  limit: vi.fn((n: number) => ({ n, type: 'limit' })),
  startAfter: vi.fn((doc: any) => ({ doc, type: 'startAfter' })),
  Timestamp: {
    now: vi.fn(() => ({ toMillis: () => Date.now(), toDate: () => new Date() })),
    fromDate: vi.fn((d: Date) => ({ toMillis: () => d.getTime(), toDate: () => d })),
  },
  increment: vi.fn((n: number) => ({ _increment: n })),
  writeBatch: vi.fn(() => mockBatch),
}))

// ---------- Mock Nuxt auto-imports ----------

const mockUser = ref<{ uid: string; displayName: string; photoURL: string } | null>({
  uid: 'user-1',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
})

const mockDb = {} // Truthy placeholder for Firestore instance

vi.stubGlobal('useFirestore', () => mockDb)
vi.stubGlobal('useCurrentUser', () => mockUser)

// ---------- Import the store AFTER mocks ----------

// We need to dynamically import since the store uses auto-imports
const { useSocialStore } = await import('../../stores/social')

// ---------- Tests ----------

describe('useSocialStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockBatch.set.mockClear()
    mockBatch.update.mockClear()
    mockBatch.delete.mockClear()
    mockBatch.commit.mockResolvedValue(undefined)
    mockUser.value = {
      uid: 'user-1',
      displayName: 'Test User',
      photoURL: 'https://example.com/photo.jpg',
    }
  })

  // ========== LIKES ==========

  describe('toggleLike', () => {
    it('should add a like when not yet liked', async () => {
      const store = useSocialStore()

      await store.toggleLike('workout-1')

      expect(mockBatch.set).toHaveBeenCalledOnce()
      expect(mockBatch.update).toHaveBeenCalledOnce()
      expect(mockBatch.commit).toHaveBeenCalledOnce()
      expect(store.userLikes.has('workout-1')).toBe(true)
    })

    it('should remove a like when already liked', async () => {
      const store = useSocialStore()
      // Pre-set the like
      store.userLikes.set('workout-1', 'like-doc-id')

      await store.toggleLike('workout-1')

      expect(mockBatch.delete).toHaveBeenCalledOnce()
      expect(mockBatch.update).toHaveBeenCalledOnce()
      expect(mockBatch.commit).toHaveBeenCalledOnce()
      expect(store.userLikes.has('workout-1')).toBe(false)
    })

    it('should do nothing when user is not logged in', async () => {
      mockUser.value = null
      const store = useSocialStore()

      await store.toggleLike('workout-1')

      expect(mockBatch.commit).not.toHaveBeenCalled()
    })

    it('should toggle like on different workouts independently', async () => {
      const store = useSocialStore()

      await store.toggleLike('workout-1')
      await store.toggleLike('workout-2')

      expect(store.userLikes.has('workout-1')).toBe(true)
      expect(store.userLikes.has('workout-2')).toBe(true)
    })

    it('should toggle same workout twice (like then unlike)', async () => {
      const store = useSocialStore()

      await store.toggleLike('workout-1')
      expect(store.userLikes.has('workout-1')).toBe(true)

      await store.toggleLike('workout-1')
      expect(store.userLikes.has('workout-1')).toBe(false)
    })
  })

  // ========== COMMENTS ==========

  describe('fetchComments', () => {
    it('should fetch and sort comments by createdAt', async () => {
      const store = useSocialStore()
      const ts1 = { toMillis: () => 1000 }
      const ts2 = { toMillis: () => 2000 }
      const ts3 = { toMillis: () => 500 }

      mockGetDocs.mockResolvedValueOnce({
        docs: [
          { id: 'c1', data: () => ({ workoutId: 'w1', content: 'First', createdAt: ts1 }) },
          { id: 'c2', data: () => ({ workoutId: 'w1', content: 'Second', createdAt: ts2 }) },
          { id: 'c3', data: () => ({ workoutId: 'w1', content: 'Earliest', createdAt: ts3 }) },
        ],
      })

      await store.fetchComments('w1')

      expect(store.comments).toHaveLength(3)
      // Should be sorted ascending by createdAt
      expect(store.comments[0].content).toBe('Earliest')
      expect(store.comments[1].content).toBe('First')
      expect(store.comments[2].content).toBe('Second')
    })

    it('should set commentsLoading during fetch', async () => {
      const store = useSocialStore()
      let resolvePromise: any
      mockGetDocs.mockReturnValueOnce(new Promise(r => { resolvePromise = r }))

      const fetchPromise = store.fetchComments('w1')
      expect(store.commentsLoading).toBe(true)

      resolvePromise({ docs: [] })
      await fetchPromise
      expect(store.commentsLoading).toBe(false)
    })

    it('should reset commentsLoading even if fetch throws', async () => {
      const store = useSocialStore()
      mockGetDocs.mockRejectedValueOnce(new Error('Firestore error'))

      await expect(store.fetchComments('w1')).rejects.toThrow('Firestore error')
      expect(store.commentsLoading).toBe(false)
    })

    it('should handle empty comments', async () => {
      const store = useSocialStore()
      mockGetDocs.mockResolvedValueOnce({ docs: [] })

      await store.fetchComments('w1')
      expect(store.comments).toEqual([])
    })
  })

  describe('addComment', () => {
    it('should add a comment and update local state', async () => {
      const store = useSocialStore()

      await store.addComment('workout-1', 'Great workout!')

      expect(mockBatch.set).toHaveBeenCalledOnce()
      expect(mockBatch.update).toHaveBeenCalledOnce()
      expect(mockBatch.commit).toHaveBeenCalledOnce()
      expect(store.comments).toHaveLength(1)
      expect(store.comments[0].content).toBe('Great workout!')
      expect(store.comments[0].userId).toBe('user-1')
      expect(store.comments[0].userName).toBe('Test User')
    })

    it('should use "Unknown" when displayName is null', async () => {
      mockUser.value = { uid: 'user-1', displayName: null as any, photoURL: null as any }
      const store = useSocialStore()

      await store.addComment('workout-1', 'Hello')

      expect(store.comments[0].userName).toBe('Unknown')
      expect(store.comments[0].userPhoto).toBe('')
    })

    it('should do nothing when user is not logged in', async () => {
      mockUser.value = null
      const store = useSocialStore()

      await store.addComment('workout-1', 'Hello')

      expect(mockBatch.commit).not.toHaveBeenCalled()
      expect(store.comments).toHaveLength(0)
    })

    it('should append multiple comments in order', async () => {
      const store = useSocialStore()

      await store.addComment('w1', 'Comment 1')
      await store.addComment('w1', 'Comment 2')
      await store.addComment('w1', 'Comment 3')

      expect(store.comments).toHaveLength(3)
      expect(store.comments.map(c => c.content)).toEqual([
        'Comment 1', 'Comment 2', 'Comment 3',
      ])
    })
  })

  describe('deleteComment', () => {
    it('should remove a comment from local state', async () => {
      const store = useSocialStore()
      // Seed some comments
      store.comments.push(
        { id: 'c1', workoutId: 'w1', content: 'Keep', createdAt: {} as any, userId: 'u1', userName: 'A', userPhoto: '' },
        { id: 'c2', workoutId: 'w1', content: 'Delete me', createdAt: {} as any, userId: 'u1', userName: 'A', userPhoto: '' },
      )

      await store.deleteComment('c2', 'w1')

      expect(mockBatch.delete).toHaveBeenCalledOnce()
      expect(mockBatch.commit).toHaveBeenCalledOnce()
      expect(store.comments).toHaveLength(1)
      expect(store.comments[0].id).toBe('c1')
    })

    it('should handle deleting non-existent comment gracefully', async () => {
      const store = useSocialStore()
      store.comments.push(
        { id: 'c1', workoutId: 'w1', content: 'Exists', createdAt: {} as any, userId: 'u1', userName: 'A', userPhoto: '' },
      )

      await store.deleteComment('non-existent', 'w1')

      // Still commits the batch (Firestore handles the 404)
      expect(mockBatch.commit).toHaveBeenCalledOnce()
      // Local state unchanged since filter didn't match
      expect(store.comments).toHaveLength(1)
    })
  })

  // ========== GALLERY ==========

  describe('resetGallery', () => {
    it('should reset all gallery state', () => {
      const store = useSocialStore()
      store.galleryWorkouts.push({ id: 'w1' } as any)
      store.galleryHasMore = false

      store.resetGallery()

      expect(store.galleryWorkouts).toEqual([])
      expect(store.galleryHasMore).toBe(true)
    })
  })

  describe('fetchGalleryPage', () => {
    it('should fetch workouts and update gallery state', async () => {
      const store = useSocialStore()

      mockGetDocs.mockResolvedValueOnce({
        docs: Array.from({ length: 12 }, (_, i) => ({
          id: `w${i}`,
          data: () => ({ userId: 'u1', workoutType: 'running', date: {}, imageUrl: '', memo: '' }),
        })),
      })
      // loadUserLikesForWorkouts will also call getDocs
      mockGetDocs.mockResolvedValueOnce({ docs: [] })

      await store.fetchGalleryPage(12)

      expect(store.galleryWorkouts).toHaveLength(12)
      expect(store.galleryHasMore).toBe(true)
    })

    it('should set galleryHasMore=false when fewer results than pageSize', async () => {
      const store = useSocialStore()

      mockGetDocs.mockResolvedValueOnce({
        docs: [
          { id: 'w1', data: () => ({ userId: 'u1', workoutType: 'running' }) },
        ],
      })
      mockGetDocs.mockResolvedValueOnce({ docs: [] })

      await store.fetchGalleryPage(12)

      expect(store.galleryWorkouts).toHaveLength(1)
      expect(store.galleryHasMore).toBe(false)
    })

    it('should not fetch if already loading', async () => {
      const store = useSocialStore()
      ;(store as any).galleryLoading = true

      await store.fetchGalleryPage(12)

      expect(mockGetDocs).not.toHaveBeenCalled()
    })

    it('should handle group filter with empty members', async () => {
      const store = useSocialStore()

      // getDocs for members collection returns empty
      mockGetDocs.mockResolvedValueOnce({ docs: [] })

      await store.fetchGalleryPage(12, { workoutType: null, groupId: 'group-1' })

      expect(store.galleryHasMore).toBe(false)
    })

    it('should handle group filter with <= 30 members using in-query', async () => {
      const store = useSocialStore()
      const memberDocs = Array.from({ length: 5 }, (_, i) => ({ id: `user-${i}` }))

      // First getDocs: members
      mockGetDocs.mockResolvedValueOnce({ docs: memberDocs })
      // Second getDocs: workouts
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          { id: 'w1', data: () => ({ userId: 'user-0', workoutType: 'running' }) },
        ],
      })
      // Third getDocs: loadUserLikesForWorkouts
      mockGetDocs.mockResolvedValueOnce({ docs: [] })

      await store.fetchGalleryPage(12, { workoutType: null, groupId: 'group-1' })

      expect(store.galleryWorkouts).toHaveLength(1)
    })

    it('should handle group filter with > 30 members using client-side filtering', async () => {
      const store = useSocialStore()
      const memberDocs = Array.from({ length: 35 }, (_, i) => ({ id: `user-${i}` }))

      // First getDocs: members
      mockGetDocs.mockResolvedValueOnce({ docs: memberDocs })
      // Second getDocs: workouts (includes some non-member workouts)
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          { id: 'w1', data: () => ({ userId: 'user-0', workoutType: 'running' }) },
          { id: 'w2', data: () => ({ userId: 'outsider', workoutType: 'running' }) },
          { id: 'w3', data: () => ({ userId: 'user-5', workoutType: 'yoga' }) },
        ],
      })
      // Third getDocs: loadUserLikesForWorkouts
      mockGetDocs.mockResolvedValueOnce({ docs: [] })

      await store.fetchGalleryPage(12, { workoutType: null, groupId: 'group-1' })

      // 'outsider' should be filtered out
      expect(store.galleryWorkouts).toHaveLength(2)
      expect(store.galleryWorkouts.map(w => w.id)).toEqual(['w1', 'w3'])
    })

    it('should use lastGalleryDoc cursor for pagination', async () => {
      const store = useSocialStore()

      // First page
      mockGetDocs.mockResolvedValueOnce({
        docs: Array.from({ length: 12 }, (_, i) => ({
          id: `w${i}`,
          data: () => ({ userId: 'u1', workoutType: 'running', date: {}, imageUrl: '', memo: '' }),
        })),
      })
      mockGetDocs.mockResolvedValueOnce({ docs: [] }) // loadUserLikesForWorkouts

      await store.fetchGalleryPage(12)
      expect(store.galleryWorkouts).toHaveLength(12)

      // Second page (uses startAfter cursor)
      mockGetDocs.mockResolvedValueOnce({
        docs: Array.from({ length: 5 }, (_, i) => ({
          id: `w${12 + i}`,
          data: () => ({ userId: 'u1', workoutType: 'running', date: {}, imageUrl: '', memo: '' }),
        })),
      })
      mockGetDocs.mockResolvedValueOnce({ docs: [] }) // loadUserLikesForWorkouts

      await store.fetchGalleryPage(12)
      expect(store.galleryWorkouts).toHaveLength(17) // 12 + 5
      expect(store.galleryHasMore).toBe(false)
    })

    it('should apply workoutType filter', async () => {
      const store = useSocialStore()

      mockGetDocs.mockResolvedValueOnce({
        docs: [
          { id: 'w1', data: () => ({ userId: 'u1', workoutType: 'yoga' }) },
        ],
      })
      mockGetDocs.mockResolvedValueOnce({ docs: [] })

      await store.fetchGalleryPage(12, { workoutType: 'yoga', groupId: null })

      expect(store.galleryWorkouts).toHaveLength(1)
    })

    it('should reset galleryLoading on error', async () => {
      const store = useSocialStore()

      mockGetDocs.mockRejectedValueOnce(new Error('Network error'))

      await expect(store.fetchGalleryPage(12)).rejects.toThrow('Network error')
      expect(store.galleryLoading).toBe(false)
    })
  })

  // ========== LOAD USER LIKES ==========

  describe('loadUserLikesForWorkouts', () => {
    it('should populate userLikes map from firestore docs', async () => {
      const store = useSocialStore()

      mockGetDocs.mockResolvedValueOnce({
        docs: [
          { id: 'like-1', data: () => ({ workoutId: 'w1', userId: 'user-1' }) },
          { id: 'like-2', data: () => ({ workoutId: 'w2', userId: 'user-1' }) },
        ],
      })

      await store.loadUserLikesForWorkouts(['w1', 'w2'])

      expect(store.userLikes.get('w1')).toBe('like-1')
      expect(store.userLikes.get('w2')).toBe('like-2')
    })

    it('should skip when workoutIds is empty', async () => {
      const store = useSocialStore()

      await store.loadUserLikesForWorkouts([])

      expect(mockGetDocs).not.toHaveBeenCalled()
    })

    it('should skip when user is not logged in', async () => {
      mockUser.value = null
      const store = useSocialStore()

      await store.loadUserLikesForWorkouts(['w1'])

      expect(mockGetDocs).not.toHaveBeenCalled()
    })

    it('should chunk workoutIds larger than 30', async () => {
      const store = useSocialStore()
      const ids = Array.from({ length: 61 }, (_, i) => `w${i}`)

      // 3 chunks: 30, 30, 1
      mockGetDocs.mockResolvedValue({ docs: [] })

      await store.loadUserLikesForWorkouts(ids)

      // getDocs should be called 3 times (3 chunks)
      expect(mockGetDocs).toHaveBeenCalledTimes(3)
    })
  })

  // ========== RANKINGS ==========

  describe('fetchRankings', () => {
    it('should return empty rankings when no groupId and no myGroupIds', async () => {
      const store = useSocialStore()

      await store.fetchRankings()

      expect(store.rankings).toEqual([])
    })

    it('should return empty rankings when groupId has no members', async () => {
      const store = useSocialStore()

      // getDoc for group
      mockGetDoc.mockResolvedValueOnce({ data: () => ({ createdAt: null }) })
      // getDocs for members
      mockGetDocs.mockResolvedValueOnce({ docs: [] })

      await store.fetchRankings('group-1')

      expect(store.rankings).toEqual([])
    })

    it('should aggregate rankings across multiple groups via myGroupIds', async () => {
      const store = useSocialStore()

      // getDocs for group g1 members
      mockGetDocs.mockResolvedValueOnce({ docs: [{ id: 'user-1' }, { id: 'user-2' }] })
      // getDocs for group g2 members (user-2 is shared, user-3 is unique)
      mockGetDocs.mockResolvedValueOnce({ docs: [{ id: 'user-2' }, { id: 'user-3' }] })

      // queryInChunks for users (3 unique users)
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          { id: 'user-1', data: () => ({ displayName: 'Alice', photoURL: '', stats: {} }) },
          { id: 'user-2', data: () => ({ displayName: 'Bob', photoURL: '', stats: {} }) },
          { id: 'user-3', data: () => ({ displayName: 'Charlie', photoURL: '', stats: {} }) },
        ],
      })
      // queryInChunks for workouts
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          { id: 'w1', data: () => ({ userId: 'user-1', workoutType: 'running', date: { toDate: () => new Date() } }) },
          { id: 'w2', data: () => ({ userId: 'user-3', workoutType: 'yoga', date: { toDate: () => new Date() } }) },
        ],
      })

      await store.fetchRankings(undefined, ['g1', 'g2'])

      expect(store.rankings).toHaveLength(3)
      const alice = store.rankings.find(r => r.userId === 'user-1')!
      expect(alice.totalWorkouts).toBe(1)
      const bob = store.rankings.find(r => r.userId === 'user-2')!
      expect(bob.totalWorkouts).toBe(0)
      const charlie = store.rankings.find(r => r.userId === 'user-3')!
      expect(charlie.totalWorkouts).toBe(1)
    })

    it('should return empty rankings when myGroupIds provided but no members found', async () => {
      const store = useSocialStore()

      // getDocs for each group's members
      mockGetDocs.mockResolvedValueOnce({ docs: [] })
      mockGetDocs.mockResolvedValueOnce({ docs: [] })

      await store.fetchRankings(undefined, ['g1', 'g2'])

      expect(store.rankings).toEqual([])
    })

    it('should set rankingsLoading during fetch', async () => {
      const store = useSocialStore()

      expect(store.rankingsLoading).toBe(false)

      let resolveGroup: any
      mockGetDoc.mockReturnValueOnce(new Promise(r => { resolveGroup = r }))
      mockGetDocs.mockResolvedValueOnce({ docs: [] })

      const fetchPromise = store.fetchRankings('group-1')
      expect(store.rankingsLoading).toBe(true)

      resolveGroup({ data: () => ({}) })
      await fetchPromise
      expect(store.rankingsLoading).toBe(false)
    })

    it('should aggregate workout data per user for a specific group', async () => {
      const store = useSocialStore()
      const groupCreatedAt = { toDate: () => new Date('2024-01-01') }

      // getDoc for group + getDocs for members (parallel)
      mockGetDoc.mockResolvedValueOnce({ data: () => ({ createdAt: groupCreatedAt }) })
      mockGetDocs.mockResolvedValueOnce({ docs: [{ id: 'user-1' }, { id: 'user-2' }] })

      // queryInChunks for users
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          { id: 'user-1', data: () => ({ displayName: 'Alice', photoURL: 'a.jpg', stats: {} }) },
          { id: 'user-2', data: () => ({ displayName: 'Bob', photoURL: 'b.jpg', stats: {} }) },
        ],
      })
      // queryInChunks for workouts
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          { id: 'w1', data: () => ({ userId: 'user-1', workoutType: 'running', date: { toDate: () => new Date('2024-06-01') } }) },
          { id: 'w2', data: () => ({ userId: 'user-1', workoutType: 'yoga', date: { toDate: () => new Date('2024-07-01') } }) },
          { id: 'w3', data: () => ({ userId: 'user-2', workoutType: 'running', date: { toDate: () => new Date('2024-05-01') } }) },
        ],
      })

      await store.fetchRankings('group-1')

      expect(store.rankings).toHaveLength(2)

      const alice = store.rankings.find(r => r.userId === 'user-1')!
      expect(alice.displayName).toBe('Alice')
      expect(alice.totalWorkouts).toBe(2)
      expect(alice.workoutTypeStats).toHaveLength(2)

      const bob = store.rankings.find(r => r.userId === 'user-2')!
      expect(bob.totalWorkouts).toBe(1)
    })
  })
})
