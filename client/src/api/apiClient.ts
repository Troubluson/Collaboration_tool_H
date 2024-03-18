import axios from 'axios';
import { ErrorResponse } from '../@types/ErrorResponse';
import { BASE_URL } from '../config';

const apiClient = axios.create({
  baseURL: BASE_URL,
});
apiClient.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    if (axios.isAxiosError(error) && error.response) {
      const responseError = error.response?.data?.detail as ErrorResponse;
      error.message = `${responseError.type}: ${responseError.reason}`;
    }
    return Promise.reject(error);
  },
);

export default apiClient;
