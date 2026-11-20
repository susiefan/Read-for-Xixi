const $ = (id) => document.getElementById(id);
const bookPicker = $("book");
const versionPicker = $("version");
const pagePicker = $("page");
const filterPicker = $("filter");
const scan = $("scan");
const comment = $("comment");
const form = $("rating-form");
const draftReviews = new Map();
const visualRating = $("visual-rating");
const visualComment = $("visual-comment");
const visualButtons = [...visualRating.querySelectorAll('input[type="radio"]')];
const scoreButtons = [];
let catalog;
let book;
let version;
let page;
let saving = false;

for (let value = 1; value <= 7; value++) {
  const label = document.createElement("label");
  const input = document.createElement("input");
  input.type = "radio";
  input.name = "score";
  input.value = value;
  const face = document.createElement("span");
  face.textContent = value;
  if (value < 4) face.className = "low";
  label.append(input, face);
  $("scores").append(label);
  scoreButtons.push(input);
}

async function api(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "无法读取评审数据。");
  return data;
}

function statusOf(item) {
  if (!item.review) return "pending";
  return item.review.score >= catalog.passScore ? "passed" : "failed";
}

function visiblePages() {
  return version.pages.filter((item) => filterPicker.value === "all" || statusOf(item) === filterPicker.value);
}

function setOptions(select, entries, active) {
  select.replaceChildren(...entries.map(([label, value]) => new Option(label, value)));
  select.value = active || "";
}

function storeLocation() {
  try {
    localStorage.setItem("mimi-eval-location", JSON.stringify({ book: book.id, version: version.id, page: page?.key }));
  } catch {
    // A storage-restricted browser can still review and save to the local server.
  }
}

function showImageStatus(message) {
  $("scan-status").textContent = message;
  $("scan-status").hidden = !message;
  $("scan-button").hidden = Boolean(message);
  $("zoom").disabled = Boolean(message);
}

function showScan() {
  const src = page.hasScan ? `/scan/${page.key.split("/").map(encodeURIComponent).join("/")}` : "";
  scan.alt = `${book.title} · PDF 第 ${page.pdfPage ?? "？"} 页`;
  $("scan-meta").textContent = page.pdfPage ? `PDF 第 ${page.pdfPage} 页 · 点击图片放大` : "";
  if (!src) {
    scan.removeAttribute("src");
    showImageStatus("这页的原始扫描找不到。");
  } else if (scan.getAttribute("src") !== src || (scan.complete && !scan.naturalWidth)) {
    showImageStatus("正在读取扫描…");
    scan.src = src;
  } else if (scan.complete && scan.naturalWidth) {
    showImageStatus("");
  }
}

scan.addEventListener("load", () => showImageStatus(""));
scan.addEventListener("error", () => showImageStatus("扫描加载失败，请检查原 PDF 或刷新页面。"));

function showScene(scene) {
  const stage = $("scene");
  const format = $("scene-format").value;
  stage.dataset.theme = scene.theme;
  stage.dataset.format = format;
  stage.setAttribute("viewBox", { square: "0 0 720 720", wide: "0 85 720 550", portrait: "72 0 576 720" }[format]);
  const frame = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const floor = document.createElementNS(frame.namespaceURI, "rect");
  for (const [name, value] of Object.entries({ x: 0, y: 475, width: 720, height: 245, class: "scene-floor" })) floor.setAttribute(name, value);
  frame.append(floor);
  const addImage = ({ url, x, y, width, height, motion, attached }) => {
    const layer = document.createElementNS(frame.namespaceURI, "g");
    if (motion) layer.setAttribute("class", `motion-${motion}`);
    const image = document.createElementNS(frame.namespaceURI, "image");
    for (const [name, value] of Object.entries({ href: url, x, y, width, height })) image.setAttribute(name, value);
    layer.append(image);
    if (attached) {
      const anchor = document.createElementNS(frame.namespaceURI, "g");
      anchor.setAttribute("class", "motion-breathe");
      anchor.append(layer);
      frame.append(anchor);
    } else {
      frame.append(layer);
    }
  };
  for (const layer of scene.layers.filter((item) => item.depth === "behind")) addImage(layer);
  addImage({ url: "/mimi.svg", x: 63, y: 107, width: 555, height: 555, motion: "breathe" });
  for (const layer of scene.layers.filter((item) => item.depth === "front")) addImage(layer);
  stage.replaceChildren(frame);
}

