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
