import { create } from 'zustand'

import ProjectType from '@models/Project.model'

type ProjectStoreState = {
  currentPage: number
  setCurrentPage: (page: number) => void
  projects: ProjectType[]
  setProjects: (projectList: ProjectType[]) => void
  getProjectById: (projectId: string) => ProjectType | null
  addProject: (project: ProjectType) => void
  updateProject: (projectId: string, partialProject: Partial<ProjectType>) => void
  deleteProject: (projectId: string) => void
}

export const useProjectStore = create<ProjectStoreState>((set, get) => ({
  currentPage: 0,
  setCurrentPage(page) {
    set(() => ({ currentPage: page }))
  },
  projects: [],
  setProjects(projectList) {
    set(() => ({ projects: projectList }))
  },
  getProjectById(projectId) {
    return get().projects.find((p) => p.id === projectId) || null
  },
  addProject(project) {
    set((state) => ({ projects: [...state.projects, project] }))
  },
  updateProject(projectId, partialProject) {
    set((state) => ({
      projects: state.projects.map((proj) => {
        if (proj.id === projectId) {
          return { ...proj, ...partialProject }
        }

        return proj
      })
    }))
  },
  deleteProject(projectId) {
    set((state) => ({ projects: state.projects.filter((p) => p.id !== projectId) }))
  }
}))
