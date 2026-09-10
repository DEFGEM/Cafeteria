import httpClient from '../api/client';
import endpoints from '../api/endpoints';
import { adaptDashboard } from '../adapters/dataAdapters';

export const dashboardService = {
  async getDashboard() {
    return adaptDashboard(await httpClient.get(endpoints.dashboard));
  },

  getStatistics() {
    return httpClient.get(endpoints.statistics);
  },
};

export default dashboardService;
