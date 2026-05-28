const statusEl = document.getElementById("status");
const userEl = document.getElementById("user");
const listEl = document.getElementById("task-list");
const formEl = document.getElementById("task-form");
const inputEl = document.getElementById("task-input");

const tg = window.Telegram?.WebApp;

function initTelegram() {
  if (!tg) {
    statusEl.textContent = "Открыто вне Telegram. Демо-режим активирован.";
    userEl.textContent = "Guest user";
    return;
  }

  tg.ready();
  tg.expand();

  const user = tg.initDataUnsafe?.user;
  statusEl.textContent = "Telegram Mini App подключен.";
  userEl.textContent = user
    ? `${user.first_name || ""} ${user.last_name || ""} (@${user.username || "unknown"})`
    : "Пользователь не передан Telegram.";
}

async function loadTasks() {
  const response = await fetch("/api/tasks");
  const tasks = await response.json();
  renderTasks(tasks);
}

function renderTasks(tasks) {
  listEl.innerHTML = "";
  tasks.forEach((task) => {
    const item = document.createElement("li");
    const title = document.createElement("span");
    title.textContent = task.title;
    if (task.done) title.classList.add("done");

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = task.done ? "Вернуть" : "Готово";
    button.addEventListener("click", async () => {
      await fetch(`/api/tasks/${task.id}/toggle`, { method: "POST" });
      await loadTasks();
    });

    item.append(title, button);
    listEl.append(item);
  });
}

formEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  const title = inputEl.value.trim();
  if (!title) return;

  const response = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });

  if (response.ok) {
    inputEl.value = "";
    await loadTasks();
    tg?.sendData?.(`Task created: ${title}`);
  }
});

initTelegram();
void loadTasks();
