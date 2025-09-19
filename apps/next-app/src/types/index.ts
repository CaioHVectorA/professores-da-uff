export interface Subject {
  id: number
  name: string
  semester?: string
}

export interface Professor {
  id: number
  name: string
  subjects: Subject[] | string[]
  reviewCount?: number
  averages?: {
    didatic: number
    material: number
    difficulty: number
    personality: number
  }
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
  approved: boolean
  subject_name: string
  user_id?: number | null
  user_name?: string | null
}

export interface User {
  id: number
  email: string
  verifiedAt: string | null
  isAdmin: boolean
}

export interface Course {
  id: number
  name: string
}

export interface Report {
  id: number
  userId: number
  experience: string
  suggestion: string
  createdAt: string
}
