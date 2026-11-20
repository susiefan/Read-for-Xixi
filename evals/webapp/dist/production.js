const summary = document.getElementById("summary");
const books = document.getElementById("books");
const refreshButton = document.getElementById("refresh-status");
let refreshTimer;

async function update() {
  if (refreshButton.disabled) return;
  window.clearTimeout(refreshTimer);
  refreshButton.disabled = true;
  try {
    const response = await fetch("/api/production", { cache: "no-store" });
    if (!response.ok) throw new Error("Production status unavailable");
    const data = await response.json();
    const installed = data.books.filter(book => book.installed).length;
    const progress = document.getElementById("progress");
    progress.max = Math.max(data.books.length, 1);
    progress.value = installed;
    const completedTracks = data.books.reduce((total, book) => total + (book.audio.completedTracks ?? 0), 0);
    const checked = data.books.filter(book => book.checked).length;
    summary.textContent = data.books.length
      ? `${checked} / ${data.books.length} 本已通过检查 · 已完成 ${completedTracks} 条音轨 · ${installed} 本已入库`
      : "";
    books.replaceChildren(...data.books.map(book => {
      const row = document.createElement("li");
      const link = document.createElement("a");
      link.href = `/?book=${encodeURIComponent((book.batch ?? "2026-11-09") + "/" + book.draft)}&version=${book.version}`;
      link.textContent = `${book.title} · ${book.version}`;
      const review = document.createElement("span");
      review.textContent = book.checked ? "原文、脚本与场景检查通过" : "等待内部复核";
      const audio = document.createElement("span");
      audio.textContent = book.failed ? "配音中断"
        : book.audio.status === "complete" ? "配音完成"
        : book.audio.status === "running" ? `配音 ${book.audio.completedTracks} / ${book.audio.expectedTracks}`
        : "等待配音";
      row.append(link, review, audio);
      return row;
    }));
    document.getElementById("release").textContent = data.release.message ?? "Web App 会在整批验收后更新。";
  } catch {
    summary.textContent = "暂时无法读取制作进度。";
  } finally {
    refreshButton.disabled = false;
    refreshTimer = window.setTimeout(update, 10000);
  }
}

refreshButton.addEventListener("click", update);
void update();
