const statusEl = document.getElementById("status");
const userEl = document.getElementById("user");
const listEl = document.getElementById("task-list");
const formEl = document.getElementById("task-form");
const inputEl = document.getElementById("task-input");
const deadlineEl = document.getElementById("task-deadline");

const tg = window.Telegram?.WebApp;
let tasksCache = [];
let renderInterval = null;

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
  tasksCache = await response.json();
  renderTasks(tasksCache);
  syncRenderInterval();
}

function renderTasks(tasks) {
  listEl.innerHTML = "";
  tasks.forEach((task) => {
    const item = document.createElement("li");
    const info = document.createElement("div");
    info.className = "task-info";

    const title = document.createElement("span");
    title.textContent = task.title;
    if (task.done) title.classList.add("done");
    info.append(title);

    if (task.deadlineAt) {
      const deadline = document.createElement("small");
      deadline.className = "task-deadline";
      deadline.textContent = formatDeadline(task.deadlineAt);
      info.append(deadline);
    }

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = task.done ? "Вернуть" : "Готово";
    button.addEventListener("click", async () => {
      await fetch(`/api/tasks/${task.id}/toggle`, { method: "POST" });
      await loadTasks();
    });
    actions.append(button);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Удалить";
    deleteButton.className = "danger";
    deleteButton.addEventListener("click", async () => {
      await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      await loadTasks();
    });
    actions.append(deleteButton);

    item.append(info, actions);
    listEl.append(item);
  });
}

function formatDeadline(deadlineAt) {
  const deadlineDate = new Date(deadlineAt);
  if (Number.isNaN(deadlineDate.getTime())) {
    return "Некорректный дедлайн";
  }

  const now = Date.now();
  const diff = deadlineDate.getTime() - now;
  const absDiff = Math.abs(diff);
  const minutes = Math.floor(absDiff / 60000) % 60;
  const hours = Math.floor(absDiff / 3600000) % 24;
  const days = Math.floor(absDiff / 86400000);

  const parts = [];
  if (days > 0) parts.push(`${days}д`);
  if (hours > 0 || days > 0) parts.push(`${hours}ч`);
  parts.push(`${minutes}м`);
  const timeLeftText = parts.join(" ");

  return diff >= 0 ? `Осталось: ${timeLeftText}` : `Просрочено: ${timeLeftText}`;
}

function syncRenderInterval() {
  const hasDeadlines = tasksCache.some((task) => Boolean(task.deadlineAt));

  if (hasDeadlines && !renderInterval) {
    renderInterval = setInterval(() => renderTasks(tasksCache), 60_000);
  }

  if (!hasDeadlines && renderInterval) {
    clearInterval(renderInterval);
    renderInterval = null;
  }
}

formEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  const title = inputEl.value.trim();
  if (!title) return;

  const deadlineValue = deadlineEl.value;
  let deadlineAt = null;

  if (deadlineValue) {
    const deadlineDate = new Date(deadlineValue);
    if (Number.isNaN(deadlineDate.getTime())) {
      statusEl.textContent = "Некорректный дедлайн.";
      return;
    }

    deadlineAt = deadlineDate.toISOString();
  }

  const response = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, deadlineAt }),
  });

  if (response.ok) {
    inputEl.value = "";
    deadlineEl.value = "";
    await loadTasks();
    tg?.sendData?.(`Task created: ${title}`);
  }
});

initTelegram();
void loadTasks();
