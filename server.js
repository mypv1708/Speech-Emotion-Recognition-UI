const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

// Enable CORS for all routes
app.use(cors());

// Proxy middleware configuration
app.use(
  "/api",
  createProxyMiddleware({
    target: "http://0.0.0.0:8386",
    changeOrigin: true,
    pathRewrite: {
      "^/api": "", // remove base path
    },
  })
);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Proxy server is running on port ${PORT}`);
});
