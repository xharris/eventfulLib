import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useThrottleFn } from 'react-use'
import { Eventful } from 'types'
import { api } from './api'
import useDebounce from 'react-use/lib/useDebounce'

export const useUserSearch = () => {
  const [users, setUsers] = useState<Eventful.User[]>([])
  const [query, setQuery] = useState('')

  useDebounce(
    () =>
      query.length > 0
        ? api
            .get(`users/search/${query}`)
            .then((res) => setUsers(res.data))
            .catch(() => setUsers([]))
        : Promise.resolve().then(() => setUsers([])),
    200,
    [query]
  )

  return {
    data: users,
    search: setQuery,
  }
}
