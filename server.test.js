const test = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const { createServer } = require("./server");

test("GET /api/health returns ok", async () => {
  const server = createServer();
  server.listen(0);
  await once(server, "listening");

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/health`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(payload, { ok: true });

  await new Promise((resolve) => server.close(resolve));
});

test("task API supports deadline, toggle and delete", async () => {
  const server = createServer();
  server.listen(0);
  await once(server, "listening");

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const createResponse = await fetch(`${baseUrl}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Task with deadline",
      deadlineAt: "2030-01-01T10:00:00.000Z",
    }),
  });
  const createdTask = await createResponse.json();

  assert.equal(createResponse.status, 201);
  assert.equal(createdTask.title, "Task with deadline");
  assert.equal(createdTask.done, false);
  assert.equal(createdTask.deadlineAt, "2030-01-01T10:00:00.000Z");

  const toggleResponse = await fetch(`${baseUrl}/api/tasks/${createdTask.id}/toggle`, {
    method: "POST",
  });
  const toggledTask = await toggleResponse.json();
  assert.equal(toggleResponse.status, 200);
  assert.equal(toggledTask.done, true);

  const deleteResponse = await fetch(`${baseUrl}/api/tasks/${createdTask.id}`, {
    method: "DELETE",
  });
  assert.equal(deleteResponse.status, 204);

  const listResponse = await fetch(`${baseUrl}/api/tasks`);
  const tasks = await listResponse.json();
  assert.equal(tasks.some((task) => task.id === createdTask.id), false);

  await new Promise((resolve) => server.close(resolve));
});

test("POST /api/tasks rejects invalid deadline", async () => {
  const server = createServer();
  server.listen(0);
  await once(server, "listening");

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Bad deadline",
      deadlineAt: "not-a-date",
    }),
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(payload, { error: "deadlineAt must be a valid date" });

  await new Promise((resolve) => server.close(resolve));
});