function showVisuals() {
  const { background, prop, scene } = page.reviewVisuals || {};
  $("visual-preview").hidden = !page.visualRevision;
  $("visual-empty").hidden = Boolean(page.visualRevision);
  $("visual-flat").hidden = Boolean(scene);
  $("visual-composed").hidden = !scene;
  if (scene) showScene(scene);
  for (const [id, asset] of [["visual-background", background], ["visual-prop", prop]]) {
    const image = $(id);
    image.hidden = !asset;
    image.alt = asset?.label || "";
    if (!asset) {
      image.removeAttribute("src");
    } else if (image.getAttribute("src") !== asset.url) {
      image.src = asset.url;
    }
  }
  $("visual-prop").dataset.placement = prop?.placement || "";
  const caption = $("visual-caption");
  caption.replaceChildren();
  for (const [label, asset] of scene ? scene.layers.map((layer) => [null, layer]) : [["背景", background], ["道具", prop]]) {
    if (!asset) continue;
    const sourcePage = version.pages.find((item) => item.pageId === asset.sourcePageId);
    const note = document.createElement("span");
    note.textContent = label ? `${label} · ${asset.label}` : asset.label;
    if (sourcePage) note.textContent += ` · PDF 第 ${sourcePage.pdfPage} 页`;
    if (asset.qualityAttempts > 1) note.textContent += ` · 第 ${asset.qualityAttempts} 次检查通过`;
    caption.append(note);
  }
}

for (const [id, event] of [["replay-scene", "click"], ["scene-format", "change"]]) {
  $(id).addEventListener(event, () => {
    if (page?.reviewVisuals?.scene) showScene(page.reviewVisuals.scene);
  });
}

function zoom() {
  if (!scan.naturalWidth) return;
  $("zoom-title").textContent = scan.alt;
  $("zoom-image").src = scan.src;
  $("zoom-image").alt = scan.alt;
  $("scan-dialog").showModal();
}

$("zoom").addEventListener("click", zoom);
$("scan-button").addEventListener("click", zoom);

function addLine(container, label, text) {
  if (!text) return;
  const line = document.createElement("p");
  const heading = document.createElement("strong");
  heading.textContent = `${label}　`;
  line.append(heading, text);
  container.append(line);
}

function showDetails() {
  const reference = $("reading-reference-content");
  reference.replaceChildren();
  if (page.readingReference) {
    addLine(reference, "节目片段", page.readingReference.time);
    addLine(reference, "共读怎么聊", page.readingReference.observation);
    addLine(reference, "Mimi 可借鉴", page.readingReference.adaptation);
    addLine(reference, "读完后可以聊", page.readingReference.caregiverPrompt);
  }
  $("reading-reference").hidden = !reference.childElementCount;
  $("reading-reference").open = false;

  const versionIndex = book.versions.indexOf(version);
  const previous = book.versions[versionIndex - 1];
  const earlierPage = previous?.pages.find((item) => item.pageId === page.pageId);
  const earlier = $("earlier-content");
  earlier.replaceChildren();
  $("earlier").hidden = !earlierPage;
  $("earlier").open = false;
  if (earlierPage) {
    $("earlier-label").textContent = `查看上一版 ${previous.id}`;
    for (const [field, name] of [["story", "旁白"], ["invitation", "邀请"], ["response", "回应"]]) {
      if (earlierPage[field] !== page[field]) addLine(earlier, name, earlierPage[field]);
    }
    if (!earlier.childElementCount) addLine(earlier, "文案", "与本版相同");
    const earlierRating = earlierPage.review || earlierPage.legacyReview;
    if (earlierRating) {
      addLine(earlier, earlierPage.review ? "上一版脚本评分" : "上一版综合评分", `${earlierRating.score}/7`);
      addLine(earlier, "上一版评语", earlierRating.comment);
    }
  }
  const evidence = $("evidence-content");
  evidence.replaceChildren();
  addLine(evidence, "画面证据", page.evidence);
  addLine(evidence, "附加找图栏", page.activity);
  addLine(evidence, "背景计划", version.background?.label);
  addLine(evidence, "本页道具", page.visualAsset?.label);
  addLine(evidence, "拟复用", page.mimiAssets?.join("、"));
  for (const note of page.scriptNotes || []) addLine(evidence, "脚本核对建议", note);
  if (page.legacyReview) {
    addLine(evidence, "旧版综合评分", `${page.legacyReview.score}/7`);
    addLine(evidence, "旧版评语", page.legacyReview.comment);
  }
  $("evidence").hidden = !evidence.childElementCount;
  $("evidence").open = false;
}

function setSaveStatus(message, error = false) {
  $("save-status").textContent = message;
  $("save-status").classList.toggle("error", error);
}

function ratingValue(buttons, textarea) {
  const selected = buttons.find((input) => input.checked);
  return { score: selected ? Number(selected.value) : null, comment: textarea.value.trim() };
}

