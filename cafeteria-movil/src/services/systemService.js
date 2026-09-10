import httpClient from '../api/client';
import endpoints from '../api/endpoints';

export const systemService = {
  health: () => httpClient.get(endpoints.health, { auth: false }),
};

export default systemService;
