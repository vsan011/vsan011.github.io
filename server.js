// Minimal zero-dependency static server for local preview.
// Also exposes POST /__save-video, used once by tools/record.html
// to write the generated hero loop into assets/video/.
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 5173;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".webm": "video/webm",
  ".mp4": "video/mp4",
  ".ico": "image/x-icon",
  ".json": "application/json",
};

http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");

    if (req.method === "POST" && url.pathname === "/__save-video") {
      const chunks = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () => {
        const name = url.searchParams.get("file") === "poster" ? "hero-poster.jpg" : "hero.webm";
        const out = path.join(ROOT, "assets", "video", name);
        fs.mkdirSync(path.dirname(out), { recursive: true });
        fs.writeFileSync(out, Buffer.concat(chunks));
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, bytes: Buffer.concat(chunks).length }));
      });
      return;
    }

    let file = path.normalize(path.join(ROOT, decodeURIComponent(url.pathname)));
    if (!file.startsWith(ROOT)) {
      res.writeHead(403).end();
      return;
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");

    fs.stat(file, (err, stat) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
        return;
      }
      const type = TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
      const range = req.headers.range;
      // Range support so <video> can seek/loop smoothly.
      if (range && type.startsWith("video/")) {
        const [s, e] = range.replace("bytes=", "").split("-");
        const start = Number(s);
        const end = e ? Number(e) : stat.size - 1;
        res.writeHead(206, {
          "Content-Type": type,
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": end - start + 1,
        });
        fs.createReadStream(file, { start, end }).pipe(res);
        return;
      }
      res.writeHead(200, { "Content-Type": type, "Content-Length": stat.size, "Cache-Control": "no-cache" });
      fs.createReadStream(file).pipe(res);
    });
  })
  .listen(PORT, () => console.log(`Portfolio running at http://localhost:${PORT}`));
