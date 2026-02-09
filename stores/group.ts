import { defineStore } from 'pinia'
import {
  collection, doc, addDoc, deleteDoc, getDoc, getDocs, setDoc, updateDoc,
  query, where, orderBy, Timestamp, increment,
} from 'firebase/firestore'
import type { Group, GroupMember, GroupFormData } from '~/types/group'

const DEFAULT_GROUP_ID = 'default-edl-2026'

export const useGroupStore = defineStore('group', () => {
  const db = useFirestore()
  const user = useCurrentUser()

  const groups = ref<Group[]>([])
  const myGroups = ref<Group[]>([])
  const currentGroupId = ref<string | null>(null)
  const currentGroup = ref<Group | null>(null)
  const groupMembers = ref<GroupMember[]>([])
  const loading = ref(false)
  const submitting = ref(false)

  // 현재 선택된 그룹 정보 (computed)
  const selectedGroup = computed(() => {
    if (!currentGroupId.value) return null
    return myGroups.value.find(g => g.id === currentGroupId.value) ?? null
  })

  // 전체 공개 그룹 목록 가져오기
  async function fetchAllGroups() {
    if (!db) return

    loading.value = true
    try {
      const q = query(
        collection(db, 'groups'),
        where('isPublic', '==', true),
        orderBy('memberCount', 'desc'),
      )
      const snapshot = await getDocs(q)
      groups.value = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      } as Group))
    } finally {
      loading.value = false
    }
  }

  // 내가 속한 그룹 목록 가져오기
  async function fetchMyGroups() {
    if (!db || !user.value) return

    loading.value = true
    try {
      // 먼저 사용자 문서에서 groupIds 가져오기
      const userDoc = await getDoc(doc(db, 'users', user.value.uid))

      // 사용자 문서가 없으면 빈 배열 반환
      if (!userDoc.exists()) {
        myGroups.value = []
        return
      }

      const userData = userDoc.data()
      const groupIds = userData?.groupIds ?? []

      if (groupIds.length === 0) {
        myGroups.value = []
        return
      }

      // 그룹 정보 가져오기 (최대 30개씩 청크)
      const chunks: string[][] = []
      for (let i = 0; i < groupIds.length; i += 30) {
        chunks.push(groupIds.slice(i, i + 30))
      }

      const fetchedGroups: Group[] = []
      for (const chunk of chunks) {
        const q = query(
          collection(db, 'groups'),
          where('__name__', 'in', chunk),
        )
        const snapshot = await getDocs(q)
        snapshot.docs.forEach(d => {
          fetchedGroups.push({ id: d.id, ...d.data() } as Group)
        })
      }

      myGroups.value = fetchedGroups
    } catch (err) {
      console.error('Failed to fetch my groups:', err)
      myGroups.value = []
    } finally {
      loading.value = false
    }
  }

  // 그룹 상세 정보 가져오기
  async function fetchGroupById(groupId: string): Promise<Group | null> {
    if (!db) return null

    const docSnap = await getDoc(doc(db, 'groups', groupId))
    if (!docSnap.exists()) return null
    return { id: docSnap.id, ...docSnap.data() } as Group
  }

  // 그룹 멤버 목록 가져오기
  async function fetchGroupMembers(groupId: string) {
    if (!db) return

    loading.value = true
    try {
      const q = query(
        collection(db, 'groups', groupId, 'members'),
        orderBy('joinedAt', 'asc'),
      )
      const snapshot = await getDocs(q)
      groupMembers.value = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      } as GroupMember))
    } finally {
      loading.value = false
    }
  }

  // 그룹 생성
  async function createGroup(formData: GroupFormData, imageUrl: string = '') {
    if (!db || !user.value) throw new Error('Not authenticated')

    submitting.value = true
    try {
      const groupData = {
        name: formData.name,
        description: formData.description,
        imageUrl,
        createdBy: user.value.uid,
        createdByName: user.value.displayName || 'Unknown',
        createdAt: Timestamp.now(),
        memberCount: 1,
        isPublic: true,
      }

      const docRef = await addDoc(collection(db, 'groups'), groupData)

      // 생성자를 admin으로 멤버에 추가
      await setDoc(doc(db, 'groups', docRef.id, 'members', user.value.uid), {
        userId: user.value.uid,
        displayName: user.value.displayName || 'Unknown',
        photoURL: user.value.photoURL || '',
        joinedAt: Timestamp.now(),
        role: 'admin',
      })

      // 사용자의 groupIds에 추가
      const userRef = doc(db, 'users', user.value.uid)
      const userDoc = await getDoc(userRef)
      const currentGroupIds = userDoc.data()?.groupIds ?? []
      await updateDoc(userRef, {
        groupIds: [...currentGroupIds, docRef.id],
      })

      return docRef.id
    } finally {
      submitting.value = false
    }
  }

  // 그룹 가입
  async function joinGroup(groupId: string) {
    if (!db || !user.value) throw new Error('Not authenticated')

    submitting.value = true
    try {
      // 이미 가입되어 있는지 확인
      const memberDoc = await getDoc(doc(db, 'groups', groupId, 'members', user.value.uid))
      if (memberDoc.exists()) {
        throw new Error('Already a member of this group')
      }

      // 멤버 추가
      await setDoc(doc(db, 'groups', groupId, 'members', user.value.uid), {
        userId: user.value.uid,
        displayName: user.value.displayName || 'Unknown',
        photoURL: user.value.photoURL || '',
        joinedAt: Timestamp.now(),
        role: 'member',
      })

      // 그룹의 memberCount 증가
      await updateDoc(doc(db, 'groups', groupId), {
        memberCount: increment(1),
      })

      // 사용자의 groupIds에 추가
      const userRef = doc(db, 'users', user.value.uid)
      const userDoc = await getDoc(userRef)
      const currentGroupIds = userDoc.data()?.groupIds ?? []
      if (!currentGroupIds.includes(groupId)) {
        await updateDoc(userRef, {
          groupIds: [...currentGroupIds, groupId],
        })
      }

      // 로컬 상태 업데이트
      await fetchMyGroups()
    } finally {
      submitting.value = false
    }
  }

  // 그룹 탈퇴
  async function leaveGroup(groupId: string) {
    if (!db || !user.value) throw new Error('Not authenticated')

    submitting.value = true
    try {
      // 멤버 삭제
      await deleteDoc(doc(db, 'groups', groupId, 'members', user.value.uid))

      // 그룹의 memberCount 감소
      await updateDoc(doc(db, 'groups', groupId), {
        memberCount: increment(-1),
      })

      // 사용자의 groupIds에서 제거
      const userRef = doc(db, 'users', user.value.uid)
      const userDoc = await getDoc(userRef)
      const currentGroupIds = userDoc.data()?.groupIds ?? []
      await updateDoc(userRef, {
        groupIds: currentGroupIds.filter((id: string) => id !== groupId),
      })

      // 현재 선택된 그룹이 탈퇴한 그룹이면 초기화
      if (currentGroupId.value === groupId) {
        currentGroupId.value = null
      }

      // 로컬 상태 업데이트
      myGroups.value = myGroups.value.filter(g => g.id !== groupId)
    } finally {
      submitting.value = false
    }
  }

  // 그룹 삭제 (멤버가 없을 때)
  async function deleteGroup(groupId: string) {
    if (!db || !user.value) throw new Error('Not authenticated')

    submitting.value = true
    try {
      // 하위 멤버 문서 모두 삭제
      const membersSnapshot = await getDocs(collection(db, 'groups', groupId, 'members'))
      await Promise.all(membersSnapshot.docs.map(d => deleteDoc(d.ref)))

      // 그룹 문서 삭제
      await deleteDoc(doc(db, 'groups', groupId))

      // 사용자의 groupIds에서 제거
      const userRef = doc(db, 'users', user.value.uid)
      const userDoc = await getDoc(userRef)
      const currentGroupIds = userDoc.data()?.groupIds ?? []
      await updateDoc(userRef, {
        groupIds: currentGroupIds.filter((id: string) => id !== groupId),
      })

      // 현재 선택된 그룹이면 초기화
      if (currentGroupId.value === groupId) {
        currentGroupId.value = null
      }

      // 로컬 상태 업데이트
      myGroups.value = myGroups.value.filter(g => g.id !== groupId)
      groups.value = groups.value.filter(g => g.id !== groupId)
    } finally {
      submitting.value = false
    }
  }

  // 그룹 정보 수정
  async function updateGroup(groupId: string, data: { name?: string; description?: string; imageUrl?: string }) {
    if (!db || !user.value) throw new Error('Not authenticated')

    submitting.value = true
    try {
      await updateDoc(doc(db, 'groups', groupId), data)

      // 로컬 상태 업데이트
      const updateLocal = (g: Group) => {
        if (g.id !== groupId) return g
        return { ...g, ...data }
      }
      myGroups.value = myGroups.value.map(updateLocal)
      groups.value = groups.value.map(updateLocal)
    } finally {
      submitting.value = false
    }
  }

  // 현재 그룹 선택
  function selectGroup(groupId: string | null) {
    currentGroupId.value = groupId
    // localStorage에 저장하여 새로고침 시에도 유지
    if (import.meta.client) {
      if (groupId) {
        localStorage.setItem('selectedGroupId', groupId)
      } else {
        localStorage.removeItem('selectedGroupId')
      }
    }
  }

  // 저장된 그룹 선택 복원
  function restoreSelectedGroup() {
    if (import.meta.client) {
      const savedGroupId = localStorage.getItem('selectedGroupId')
      if (savedGroupId && myGroups.value.some(g => g.id === savedGroupId)) {
        currentGroupId.value = savedGroupId
      }
    }
  }

  // 사용자가 특정 그룹의 멤버인지 확인
  function isMemberOf(groupId: string): boolean {
    return myGroups.value.some(g => g.id === groupId)
  }

  // 사용자가 특정 그룹의 관리자인지 확인
  async function isAdminOf(groupId: string): Promise<boolean> {
    if (!db || !user.value) return false
    const memberDoc = await getDoc(doc(db, 'groups', groupId, 'members', user.value.uid))
    return memberDoc.data()?.role === 'admin'
  }

  // 멤버 역할 변경 (admin ↔ member)
  async function updateMemberRole(groupId: string, userId: string, role: 'admin' | 'member') {
    if (!db || !user.value) throw new Error('Not authenticated')

    await updateDoc(doc(db, 'groups', groupId, 'members', userId), { role })

    // 로컬 상태 업데이트
    const member = groupMembers.value.find(m => m.userId === userId)
    if (member) member.role = role
  }

  // 멤버 강퇴
  async function removeMember(groupId: string, userId: string) {
    if (!db || !user.value) throw new Error('Not authenticated')

    // 멤버 문서 삭제
    await deleteDoc(doc(db, 'groups', groupId, 'members', userId))

    // 대상 사용자의 groupIds에서 해당 그룹 제거
    const targetUserRef = doc(db, 'users', userId)
    const targetUserDoc = await getDoc(targetUserRef)
    if (targetUserDoc.exists()) {
      const currentGroupIds = targetUserDoc.data()?.groupIds ?? []
      await updateDoc(targetUserRef, {
        groupIds: currentGroupIds.filter((id: string) => id !== groupId),
      })
    }

    // 그룹 memberCount 감소
    await updateDoc(doc(db, 'groups', groupId), {
      memberCount: increment(-1),
    })

    // 로컬 상태 업데이트
    groupMembers.value = groupMembers.value.filter(m => m.userId !== userId)
  }

  return {
    groups,
    myGroups,
    currentGroupId,
    currentGroup,
    groupMembers,
    selectedGroup,
    loading,
    submitting,
    fetchAllGroups,
    fetchMyGroups,
    fetchGroupById,
    fetchGroupMembers,
    createGroup,
    joinGroup,
    leaveGroup,
    deleteGroup,
    updateGroup,
    selectGroup,
    restoreSelectedGroup,
    isMemberOf,
    isAdminOf,
    updateMemberRole,
    removeMember,
    DEFAULT_GROUP_ID,
  }
})
