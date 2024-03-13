import axios from 'axios';
import React, { useEffect } from 'react';
import { useUser } from '../../hooks/UserContext';

const serverBaseURL = 'http://localhost:8000';

async function testLatencyAndThroughput(userID: string): Promise<void> {
  try {
    const startTime: number = new Date().getTime();
    const response: Response = await fetch(`${serverBaseURL}/data`);
    const endTime: number = new Date().getTime();

    if (!response.ok) {
      throw new Error(`HTTP error! status : ${response.status}`);
    }

    const latency: number = endTime - startTime;
    const size: number = parseInt(response.headers.get('Content-Length') || '0');
    const throughput: number = size / latency;

    console.log(`User: ${userID}`);
    console.log(`Latency: ${latency} ms`);
    console.log(`Throughput: ${throughput} bytes/ms`);

    // Post the result to the server
    const result: { latency: number; throughput: number } = { latency, throughput };
    await axios.post(`${serverBaseURL}/data/${userID}`, result);

    if (!response.ok) {
      throw new Error('HTTP error! status : ${postResponse.status}');
    }
  } catch (error) {
    console.error('There was an error with the fetch operation: ', error);
  }
}

const Test = () => {
  const { user } = useUser();

  useEffect(() => {
    //set a second timeout to give some time to
    const testWithDelay = () => {
      if (user) {
        setInterval(() => testLatencyAndThroughput(user.id), 20000);
      }
    };
  }, [user]);

  return null;
};

export default Test;
