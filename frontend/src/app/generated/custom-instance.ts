import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';

export const customInstance = <T>(
  config: {
    url: string;
    method: 'get' | 'post' | 'put' | 'delete' | 'patch';
    data?: any;
    headers?: Record<string, string>;
    params?: Record<string, any>;
  }
): Observable<T> => {
  const http = inject(HttpClient);
  
  const { url, method, data, headers, params } = config;
  
  switch (method) {
    case 'get':
      return http.get<T>(url, { headers, params });
    case 'post':
      return http.post<T>(url, data, { headers, params });
    case 'put':
      return http.put<T>(url, data, { headers, params });
    case 'delete':
      return http.delete<T>(url, { headers, params });
    case 'patch':
      return http.patch<T>(url, data, { headers, params });
    default:
      throw new Error(`Unsupported method: ${method}`);
  }
};

export default customInstance;
