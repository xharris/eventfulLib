import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { Eventful } from 'types'
import { api, useSocket } from './api'
import { useSession } from './session'

export const useAccess = ({ user }: { user?: Eventful.ID } = {}) => {
  const query = useQuery<Eventful.API.AccessGet>(
    ['accesses'],
    () => api.get(`access/${user}`).then((res) => res.data),
    {
      enabled: !!user,
    }
  )
  const qc = useQueryClient()

  const updateAccess = ({ ref, refModel, user, ...rest }: Eventful.API.AccessEdit) =>
    api.put(`access/${refModel}/${ref}/${user}`, rest)

  const { useOn } = useSocket()
  const { session } = useSession()
  useOn('access:change', (access: Eventful.Access) => {
    const transform = { tags: 'tag', events: 'event', users: 'user', plans: 'plan', pings: 'ping' }
    if (access.refModel && access.refModel in transform && session?._id === access.user) {
      qc.invalidateQueries([access.refModel])
      qc.invalidateQueries([transform[access.refModel], { id: access.ref }])
      qc.invalidateQueries(['accesses'])
    }
  })

  const findAccess = useCallback(
    ({ refModel, ref, user: findUser }: Pick<Eventful.Access, 'refModel' | 'ref' | 'user'>) =>
      refModel === 'events'
        ? query.data?.events.find((ev) => ev.ref === ref && ev.user === findUser)
        : refModel === 'tags'
        ? query.data?.tags.find((ev) => ev.ref === ref && ev.user === findUser)
        : null,
    [query]
  )

  return {
    ...query,
    findAccess,
    updateAccess,
  }
}
