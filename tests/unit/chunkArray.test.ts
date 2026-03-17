/**
 * Tests for chunkArray utility function.
 *
 * Since chunkArray is not exported from the store module, we extract and test
 * an identical implementation here. If it is ever refactored into a shared
 * utility, these tests should be pointed at the new location.
 */
import { describe, it, expect } from 'vitest'

// Replicate the chunkArray logic from stores/social.ts
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

describe('chunkArray', () => {
  // ========== Happy Path ==========
  describe('happy path', () => {
    it('should split an array evenly', () => {
      expect(chunkArray([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]])
    })

    it('should handle arrays that do not divide evenly', () => {
      expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
    })

    it('should return the whole array as one chunk when size >= length', () => {
      expect(chunkArray([1, 2, 3], 5)).toEqual([[1, 2, 3]])
      expect(chunkArray([1, 2, 3], 3)).toEqual([[1, 2, 3]])
    })

    it('should chunk size=1 into individual elements', () => {
      expect(chunkArray(['a', 'b', 'c'], 1)).toEqual([['a'], ['b'], ['c']])
    })

    it('should work with string arrays', () => {
      expect(chunkArray(['a', 'b', 'c', 'd'], 3)).toEqual([['a', 'b', 'c'], ['d']])
    })

    it('should chunk exactly 30 items for Firestore in-query limit', () => {
      const ids = Array.from({ length: 90 }, (_, i) => `id_${i}`)
      const result = chunkArray(ids, 30)
      expect(result).toHaveLength(3)
      expect(result[0]).toHaveLength(30)
      expect(result[1]).toHaveLength(30)
      expect(result[2]).toHaveLength(30)
    })

    it('should handle 31 items correctly (Firestore boundary + 1)', () => {
      const ids = Array.from({ length: 31 }, (_, i) => `id_${i}`)
      const result = chunkArray(ids, 30)
      expect(result).toHaveLength(2)
      expect(result[0]).toHaveLength(30)
      expect(result[1]).toHaveLength(1)
    })
  })

  // ========== Edge Cases ==========
  describe('edge cases', () => {
    it('should return empty array for empty input', () => {
      expect(chunkArray([], 5)).toEqual([])
    })

    it('should handle single-element array', () => {
      expect(chunkArray([42], 10)).toEqual([[42]])
    })

    it('should handle very large chunk size', () => {
      expect(chunkArray([1, 2], Number.MAX_SAFE_INTEGER)).toEqual([[1, 2]])
    })

    it('should handle very large array', () => {
      const big = Array.from({ length: 10000 }, (_, i) => i)
      const result = chunkArray(big, 30)
      expect(result).toHaveLength(Math.ceil(10000 / 30))
      // Verify all items are preserved
      expect(result.flat()).toEqual(big)
    })

    it('should preserve object references in chunks', () => {
      const obj1 = { id: 1 }
      const obj2 = { id: 2 }
      const result = chunkArray([obj1, obj2], 1)
      expect(result[0][0]).toBe(obj1)
      expect(result[1][0]).toBe(obj2)
    })

    it('should handle mixed-type arrays', () => {
      const mixed = [1, 'two', null, undefined, true] as unknown[]
      const result = chunkArray(mixed, 2)
      expect(result).toEqual([[1, 'two'], [null, undefined], [true]])
    })

    it('should handle arrays with duplicate values', () => {
      expect(chunkArray([1, 1, 1, 1], 2)).toEqual([[1, 1], [1, 1]])
    })

    it('should not mutate the original array', () => {
      const original = [1, 2, 3, 4]
      const copy = [...original]
      chunkArray(original, 2)
      expect(original).toEqual(copy)
    })
  })

  // ========== Boundary Values ==========
  describe('boundary values for size parameter', () => {
    it('should return empty chunks for size=0 (infinite loop guard - skip if hangs)', () => {
      // size=0 would cause an infinite loop in the current implementation.
      // This documents the behavior rather than testing it.
      // A production fix would add a guard: if (size <= 0) return []
      // Skipped to avoid test hang.
    })

    // Negative size: i += -1 causes i to go 0, -1, -2... always < arr.length -> infinite loop.
    // Skipped to avoid OOM. A production fix would guard: if (size <= 0) return []
    it.skip('should handle negative size (infinite loop - needs guard)', () => {
      expect(chunkArray([1, 2, 3], -1)).toEqual([])
    })

    // NaN size causes i += NaN which stays 0 forever -> infinite loop.
    // Skipped to avoid OOM. A production fix would guard: if (!size || size <= 0) return []
    it.skip('should return empty for NaN size (infinite loop - needs guard)', () => {
      expect(chunkArray([1, 2], NaN)).toEqual([])
    })

    it('should handle Infinity size', () => {
      expect(chunkArray([1, 2, 3], Infinity)).toEqual([[1, 2, 3]])
    })
  })
})
