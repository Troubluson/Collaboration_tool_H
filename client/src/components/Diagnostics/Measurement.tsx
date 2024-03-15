import axios from 'axios';
import React, { useEffect } from 'react';
import { useUser } from '../../hooks/UserContext';

const serverBaseURL = 'http://localhost:8000';

async function testLatencyAndThroughput(userID: string): Promise<void> {
  try {
    const startTime: number = new Date().getTime();
    const response: Response = await fetch(`${serverBaseURL}/latency`);
    const endTime: number = new Date().getTime();

    if (!response.ok) {
      throw new Error(`HTTP error! status : ${response.status}`);
    }

    const latency: number = endTime - startTime;
    const size: number = parseInt(response.headers.get('Content-Length') || '0');
    const throughput: number = size / latency;
    // Post the result to the server
    await axios.post(`${serverBaseURL}/latency/${userID}`, {
      latency: latency,
    });

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
    if (!user) {
      return;
    }
    testLatencyAndThroughput(user.id);
    //set a second timeout to give some time to
    const testWithDelay = () => {
      setInterval(() => testLatencyAndThroughput(user.id), 25000);
    };
    testWithDelay();
  }, [user?.id]);

  return null;
};

export default Test;
