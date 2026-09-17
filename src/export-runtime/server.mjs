import http from "node:http";
import { readFile, mkdir, appendFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.dirname(fileURLToPath(import.meta.url));
const allowed = new Set(
  JSON.parse(await readFile(path.join(root, "manifest.json"), "utf8")),
);
const limits = new Map();
const server = http.createServer(async (req, res) => {
  const json = (status, data) => {
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(JSON.stringify(data));
  };
  try {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/api/contact" && req.method === "POST") {
      if (
        req.headers.origin &&
        new URL(req.headers.origin).host !== req.headers.host
      )
        return json(403, {
          error: "This form must be submitted from this website.",
        });
      const ip = req.socket.remoteAddress;
      const now = Date.now();
      for (const [key, value] of limits)
        if (value.until < now) limits.delete(key);
      const rate = limits.get(ip) || { count: 0, until: now + 60_000 };
      if (rate.count >= 10)
        return json(429, { error: "Too many messages. Please wait a minute." });
      rate.count++;
      limits.set(ip, rate);
      let body = "";
      for await (const chunk of req) {
        body += chunk;
        if (Buffer.byteLength(body) > 16_384)
          return json(413, { error: "Message is too large." });
      }
      let data;
      try {
        data = req.headers["content-type"]?.includes("application/json")
          ? JSON.parse(body)
          : Object.fromEntries(new URLSearchParams(body));
      } catch {
        return json(400, { error: "Invalid form data." });
      }
      if (!data || typeof data !== "object")
        return json(400, { error: "Invalid form data." });
      if (data.website) return json(200, { ok: true });
      const name = typeof data.name === "string" ? data.name.trim() : "";
      const email = typeof data.email === "string" ? data.email.trim() : "";
      const message =
        typeof data.message === "string" ? data.message.trim() : "";
      if (
        !name ||
        name.length > 100 ||
        !/^\S+@\S+\.\S+$/.test(email) ||
        email.length > 200 ||
        message.length < 10 ||
        message.length > 5000
      )
        return json(400, {
          error:
            "Enter your name, a valid email, and a message between 10 and 5,000 characters.",
        });
      await mkdir(path.join(root, "data"), { recursive: true, mode: 0o700 });
      await appendFile(
        path.join(root, "data", "submissions.jsonl"),
        JSON.stringify({
          id: randomUUID(),
          received: new Date().toISOString(),
          name,
          email,
          message,
          page: typeof data.page === "string" ? data.page.slice(0, 200) : "",
        }) + "\n",
        { mode: 0o600 },
      );
      return json(200, { ok: true });
    }
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405);
      return res.end("Method not allowed");
    }
    let name;
    try {
      name = decodeURIComponent(url.pathname.slice(1) || "index.html");
    } catch {
      res.writeHead(400);
      return res.end("Invalid URL");
    }
    if (!allowed.has(name)) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("Page not found");
    }
    const mime = {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".webp": "image/webp",
      ".gif": "image/gif",
      ".xml": "application/xml",
      ".txt": "text/plain",
    };
    const data = await readFile(path.join(root, name));
    res.writeHead(200, {
      "Content-Type": mime[path.extname(name)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    });
    res.end(req.method === "HEAD" ? undefined : data);
  } catch {
    if (!res.headersSent)
      json(500, {
        error: "The server could not process your request. Please try again.",
      });
    else res.end();
  }
});
server.listen(
  Number(process.env.PORT || 4174),
  process.env.HOST || "127.0.0.1",
  () =>
    console.log(
      `Website running at http://${process.env.HOST || "127.0.0.1"}:${server.address().port}`,
    ),
);
