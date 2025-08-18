export interface Professor {
  id: number
  name: string
  subjects: string[]
}

export interface Review {
  id: number
  review: string
  created_at: string
  didatic_quality: number
  material_quality: number
  exams_difficulty: number
  personality: number
  requires_presence: boolean
  exam_method: string
  anonymous: boolean
  subject_name: string
}

export interface User {
  id: number
  email: string
  verified: boolean
}

export interface ApiResponse<T> {
  data: T
  page?: number
  pageSize?: number
  total?: number
}

export interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}
