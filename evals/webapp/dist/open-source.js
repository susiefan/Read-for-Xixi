const labels = { planned:"待安排", ready:"可开始", active:"正在进行", "waiting-user":"需要你处理", blocked:"受阻", done:"已完成" };
const refresh = document.getElementById("refresh");
const filter = document.getElementById("filter");
let snapshot;
let timer;
const node = (tag, content, className) => {
  const element = document.createElement(tag);
  if (content !== undefined) element.textContent = content;
  if (className) element.className = className;
  return element;
};
const localTime = value => new Intl.DateTimeFormat("zh-CN", { month:"numeric", day:"numeric", hour:"2-digit", minute:"2-digit", timeZone:"America/New_York" }).format(new Date(value));

function render() {
  const data = snapshot;
  document.getElementById("goal").textContent = data.goal;
  document.getElementById("updated").textContent = `更新于 ${localTime(data.updatedAt)}`;
  const tasks = data.tasks.filter(task => task.release !== "later");
  const complete = tasks.filter(task => task.status === "done").length;
  document.getElementById("done").textContent = complete;
  document.getElementById("active").textContent = tasks.filter(task => task.status === "active").length;
  document.getElementById("remaining").textContent = tasks.length - complete;
  document.getElementById("progress").max = tasks.length;
  document.getElementById("progress").value = complete;
  document.getElementById("progress-label").textContent = `${complete} / ${tasks.length} 项当前任务已完成`;
  document.getElementById("requirements").replaceChildren(...data.requirements.map(requirement => {
    const item = node("li");
    item.append(node("strong", requirement.title), node("p", requirement.acceptance));
    return item;
  }));
  const pending = data.tasks.filter(task => task.status === "waiting-user");
  document.getElementById("user-actions").hidden = !pending.length;
  document.getElementById("user-items").replaceChildren(...pending.map(task => node("p", `${task.title}。${task.note}`)));
  document.getElementById("tasks").replaceChildren(...data.tasks.filter(task => filter.value === "all" || (filter.value === "unfinished" ? task.status !== "done" : task.status === filter.value)).map(task => {
    const row = node("article", undefined, "task");
    const status = node("span", labels[task.status], "status");
    status.dataset.state = task.status;
    const body = node("div");
    body.append(node("h3", `${task.title}${task.release === "later" ? " · 后续版本" : ""}`), node("p", task.note));
    body.append(node("p", `验收要求　${task.acceptance}`, "acceptance"));
    if (task.evidence.length) body.append(node("p", `验证记录　${task.evidence.join(" · ")}`, "evidence"));
    row.append(status, body);
    return row;
  }));
  document.getElementById("history").replaceChildren(...data.history.slice(-12).reverse().map(item => {
    const row = node("li");
    row.append(node("time", localTime(item.at)), node("span", `${item.task} · ${labels[item.status]}。${item.note}`));
    return row;
  }));
}

async function update() {
  if (refresh.disabled) return;
  window.clearTimeout(timer);
  refresh.disabled = true;
  try {
    const response = await fetch("/api/open-source", { cache:"no-store" });
    if (!response.ok) throw new Error("Status unavailable");
    snapshot = await response.json();
    render();
  } catch {
    document.getElementById("updated").textContent = "状态读取失败，可以点击刷新重试。";
  } finally {
    refresh.disabled = false;
    timer = window.setTimeout(update, 10000);
  }
}
refresh.addEventListener("click", update);
filter.addEventListener("change", () => { if (snapshot) render(); });
void update();
