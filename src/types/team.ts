export type CourseStatus = 'Em progresso' | 'Completo' | 'Não feito'

export interface CourseData {
  status: CourseStatus
  completionYear?: string
}

export interface TeamMember {
  id: string
  name: string
  photoUrl: string
  email: string
  dateOfBirth: string
  role: 'Líder' | 'Membro'
  courses: {
    cme: CourseData
    ebm: CourseData
    te: CourseData
  }
}
