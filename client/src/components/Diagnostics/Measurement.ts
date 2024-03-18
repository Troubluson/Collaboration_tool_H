import axios from 'axios';
import apiClient from '../../api/apiClient';

export const pingLatency = async (userId: string) => {
  try {
    const startTime = new Date().getTime();
    const response = await apiClient.get(`/latency?cache=${startTime}`);
    const endTime: number = new Date().getTime();

    const latency = endTime - startTime;
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
