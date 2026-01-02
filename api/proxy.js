export default async function handler(req, res) {
  const BACKEND_URL = "http://[REDACTED]";

  // Extract the path from the URL (remove /api prefix)
  const targetPath = req.url.replace(/^\/api/, "");
  const targetUrl = `${BACKEND_URL}${targetPath}`;

  try {
    const fetchOptions = {
      method: req.method,
      headers: {
        ...(req.headers.authorization && {
          Authorization: req.headers.authorization,
        }),
      },
    };

    // Handle request body
    if (req.method !== "GET" && req.method !== "HEAD" && req.body) {
      // Preserve original content-type
      if (req.headers["content-type"]) {
        fetchOptions.headers["Content-Type"] = req.headers["content-type"];
      }

      // If body is URLSearchParams or string, send as-is
      if (req.body instanceof URLSearchParams || typeof req.body === "string") {
        fetchOptions.body = req.body.toString();
      } else {
        // Otherwise stringify as JSON
        fetchOptions.body = JSON.stringify(req.body);
      }
    }

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    res
      .status(500)
      .json({ error: "Proxy request failed", details: error.message });
  }
}
