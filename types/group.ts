import type { Timestamp } from 'firebase/firestore'

export interface GroupDoc {
  name: string
  description: string
  imageUrl: string
  createdBy: string
  createdByName: string
  createdAt: Timestamp
  memberCount: number
  isPublic: boolean
}

export interface Group extends GroupDoc {
  id: string
}

export interface GroupMemberDoc {
  userId: string
  displayName: string
  photoURL: string
  joinedAt: Timestamp
  role: 'admin' | 'member'
}

export interface GroupMember extends GroupMemberDoc {
  id: string
}

export interface GroupFormData {
  name: string
  description: string
  imageFile: File | null
}
