import httpClient from '../api/client';
import endpoints from '../api/endpoints';

export const notificacionService = {
  list: (params = {}) => httpClient.get(endpoints.notificaciones.root, { query: params }),
  create: (data) => httpClient.post(endpoints.notificaciones.root, data),
  countUnread: () => httpClient.get(endpoints.notificaciones.unreadCount),
  markRead: (id) => httpClient.put(endpoints.notificaciones.read(id)),
};

export default notificacionService;
