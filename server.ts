import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route for email subscription
  app.post("/api/subscribe", async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const API_KEY = process.env.EMAILOCTOPUS_API_KEY;
    const LIST_ID = process.env.EMAILOCTOPUS_LIST_ID;

    if (!API_KEY || !LIST_ID) {
      console.error("Missing EmailOctopus configuration");
      return res.status(500).json({ error: "Server configuration error" });
    }

    try {
      const response = await fetch(`https://emailoctopus.com/api/1.1/lists/${LIST_ID}/contacts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: API_KEY,
          email_address: email,
          status: "SUBSCRIBED",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle duplicate email as an error as requested
        if (data.error?.code === "MEMBER_EXISTS_WITH_EMAIL_ADDRESS") {
          return res.status(400).json({ error: "This email address is already subscribed." });
        }
        
        console.error("EmailOctopus API error:", JSON.stringify(data, null, 2));
        return res.status(response.status).json({ error: data.error?.message || "Failed to subscribe" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Subscription error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
