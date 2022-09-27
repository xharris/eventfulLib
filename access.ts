import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Eventful } from 'types'
import { api, useSocket } from './api'
import { useSession } from './session'

export const useAccess = ({ user }: { user?: Eventful.ID }) => {
  const query = useQuery<Eventful.Access[]>(['accesses'], () => api.get(`access/${user}`), {
    enabled: !!user,
  })
  const qc = useQueryClient()

  const updateAccess = ({ ref, refModel, user, ...rest }: Eventful.API.AccessEdit) =>
    api.put(`access/${refModel}/${ref}/${user}`, rest)

  const { useOn } = useSocket()
  const { session } = useSession()
  useOn('access:change', (access: Eventful.Access) => {
    const transform = { tags: 'tag', events: 'event' }
    if (access.refModel in transform && session?._id === access.user) {
      qc.invalidateQueries([transform[access.refModel], { id: access.ref }])
      qc.invalidateQueries(['accesses'])
    }
  })

  return {
    ...query,
    updateAccess,
  }
}