function inputValues() {
  return { script: ratingValue(scoreButtons, comment), visual: ratingValue(visualButtons, visualComment) };
}

function savedValues(item) {
  const value = (rating) => ({ score: rating?.score ?? null, comment: rating?.comment || "" });
  return { script: value(item.review), visual: value(item.visualReview) };
}

function initialValues(item) {
  const values = savedValues(item);
  if (item.visualRevision && values.visual.score === null) values.visual.score = 1;
  return values;
}

function updateSaveControls() {
  const list = visiblePages();
  const index = list.indexOf(page);
  const values = inputValues();
  const hasNext = index >= 0 && index < list.length - 1;
  const button = $("save-next");
  $("previous").disabled = index <= 0;
  $("next").disabled = !hasNext;
  button.textContent = hasNext ? "保存并下一页" : "保存并完成";
  button.disabled = saving || Object.values(values).every((value) => value.score === null && !value.comment);
  for (const input of scoreButtons) input.disabled = saving;
  comment.disabled = saving;
  for (const input of visualButtons) input.disabled = saving;
  visualComment.disabled = saving;
}

function showProgress() {
  const reviewed = version.pages.filter((item) => item.review).length;
  $("progress").max = version.pages.length || 1;
  $("progress").value = reviewed;
  const visualPages = version.pages.filter((item) => item.visualRevision);
  const visualCount = visualPages.filter((item) => item.visualReview).length;
  $("progress-label").textContent = `脚本 ${reviewed}/${version.pages.length} 页${visualPages.length ? ` · 视觉 ${visualCount}/${visualPages.length} 页` : ""}`;
}

function render(key) {
  const list = visiblePages();
  page = list.find((item) => item.key === key) || list[0];
  setOptions(pagePicker, list.map((item) => [`${item.pdfPage ?? "–"} · ${item.label}`, item.key]), page?.key);
  pagePicker.disabled = !page;
  $("page-heading").hidden = !page;
  $("spread").hidden = !page;
  $("no-pages").hidden = Boolean(page);
  showProgress();
  storeLocation();
  if (!page) return;
  $("page-meta").textContent = `PDF 第 ${page.pdfPage ?? "？"} 页 · ${version.id}`;
  $("page-title").textContent = page.label;
  const status = statusOf(page);
  $("page-state").className = `state ${status}`;
  $("page-state").textContent = status === "pending" ? "未评分" : `${page.review.score}/7 · ${status === "passed" ? "通过" : "待重写"}`;
  for (const field of ["story", "invitation", "response"]) $(field).textContent = page[field] || "—";
  showScan();
  showVisuals();
  showDetails();
  const draft = draftReviews.get(page.key);
  const value = draft || initialValues(page);
  for (const input of scoreButtons) input.checked = Number(input.value) === value.script.score;
  comment.value = value.script.comment;
  visualRating.hidden = !page.visualRevision;
  for (const input of visualButtons) input.checked = Number(input.value) === value.visual.score;
  visualComment.value = value.visual.comment;
  setSaveStatus(draft ? "有未保存的修改" : "");
  updateSaveControls();
}

function openBook(bookId, versionId, key) {
  book = catalog.books.find((item) => item.id === bookId) || catalog.books[0];
  bookPicker.value = book.id;
  version = book.versions.find((item) => item.id === versionId) || book.versions.at(-1);
  setOptions(versionPicker, book.versions.map((item) => [item.id, item.id]), version.id);
  render(key);
}

function keepDraft() {
  if (!page) return;
  const value = inputValues();
  if (JSON.stringify(value) === JSON.stringify(initialValues(page))) {
    draftReviews.delete(page.key);
    setSaveStatus("");
  } else {
    draftReviews.set(page.key, value);
    setSaveStatus("有未保存的修改");
  }
  updateSaveControls();
}

function step(direction) {
  const list = visiblePages();
  const target = list[list.indexOf(page) + direction];
  if (target) render(target.key);
}

