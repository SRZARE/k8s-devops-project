const express = require('express');
const { createClient } = require('redis');
const client = require('prom-client');
const os = require('os');

const app = express();
app.use(express.json());

const VERSION = process.env.APP_VERSION || 'v1';
const REDIS_HOST = process.env.REDIS_HOST || 'redis';

const redis = createClient({ url: `redis://${REDIS_HOST}:6379` });
redis.on('error', (e) => console.error('Redis error:', e.message));
redis.connect();

client.collectDefaultMetrics();
const created = new client.Counter({ name: 'urls_created_total', help: 'Total short URLs created' });
const redirects = new client.Counter({ name: 'redirects_total', help: 'Total redirects served' });

app.get('/', (req, res) => res.send(`URL Shortener ${VERSION} - pod: ${os.hostname()}`));
app.get('/health', (req, res) => res.send('OK'));

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.send(await client.register.metrics());
});

app.post('/shorten', async (req, res) => {
  const url = req.body.url;
  if (!url) return res.status(400).json({ error: 'url required' });
  const code = Math.random().toString(36).substring(2, 8);
  await redis.set(code, url);
  created.inc();
  res.json({ short: `/${code}`, url });
});

app.get('/:code', async (req, res) => {
  const url = await redis.get(req.params.code);
  if (!url) return res.status(404).send('Not found');
  redirects.inc();
  res.redirect(url);
});

app.listen(3000, () => console.log('App running on port 3000'));
