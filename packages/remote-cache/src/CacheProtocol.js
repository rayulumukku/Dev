import http from 'http';
import https from 'https';
import { URL } from 'url';
import { getAuthHeaders } from './Authentication.js';

export async function requestHTTP(urlStr, method, body, token) {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(urlStr);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;

      const headers = {
        ...getAuthHeaders(token),
      };

      if (body) {
        headers['Content-Type'] = 'application/json';
        headers['Content-Length'] = String(Buffer.byteLength(body));
      }

      const req = client.request(
        urlStr,
        {
          method,
          headers,
        },
        (res) => {
          let rawData = '';
          res.on('data', (chunk) => {
            rawData += chunk;
          });
          res.on('end', () => {
            resolve({
              statusCode: res.statusCode || 500,
              data: rawData,
            });
          });
        }
      );

      req.on('error', (err) => {
        reject(err);
      });

      if (body) {
        req.write(body);
      }
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}
