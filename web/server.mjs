import { createServer } from "node:http";
import { readFile, realpath, stat } from "node:fs/promises";
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const webDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = dirname(webDirectory);
const docsDirectory = join(repositoryRoot, "docs");
const sourceDirectory = join(repositoryRoot, "src");
const host = process.env.JUC_WEB_HOST || "127.0.0.1";
const requestedPort = Number.parseInt(process.env.JUC_WEB_PORT || "4173", 10);
const port = Number.isInteger(requestedPort) && requestedPort > 0 && requestedPort <= 65535 ? requestedPort : 4173;
const MAX_FILE_BYTES = 2 * 1024 * 1024;

const lesson01Sources = [
  ["DEMO", "src/main/java/com/caesaemc/juc/v3/labs/lesson01/LostUpdateDemo.java"],
  ["DEMO", "src/main/java/com/caesaemc/juc/v3/labs/lesson01/DeadlockDemo.java"],
  ["DEMO", "src/main/java/com/caesaemc/juc/v3/labs/lesson01/Lesson01DemoMain.java"],
  ["TASK", "src/main/java/com/caesaemc/juc/v3/taskhub/lesson01/UnsafeTaskStatistics.java"],
  ["TEST", "src/test/java/com/caesaemc/juc/v3/labs/lesson01/LostUpdateDemoTest.java"],
  ["TEST", "src/test/java/com/caesaemc/juc/v3/labs/lesson01/DeadlockDemoTest.java"],
  ["TEST", "src/test/java/com/caesaemc/juc/v3/taskhub/lesson01/UnsafeTaskStatisticsAcceptance.java"],
];

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"],
  [".java", "text/plain; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"],
  [".woff2", "font/woff2"],
]);

const securityHeaders = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
  ].join("; "),
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Cross-Origin-Resource-Policy": "same-origin",
};

function send(response, statusCode, headers, body = "") {
  response.writeHead(statusCode, { ...securityHeaders, ...headers });
  response.end(body);
}

function sendJson(response, statusCode, payload) {
  send(
    response,
    statusCode,
    {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
    JSON.stringify(payload),
  );
}

function isWithin(baseDirectory, candidatePath) {
  const pathFromBase = relative(baseDirectory, candidatePath);
  return pathFromBase === "" || (!pathFromBase.startsWith(`..${sep}`) && pathFromBase !== ".." && !isAbsolute(pathFromBase));
}

async function getSafeFile(baseDirectory, relativePath) {
  const candidate = resolve(baseDirectory, relativePath);
  if (!isWithin(baseDirectory, candidate)) {
    const error = new Error("Path leaves allowed directory");
    error.code = "FORBIDDEN_PATH";
    throw error;
  }

  const [resolvedBase, resolvedFile] = await Promise.all([realpath(baseDirectory), realpath(candidate)]);
  if (!isWithin(resolvedBase, resolvedFile)) {
    const error = new Error("Symlink leaves allowed directory");
    error.code = "FORBIDDEN_PATH";
    throw error;
  }

  const fileStats = await stat(resolvedFile);
  if (!fileStats.isFile()) {
    const error = new Error("Not a regular file");
    error.code = "NOT_FILE";
    throw error;
  }
  if (fileStats.size > MAX_FILE_BYTES) {
    const error = new Error("File exceeds preview limit");
    error.code = "FILE_TOO_LARGE";
    throw error;
  }
  return { path: resolvedFile, stats: fileStats };
}

async function serveFile(request, response, baseDirectory, relativePath) {
  try {
    const file = await getSafeFile(baseDirectory, relativePath);
    const etag = `W/\"${file.stats.size}-${Math.trunc(file.stats.mtimeMs)}\"`;
    if (request.headers["if-none-match"] === etag) {
      send(response, 304, { ETag: etag, "Cache-Control": "no-cache" });
      return;
    }

    const body = request.method === "HEAD" ? "" : await readFile(file.path);
    const contentType = mimeTypes.get(extname(file.path).toLowerCase()) || "application/octet-stream";
    send(
      response,
      200,
      {
        "Content-Type": contentType,
        "Content-Length": String(file.stats.size),
        "Cache-Control": "no-cache",
        ETag: etag,
      },
      body,
    );
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "ENOTDIR" || error.code === "NOT_FILE") {
      send(response, 404, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }, "Not found\n");
      return;
    }
    if (error.code === "FORBIDDEN_PATH") {
      send(response, 403, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }, "Forbidden\n");
      return;
    }
    if (error.code === "FILE_TOO_LARGE") {
      send(response, 413, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }, "File too large\n");
      return;
    }
    throw error;
  }
}

async function readLessonSources() {
  return Promise.all(
    lesson01Sources.map(async ([role, sourcePath]) => {
      const common = {
        role,
        path: sourcePath,
        name: sourcePath.split("/").at(-1),
      };
      try {
        const file = await getSafeFile(repositoryRoot, sourcePath);
        return {
          ...common,
          exists: true,
          content: await readFile(file.path, "utf8"),
          size: file.stats.size,
          mtimeMs: file.stats.mtimeMs,
        };
      } catch (error) {
        if (error.code === "ENOENT" || error.code === "ENOTDIR") {
          return { ...common, exists: false, content: "", size: 0, mtimeMs: 0 };
        }
        throw error;
      }
    }),
  );
}

function mountedFile(pathname) {
  if (pathname === "/") return { base: webDirectory, path: "index.html" };
  if (pathname.startsWith("/docs/")) return { base: docsDirectory, path: pathname.slice("/docs/".length) };
  if (pathname.startsWith("/src/")) return { base: sourceDirectory, path: pathname.slice("/src/".length) };
  if (pathname.startsWith("/web/")) return { base: webDirectory, path: pathname.slice("/web/".length) };
  return { base: webDirectory, path: pathname.slice(1) };
}

const server = createServer(async (request, response) => {
  try {
    if (request.method !== "GET" && request.method !== "HEAD") {
      send(response, 405, { "Content-Type": "text/plain; charset=utf-8", Allow: "GET, HEAD" }, "Method not allowed\n");
      return;
    }

    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url || "/", `http://${request.headers.host || "localhost"}`).pathname);
    } catch {
      send(response, 400, { "Content-Type": "text/plain; charset=utf-8" }, "Bad request\n");
      return;
    }
    if (pathname.includes("\0")) {
      send(response, 400, { "Content-Type": "text/plain; charset=utf-8" }, "Bad request\n");
      return;
    }

    if (pathname === "/api/health") {
      sendJson(response, 200, { ok: true, lesson: "01" });
      return;
    }
    if (pathname === "/api/lesson/01/sources") {
      sendJson(response, 200, { files: await readLessonSources() });
      return;
    }
    if (pathname.startsWith("/api/")) {
      sendJson(response, 404, { error: "Unknown API endpoint" });
      return;
    }

    const mount = mountedFile(pathname);
    await serveFile(request, response, mount.base, mount.path);
  } catch (error) {
    console.error("Request failed:", error);
    if (!response.headersSent) {
      send(response, 500, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }, "Internal server error\n");
    } else {
      response.destroy();
    }
  }
});

server.listen(port, host, () => {
  console.log(`JUC LAB V3 is running at http://${host}:${port}`);
  console.log(`Serving repository: ${repositoryRoot}`);
});

function shutdown(signal) {
  console.log(`\nReceived ${signal}; closing JUC LAB V3.`);
  server.close(() => process.exit(0));
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
