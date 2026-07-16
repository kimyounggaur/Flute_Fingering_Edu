// 개발 미리보기용 초간단 정적 서버 (의존성 0)
const http = require("http");
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const PORT = 8477;
const MIME = { ".html":"text/html; charset=utf-8", ".js":"text/javascript", ".css":"text/css",
  ".svg":"image/svg+xml", ".png":"image/png", ".jpg":"image/jpeg", ".json":"application/json" };
http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let file = path.normalize(path.join(ROOT, urlPath === "/" ? "index.html" : urlPath));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store" });
    res.end(data);
  });
}).listen(PORT, () => console.log(`serving ${ROOT} at http://localhost:${PORT}`));
