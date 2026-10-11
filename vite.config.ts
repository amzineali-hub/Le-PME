import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv, Plugin } from 'vite';

// En développement, sert la fonction Vercel api/assistant.ts (GEMINI_API_KEY lue dans .env.local).
function assistantDevPlugin(): Plugin {
  return {
    name: 'pme-assistant-dev',
    configureServer(server) {
      const env = loadEnv('development', process.cwd(), '');
      if (env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
      if (env.GEMINI_MODEL && !process.env.GEMINI_MODEL) process.env.GEMINI_MODEL = env.GEMINI_MODEL;
      server.middlewares.use('/api/assistant', async (req, res) => {
        const chunks: Buffer[] = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', async () => {
          const out = res as typeof res & { status: (c: number) => typeof out; json: (b: unknown) => void };
          out.status = (c: number) => {
            res.statusCode = c;
            return out;
          };
          out.json = (b: unknown) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(b));
          };
          try {
            const mod = await server.ssrLoadModule('/api/assistant.ts');
            let body: unknown = undefined;
            const text = Buffer.concat(chunks).toString('utf8');
            try {
              body = text ? JSON.parse(text) : undefined;
            } catch {
              body = text;
            }
            await mod.default({ method: req.method, headers: req.headers, body, socket: req.socket }, out);
          } catch (err) {
            console.error('[assistant-dev]', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'unavailable' }));
          }
        });
      });
    },
  };
}

// Plugin to handle dynamic logo upload saving to /public and case-insensitive Public/ routing
function pmeLogoPlugin(): Plugin {
  return {
    name: 'pme-logo-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Rewrite /Public/* to /* to handle uppercase Public requests gracefully
        if (req.url && req.url.startsWith('/Public/')) {
          req.url = req.url.replace(/^\/Public\//, '/');
        }

        // Endpoint to persist logo uploaded from client to public/Logo PME.png
        if (req.url === '/api/upload-logo' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const { dataUrl } = JSON.parse(body);
              if (dataUrl && typeof dataUrl === 'string') {
                const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                if (matches && matches[2]) {
                  const buffer = Buffer.from(matches[2], 'base64');
                  const publicDir = path.resolve(__dirname, 'public');
                  if (!fs.existsSync(publicDir)) {
                    fs.mkdirSync(publicDir, { recursive: true });
                  }
                  // Save to multiple standard naming patterns
                  fs.writeFileSync(path.join(publicDir, 'Logo PME.png'), buffer);
                  fs.writeFileSync(path.join(publicDir, 'logo.png'), buffer);
                  fs.writeFileSync(path.join(publicDir, 'logo-pme.png'), buffer);
                }
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, path: '/Logo PME.png' }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(err) }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), pmeLogoPlugin(), assistantDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
