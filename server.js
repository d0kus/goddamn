const http = require("node:http");
const path = require("node:path");
const express = require("express");

const tasks = [];
let taskId = 1;

function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "50kb" }));
  app.use(express.static(path.join(__dirname, "public")));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/api/tasks", (_req, res) => {
    res.json(tasks);
  });

  app.post("/api/tasks", (req, res) => {
    const title = String(req.body?.title || "").trim();

    if (!title) {
      return res.status(400).json({ error: "title is required" });
    }

    const task = {
      id: taskId++,
      title,
      done: false,
      createdAt: new Date().toISOString(),
    };

    tasks.push(task);
    return res.status(201).json(task);
  });

  app.post("/api/tasks/:id/toggle", (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    const task = tasks.find((item) => item.id === id);

    if (!task) {
      return res.status(404).json({ error: "task not found" });
    }

    task.done = !task.done;
    return res.json(task);
  });

  app.get("*", (_req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });

  return app;
}

function createServer() {
  return http.createServer(createApp());
}

if (require.main === module) {
  const port = Number.parseInt(process.env.PORT || "3000", 10);
  createServer().listen(port, () => {
    console.log(`Telegram Mini App server running on http://localhost:${port}`);
  });
}

module.exports = { createApp, createServer };
