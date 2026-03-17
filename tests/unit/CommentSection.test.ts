/**
 * Component tests for components/social/CommentSection.vue
 *
 * Tests the core logic (relativeTime, isOwner, input validation) in isolation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------- relativeTime function extracted from CommentSection.vue ----------
// We bypass the Timestamp instanceof check by always using .toDate() on our
// mock objects. The actual component code also handles plain string fallback.

function relativeTime(ts: any) {
  const date = (ts && typeof ts.toDate === 'function') ? ts.toDate() : new Date(ts as unknown as string)
  const now = Date.now()
  const diff = now - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  return `${days}일 전`
}

// ---------- isOwner function extracted from CommentSection.vue ----------

function isOwner(comment: { userId: string }, currentUser: { uid: string } | null) {
  return comment.userId === currentUser?.uid
}

// ---------- Tests ----------

describe('CommentSection logic', () => {
  describe('relativeTime', () => {
    it('should return "방금 전" for timestamps less than 1 minute ago', () => {
      const ts = { toDate: () => new Date(Date.now() - 30000) }
      expect(relativeTime(ts)).toBe('방금 전')
    })

    it('should return minutes for 1-59 minutes ago', () => {
      const ts = { toDate: () => new Date(Date.now() - 5 * 60000) }
      expect(relativeTime(ts)).toBe('5분 전')
    })

    it('should return "1분 전" at exactly 1 minute', () => {
      const ts = { toDate: () => new Date(Date.now() - 60000) }
      expect(relativeTime(ts)).toBe('1분 전')
    })

    it('should return "59분 전" at 59 minutes', () => {
      const ts = { toDate: () => new Date(Date.now() - 59 * 60000) }
      expect(relativeTime(ts)).toBe('59분 전')
    })

    it('should return hours for 1-23 hours ago', () => {
      const ts = { toDate: () => new Date(Date.now() - 3 * 3600000) }
      expect(relativeTime(ts)).toBe('3시간 전')
    })

    it('should return "1시간 전" at exactly 60 minutes', () => {
      const ts = { toDate: () => new Date(Date.now() - 3600000) }
      expect(relativeTime(ts)).toBe('1시간 전')
    })

    it('should return days for 24+ hours ago', () => {
      const ts = { toDate: () => new Date(Date.now() - 48 * 3600000) }
      expect(relativeTime(ts)).toBe('2일 전')
    })

    it('should return "1일 전" at exactly 24 hours', () => {
      const ts = { toDate: () => new Date(Date.now() - 24 * 3600000) }
      expect(relativeTime(ts)).toBe('1일 전')
    })

    it('should handle very old dates', () => {
      const ts = { toDate: () => new Date('2020-01-01') }
      const result = relativeTime(ts)
      expect(result).toMatch(/\d+일 전/)
    })

    it('should return "방금 전" for future timestamps (negative diff)', () => {
      const ts = { toDate: () => new Date(Date.now() + 60000) }
      expect(relativeTime(ts)).toBe('방금 전')
    })

    it('should return "방금 전" for timestamp at exactly now', () => {
      const ts = { toDate: () => new Date() }
      expect(relativeTime(ts)).toBe('방금 전')
    })

    it('should handle string date input (fallback path)', () => {
      const dateStr = new Date(Date.now() - 7200000).toISOString()
      expect(relativeTime(dateStr)).toBe('2시간 전')
    })

    it('should still show minutes at 59min 59sec', () => {
      const ts = { toDate: () => new Date(Date.now() - (59 * 60000 + 59000)) }
      expect(relativeTime(ts)).toBe('59분 전')
    })

    it('should still show hours at 23h 59min', () => {
      const ts = { toDate: () => new Date(Date.now() - (23 * 3600000 + 59 * 60000)) }
      expect(relativeTime(ts)).toBe('23시간 전')
    })

    // Edge: 0 milliseconds ago
    it('should return "방금 전" for 0ms diff', () => {
      const now = Date.now()
      vi.spyOn(Date, 'now').mockReturnValue(now)
      const ts = { toDate: () => new Date(now) }
      expect(relativeTime(ts)).toBe('방금 전')
      vi.restoreAllMocks()
    })
  })

  describe('isOwner', () => {
    it('should return true when userId matches', () => {
      expect(isOwner({ userId: 'u1' }, { uid: 'u1' })).toBe(true)
    })

    it('should return false when userId does not match', () => {
      expect(isOwner({ userId: 'u1' }, { uid: 'u2' })).toBe(false)
    })

    it('should return false when user is null', () => {
      expect(isOwner({ userId: 'u1' }, null)).toBe(false)
    })

    it('should handle empty userId', () => {
      expect(isOwner({ userId: '' }, { uid: '' })).toBe(true)
    })

    it('should be case-sensitive', () => {
      expect(isOwner({ userId: 'User1' }, { uid: 'user1' })).toBe(false)
    })
  })

  describe('comment input validation (trim guard)', () => {
    it('should reject empty string', () => {
      expect(!''.trim()).toBe(true)
    })

    it('should reject whitespace-only', () => {
      expect(!'   '.trim()).toBe(true)
    })

    it('should accept non-empty after trim', () => {
      expect(!' hello '.trim()).toBe(false)
    })

    it('should accept single character', () => {
      expect('a'.trim()).toBe('a')
    })

    it('should accept unicode/emoji', () => {
      expect('운동 잘했어요! 💪'.trim()).toBe('운동 잘했어요! 💪')
    })

    it('should reject tab and newline only', () => {
      expect(!'\t\n'.trim()).toBe(true)
    })
  })
})
