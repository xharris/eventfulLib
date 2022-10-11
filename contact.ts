import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eventful } from 'types'
import { api } from './api'

export const useContacts = ({ user }: { user?: Eventful.ID }) => {
  const query = useQuery<Eventful.User[]>(
    ['contacts', { user }],
    () => api.get(`contacts/${user}`).then((res) => res.data),
    {
      enabled: !!user,
    }
  )
  const qc = useQueryClient()

  const muAddContact = useMutation((userId: Eventful.ID) => api.post(`contact/add/${userId}`), {
    onSuccess: () => {
      qc.invalidateQueries(['contacts', { user }])
    },
  })

  const muRemoveContact = useMutation((userId: Eventful.ID) => api.delete(`contact/${userId}`), {
    onSuccess: () => {
      qc.invalidateQueries(['contacts', { user }])
    },
  })

  return {
    ...query,
    addContact: muAddContact.mutateAsync,
    removeContact: muRemoveContact.mutateAsync,
  }
}
