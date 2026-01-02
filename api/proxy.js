export default async function handler(req, res) {
  const BACKEND_URL = "http://[REDACTED]";

  // Extract the path from the URL (remove /api prefix)
  const targetPath = req.url.replace(/^\/api/, "");
  const targetUrl = `${BACKEND_URL}${targetPath}`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "Content-Type": req.headers["content-type"] || "application/json",
        ...(req.headers.authorization && {
          Authorization: req.headers.authorization,
        }),
      },
      body:
        req.method !== "GET" && req.method !== "HEAD"
          ? JSON.stringify(req.body)
          : undefined,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    res
      .status(500)
      .json({ error: "Proxy request failed", details: error.message });
  }
}
