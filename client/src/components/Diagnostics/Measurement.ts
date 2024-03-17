import axios from 'axios';


const serverBaseURL = 'http://localhost:8000';

export const pingLatency = async (userId: string) => {
  try {
    const startTime = new Date().getTime();
    const response = await axios.get(`${serverBaseURL}/latency?cache=${startTime}`);
    const endTime: number = new Date().getTime();

    const latency = endTime - startTime;
    const size = response.headers['Content-Length'] as number;
    const throughput: number = size / latency;
    // Post the result to the server
    await axios.post(`${serverBaseURL}/latency/${userId}`, {
      latency: latency,
    });
  } catch (error) {
    console.error('There was an error pinging the server');
  }
};


