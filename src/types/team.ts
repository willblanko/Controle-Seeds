export type CourseStatus = 'Em progresso' | 'Completo' | 'Não feito'

export interface CourseData {
  status: CourseStatus
  completionYear?: string
}

export interface TeamMember {
  id: string
  name: string
  photoUrl: string
  dateOfBirth: string
  role: 'Líder' | 'Membro'
  sex?: 'Masculino' | 'Feminino'
  phone?: string
  entry_date?: string
  courses: {
    ebm: CourseData
    te: CourseData
    TE?: string
    EBM?: string
  }
}
