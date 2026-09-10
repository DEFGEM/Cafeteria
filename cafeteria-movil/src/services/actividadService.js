import httpClient from '../api/client';
import endpoints from '../api/endpoints';

export const actividadService = {
  list: (params = {}) => httpClient.get(endpoints.actividad, { query: params }),
};

export default actividadService;
