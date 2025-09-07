export interface Subject {
  id: number
  name: string
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
  subject_name: string
}

export interface User {
  id: number
  email: string
  verifiedAt: string | null
  isAdmin: boolean
}
