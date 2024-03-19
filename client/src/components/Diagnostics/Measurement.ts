import apiClient from '../../api/apiClient';

export const reportLatency = async (userId: string, latency: number) => {
  try {
    await apiClient.post(`/latency/${userId}`, { latency });
  } catch (error) {
    console.error('Failed to report latency', error);
  }
};
