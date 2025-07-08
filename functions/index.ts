// Pastikan sudah install: npm install firebase-functions next
import * as functions from 'firebase-functions';
import next from 'next';
import * as path from 'path';
import { Request, Response } from 'express';

const dev = process.env.NODE_ENV !== 'production';
const app = next({
  dev,
  conf: { distDir: path.join(__dirname, '../.next') },
});
const handle = app.getRequestHandler();

export const nextjsFunc = functions.https.onRequest((req, res) => {
  return app.prepare().then(() => handle(req, res));
}); 