bookPicker.addEventListener("change", () => openBook(bookPicker.value));
versionPicker.addEventListener("change", () => {
  const pageId = page?.pageId;
  const nextVersion = book.versions.find((item) => item.id === versionPicker.value);
  openBook(book.id, nextVersion.id, nextVersion.pages.find((item) => item.pageId === pageId)?.key);
});
filterPicker.addEventListener("change", () => render(page?.key));
pagePicker.addEventListener("change", () => render(pagePicker.value));
$("previous").addEventListener("click", () => step(-1));
$("next").addEventListener("click", () => step(1));
form.addEventListener("input", keepDraft);
window.addEventListener("beforeunload", (event) => {
  if (!draftReviews.size) return;
  event.preventDefault();
  event.returnValue = "";
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!page || saving) return;
  const target = page;
  const values = inputValues();
  const existing = savedValues(target);
  const ratings = [];
  for (const [kind, value] of Object.entries(values)) {
    if (value.score === null && value.comment) {
      setSaveStatus(kind === "script" ? "请给脚本评语选一个分数。" : "请给视觉评语选择通过或不通过。", true);
      return;
    }
    if (value.score !== null && (value.score !== existing[kind].score || value.comment !== existing[kind].comment)) {
      ratings.push({ kind, ...value, revision: target[`${kind}Revision`] });
    }
  }
  const list = visiblePages();
  const following = list[list.indexOf(target) + 1];
  saving = true;
  updateSaveControls();
  setSaveStatus("正在保存…");
  try {
    if (ratings.length) {
      const saved = await api("/api/review", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: target.key, ratings }),
      });
      if (saved.script) target.review = saved.script;
      if (saved.visual) target.visualReview = saved.visual;
    }
    draftReviews.delete(target.key);
    const stillOnTarget = page === target;
    render(stillOnTarget ? following?.key || target.key : page?.key);
    if (stillOnTarget && page) setSaveStatus("已保存");
  } catch (error) {
    if (page === target) setSaveStatus(error.message, true);
  } finally {
    saving = false;
    if (page) updateSaveControls();
  }
});

function addFeedbackSection(container, title, entries, empty) {
  const heading = document.createElement("h3");
  heading.textContent = title;
  container.append(heading);
  if (!entries.length) {
    const message = document.createElement("p");
    message.textContent = empty;
    container.append(message);
    return;
  }
  const list = document.createElement("ul");
  for (const entry of entries) {
    const item = document.createElement("li");
    const label = document.createElement("button");
    label.type = "button";
    label.className = "text-button";
    const score = entry.kind === "visual" ? (entry.score ? "通过" : "不通过") : `${entry.score}/7`;
    label.textContent = `${entry.title} · PDF ${entry.pdfPage} · ${score}`;
    label.addEventListener("click", () => {
      const currentBook = catalog.books.find((candidate) => candidate.versions.some((current) => current.pages.some((item) => item.key === entry.key)));
      if (!currentBook) return;
      filterPicker.value = "all";
      openBook(currentBook.id, entry.version, entry.key);
      $("feedback-dialog").close();
    });
    item.append(label);
    if (entry.comment) addLine(item, "评语", entry.comment);
    list.append(item);
  }
  container.append(list);
}

$("feedback-button").addEventListener("click", async () => {
  const panel = $("feedback");
  panel.textContent = "正在读取已保存的评分…";
  $("feedback-dialog").showModal();
  try {
    const summary = await api("/api/feedback");
    panel.textContent = `最新版本 · 脚本 ${summary.pending} 页待评 · 视觉 ${summary.visualPending} 页待评`;
    addFeedbackSection(panel, "脚本待重写 · 1–3 分", summary.belowBar, "目前没有低于 4 分的已评页。");
    addFeedbackSection(panel, "脚本通过 · 有评语", summary.passingComments, "目前没有这类评语。");
    addFeedbackSection(panel, "视觉待重做", summary.visualFailed, "目前没有未通过的视觉稿。");
    addFeedbackSection(panel, "视觉通过 · 有评语", summary.visualPassingComments, "目前没有这类评语。");
    for (const blocked of summary.blocked) addLine(panel, blocked.title, blocked.issues.join(" "));
  } catch (error) {
    panel.textContent = error.message;
  }
});

async function start() {
  try {
    catalog = await api("/api/catalog");
    if (!catalog.books.length) {
      $("load-status").textContent = "还没有可评审的脚本。";
      return;
    }
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem("mimi-eval-location")) || {}; } catch { /* optional */ }
    const parameters = new URLSearchParams(location.search);
    const linkedBook = parameters.get("book");
    const linkedVersion = parameters.get("version");
    const linkedPage = parameters.get("page");
    const requestedBook = catalog.books.find((item) => item.id === (linkedBook || saved.book)) || catalog.books[0];
    const requestedVersion = linkedVersion || (linkedBook ? null : saved.version);
    const targetVersion = requestedBook.versions.find((item) => item.id === requestedVersion) || requestedBook.versions.at(-1);
    const pageKey = linkedPage ? targetVersion.pages.find((item) => item.pageId === linkedPage)?.key : saved.page;
    setOptions(bookPicker, catalog.books.map((item) => [item.title, item.id]), requestedBook.id);
    openBook(requestedBook.id, targetVersion.id, pageKey);
    $("load-status").hidden = true;
    $("review-workspace").hidden = false;
  } catch (error) {
    $("load-status").textContent = error.message;
    $("load-status").classList.add("error");
  }
}

start();
