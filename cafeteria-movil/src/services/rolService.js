import httpClient from '../api/client';
import endpoints from '../api/endpoints';

export const rolService = {
  list: () => httpClient.get(endpoints.roles.root),
  create: (data) => httpClient.post(endpoints.roles.root, data),
};

export default rolService;
