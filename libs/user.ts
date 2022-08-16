import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Eventful } from 'types'
import { api } from './api'

export const useUser = ({ id: _id, username }: { id?: string; username?: string }) => {
  const [id, setId] = useState(_id)
  const query = useQuery<Eventful.User>(
    ['user', { id }],
    () => api.get(`user/${id}`).then((res) => res.data),
    {
      enabled: !!id,
    }
  )

  useEffect(() => {
    if (username) {
      api.get(`user/${username}`).then((res) => setId(res.data._id))
    }
  }, [username])

  return {
    ...query,
  }
}
