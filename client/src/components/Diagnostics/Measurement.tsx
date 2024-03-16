import axios from 'axios';
import React, { useEffect } from 'react';
import { useUser } from '../../hooks/UserContext';

const serverBaseURL = 'http://localhost:8000';

const pingLatency = async (userId: string) => {
  try {
    const startTime = new Date().getTime();
    const response = await axios.get(`${serverBaseURL}/latency`);
    const endTime: number = new Date().getTime();

    const latency = endTime - startTime;
    const size = response.headers['Content-Length'] as number;
    const throughput: number = size / latency;
    // Post the result to the server
    await axios.post(`${serverBaseURL}/latency/${userId}`, {
      latency: latency,
    });
  } catch (error) {
    console.error('There was an error with the : ', error);
  }
};

const Test = () => {
  const { user } = useUser();

  useEffect(() => {
    if (!user) {
      return;
    }
    pingLatency(user.id);
    //set a second timeout to give some time to
    setInterval(() => pingLatency(user.id), 25000);
  }, [user?.id]);

  return null;
};

export default Test;
