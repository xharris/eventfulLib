import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eventful } from 'types'
import { api } from './api'
import { useSession } from './session'

export const useSettings = () => {
  const { session } = useSession()
  const query = useQuery(
    ['settings'],
    () =>
      api.get<Eventful.API.SettingsGet>(`user/${session?._id}/settings`).then((res) => res.data),
    { enabled: !!session }
  )
  const qc = useQueryClient()

  const setSettings = useMutation(
    (settings: Eventful.API.SettingsEdit) => api.put(`user/${session?._id}/settings`, settings),
    {
      onSuccess: () => {
        qc.invalidateQueries(['settings'])
      },
    }
  )

  return {
    ...query,
    setSettings: setSettings.mutateAsync,
  }
}
