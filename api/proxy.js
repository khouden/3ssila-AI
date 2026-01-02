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
    if (req.method !== "GET" && req.method !== "HEAD") {
      // Preserve original content-type
      if (req.headers["content-type"]) {
        fetchOptions.headers["Content-Type"] = req.headers["content-type"];
      }

      // Handle different body types
      if (req.body) {
        if (Buffer.isBuffer(req.body)) {
          // If it's a buffer, send as-is
          fetchOptions.body = req.body;
        } else if (typeof req.body === "string") {
          // If it's a string, send as-is
          fetchOptions.body = req.body;
        } else if (typeof req.body === "object") {
          // If it's an object, check if it's URLSearchParams
          if (req.body instanceof URLSearchParams) {
            fetchOptions.body = req.body.toString();
          } else {
            // Otherwise stringify as JSON
            fetchOptions.body = JSON.stringify(req.body);
          }
        }
      }
    }

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.text();

    res.status(response.status);
    res.setHeader(
      "Content-Type",
      response.headers.get("content-type") || "application/json"
    );
    res.send(data);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({
      error: "Proxy request failed",
      details: error.message,
    });
  }
}
