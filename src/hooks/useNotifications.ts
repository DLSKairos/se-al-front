import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { notificationsApi } from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/authStore'
import type { AppNotification } from '@/types'

const PAGE_SIZE = 15

interface NotificationsPage {
  data: AppNotification[]
  total: number
}

/**
 * Hook principal para el centro de notificaciones.
 *
 * - Carga las notificaciones del usuario paginadas (infinite query).
 * - Expone mutaciones para marcar como leída y marcar todas como leídas.
 * - Devuelve el conteo de no leídas calculado a partir de los datos en caché.
 */
export function useNotifications() {
  const queryClient = useQueryClient()
  const token = useAuthStore((s) => s.token)

  // ── Infinite query ────────────────────────────────────────────────────────

  const query = useInfiniteQuery<NotificationsPage>({
    queryKey: QK.appNotifications.list(),
    queryFn: async ({ pageParam }) => {
      const page = typeof pageParam === 'number' ? pageParam : 1
      const res = await notificationsApi.list({ page, limit: PAGE_SIZE })
      return res.data as NotificationsPage
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.flatMap((p) => p.data).length
      return loaded < lastPage.total ? allPages.length + 1 : undefined
    },
    staleTime: 30_000,
    enabled: !!token,
  })

  // Aplanar todas las páginas
  const notifications: AppNotification[] =
    query.data?.pages.flatMap((p) => p.data) ?? []

  const total: number = query.data?.pages[0]?.total ?? 0
  const unreadCount = notifications.filter((n) => !n.read).length

  // ── Mutaciones ────────────────────────────────────────────────────────────

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onMutate: async (id: string) => {
      // Optimistic update — marca localmente sin esperar al servidor
      await queryClient.cancelQueries({ queryKey: QK.appNotifications.list() })
      const prev = queryClient.getQueryData(QK.appNotifications.list())

      queryClient.setQueryData(
        QK.appNotifications.list(),
        (old: { pages: NotificationsPage[] } | undefined) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((n) =>
                n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n
              ),
            })),
          }
        }
      )

      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(QK.appNotifications.list(), ctx.prev)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QK.appNotifications.list() })
    },
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: QK.appNotifications.list() })
      const prev = queryClient.getQueryData(QK.appNotifications.list())

      queryClient.setQueryData(
        QK.appNotifications.list(),
        (old: { pages: NotificationsPage[] } | undefined) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((n) => ({
                ...n,
                read: true,
                read_at: new Date().toISOString(),
              })),
            })),
          }
        }
      )

      return { prev }
    },
    onError: (_err, _v, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(QK.appNotifications.list(), ctx.prev)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QK.appNotifications.list() })
    },
  })

  return {
    notifications,
    total,
    unreadCount,
    isLoading: query.isLoading,
    isError: query.isError,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    markAsRead: (id: string) => markAsReadMutation.mutate(id),
    markAllAsRead: () => markAllAsReadMutation.mutate(),
    isMarkingAll: markAllAsReadMutation.isPending,
  }
}
