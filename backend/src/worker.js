import { httpServerHandler } from 'cloudflare:node';
import http from 'http';
import { app } from './app.js';

const server = http.createServer(app);
const nodeHandler = httpServerHandler(server);

export default {
  async fetch(request, env, ctx) {
    // Copy all Cloudflare environment variables to process.env
    for (const key in env) {
      if (typeof env[key] === 'string') {
        process.env[key] = env[key];
      }
    }
    
    // Call the native Cloudflare HTTP handler for Express
    return nodeHandler.fetch(request, env, ctx);
  }
};
