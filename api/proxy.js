export default async function handler(req, res) {
  const BACKEND_URL = "http://[REDACTED]";

  // Extract the path from the URL (remove /api prefix)
  const targetPath = req.url.replace(/^\/api/, "");
  const targetUrl = `${BACKEND_URL}${targetPath}`;

  try {
    // Build headers, forwarding all relevant ones
    const headers = {};

    // Forward content-type if present
    if (req.headers["content-type"]) {
      headers["Content-Type"] = req.headers["content-type"];
    }

    // Forward authorization
    if (req.headers.authorization) {
      headers["Authorization"] = req.headers.authorization;
    }

    const fetchOptions = {
      method: req.method,
      headers,
    };

    // Handle request body - send raw buffer/stream
    if (req.method !== "GET" && req.method !== "HEAD") {
      if (req.body) {
        // In Vercel, req.body might be a string or buffer
        if (typeof req.body === "string") {
          fetchOptions.body = req.body;
        } else if (Buffer.isBuffer(req.body)) {
          fetchOptions.body = req.body;
        } else if (req.body instanceof URLSearchParams) {
          fetchOptions.body = req.body.toString();
        } else {
          // For plain objects, stringify as JSON
          fetchOptions.body = JSON.stringify(req.body);
        }
      }
    }

    console.log("Proxying to:", targetUrl);
    console.log("Method:", fetchOptions.method);
    console.log("Headers:", fetchOptions.headers);
    console.log("Body type:", typeof fetchOptions.body);

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.text();

    // Forward status and content-type
    res.status(response.status);
    if (response.headers.get("content-type")) {
      res.setHeader("Content-Type", response.headers.get("content-type"));
    }

    res.send(data);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({
      error: "Proxy request failed",
      details: error.message,
    });
  }
}
