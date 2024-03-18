import apiClient from '../../api/apiClient';


export const pingLatency = async (userId: string) => {
  try {
    const response = await apiClient.get(`/latency?cache=${Date.now()}`);
    const latency = response.config.headers['request-duration']
    const size = response.headers['Content-Length'] as number;
    const throughput: number = size / latency;
    // Post the result to the server
    await apiClient.post(`/latency/${userId}`, {
      latency: latency,
    });
  } catch (error) {
    console.error('There was an error pinging the server');
  }
};
