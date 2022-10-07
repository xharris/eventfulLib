import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eventful } from 'types'
import { api } from './api'

export const useTags = ({ user }: { user?: Eventful.ID }) => {
  const qc = useQueryClient()
  const query = useQuery<Eventful.API.TagGet[]>(['tags'], () =>
    api.get(`user/${user}/tags`).then((res) => res.data)
  )

  const muAddTag = useMutation((body?: Eventful.API.TagEdit) => api.post('tag/create', body), {
    onSuccess() {
      qc.invalidateQueries(['tags'])
    },
  })

  return {
    ...query,
    addTag: muAddTag.mutateAsync,
  }
}

export const useTag = ({ tag }: { tag?: Eventful.ID }) => {
  const qc = useQueryClient()
  const query = useQuery<Eventful.API.TagGet>(['tag', { tag }], () =>
    api.get(`tag/${tag}`).then((res) => res.data)
  )

  const muEditTag = useMutation((body: Eventful.API.TagEdit) => api.put(`tag/${tag}`, body), {
    onSuccess() {
      qc.invalidateQueries(['tag', { tag }])
      qc.invalidateQueries(['event'])
      qc.invalidateQueries(['events'])
    },
  })

  return {
    ...query,
    updateTag: muEditTag.mutateAsync,
  }
}
