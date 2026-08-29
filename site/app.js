const state = {
  indexes: [],
  query: "",
  activity: "all",
  license: "all",
  sort: "coverage",
};

const elements = {
  search: document.querySelector("#search"),
  activity: document.querySelector("#activity-filter"),
  license: document.querySelector("#license-filter"),
  sort: document.querySelector("#sort"),
  results: document.querySelector("#results"),
  resultCount: document.querySelector("#result-count"),
  empty: document.querySelector("#empty-state"),
  indexStat: document.querySelector("#index-stat"),
  linkStat: document.querySelector("#link-stat"),
  updatedStat: document.querySelector("#updated-stat"),
};

const numberFormatter = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const dateFormatter = new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" });

function daysSince(timestamp) {
  return (Date.now() - new Date(timestamp).getTime()) / 86_400_000;
}

function matchesActivity(index) {
  const days = daysSince(index.timestamps.pushedAt);
  if (state.activity === "month") return days <= 30;
  if (state.activity === "six-months") return days <= 183;
  if (state.activity === "dormant") return days > 183;
  return true;
}

function searchableText(index) {
  return [index.fullName, index.description, index.license, ...index.topics]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function filteredIndexes() {
  const query = state.query.trim().toLowerCase();
  const items = state.indexes.filter(
    (index) =>
      (!query || searchableText(index).includes(query)) &&
      matchesActivity(index) &&
      (state.license === "all" || (index.license ?? "No license") === state.license),
  );

  const comparators = {
    coverage: (a, b) => b.analysis.linkedRepositoryCount - a.analysis.linkedRepositoryCount,
    unique: (a, b) => b.analysis.uniqueLinkedRepositoryCount - a.analysis.uniqueLinkedRepositoryCount,
    stars: (a, b) => b.metrics.stars - a.metrics.stars,
    updated: (a, b) => new Date(b.timestamps.pushedAt) - new Date(a.timestamps.pushedAt),
    name: (a, b) => a.fullName.localeCompare(b.fullName),
  };

  return items.sort(
    (a, b) => comparators[state.sort](a, b) || a.fullName.localeCompare(b.fullName),
  );
}

function metric(label, value) {
  const wrapper = document.createElement("div");
  const strong = document.createElement("strong");
  const span = document.createElement("span");
  strong.textContent = numberFormatter.format(value);
  span.textContent = label;
  wrapper.append(strong, span);
  return wrapper;
}

function indexCard(index) {
  const article = document.createElement("article");
  article.className = "index-card";

  const heading = document.createElement("h3");
  const link = document.createElement("a");
  link.href = index.url;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = index.fullName;
  heading.append(link);

  const description = document.createElement("p");
  description.className = "description";
  description.textContent = index.description || "No repository description provided.";

  const metrics = document.createElement("div");
  metrics.className = "metrics";
  metrics.append(
    metric("linked repos", index.analysis.linkedRepositoryCount),
    metric("unique", index.analysis.uniqueLinkedRepositoryCount),
    metric("stars", index.metrics.stars),
  );

  const meta = document.createElement("div");
  meta.className = "meta";
  const pushed = document.createElement("span");
  pushed.textContent = `Updated ${dateFormatter.format(new Date(index.timestamps.pushedAt))}`;
  const license = document.createElement("span");
  license.textContent = index.license ?? "No license";
  meta.append(pushed, license);

  const topics = document.createElement("ul");
  topics.className = "topics";
  for (const topic of index.topics.slice(0, 4)) {
    const item = document.createElement("li");
    item.textContent = topic;
    topics.append(item);
  }

  article.append(heading, description, metrics, meta);
  if (topics.childElementCount) article.append(topics);
  return article;
}

function render() {
  const indexes = filteredIndexes();
  elements.results.replaceChildren(...indexes.map(indexCard));
  elements.resultCount.textContent = `${indexes.length.toLocaleString()} of ${state.indexes.length.toLocaleString()} indexes`;
  elements.empty.hidden = indexes.length !== 0;
}

function populateLicenses() {
  const licenses = [...new Set(state.indexes.map((index) => index.license ?? "No license"))].sort();
  for (const value of licenses) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    elements.license.append(option);
  }
}

function bindControls() {
  elements.search.addEventListener("input", (event) => {
    state.query = event.target.value;
    render();
  });
  elements.activity.addEventListener("change", (event) => {
    state.activity = event.target.value;
    render();
  });
  elements.license.addEventListener("change", (event) => {
    state.license = event.target.value;
    render();
  });
  elements.sort.addEventListener("change", (event) => {
    state.sort = event.target.value;
    render();
  });
}

async function start() {
  try {
    const response = await fetch("./data/indexes.json");
    if (!response.ok) throw new Error(`Dataset request failed: ${response.status}`);
    const data = await response.json();
    state.indexes = data.indexes;

    elements.indexStat.textContent = data.indexes.length.toLocaleString();
    elements.linkStat.textContent = numberFormatter.format(
      data.indexes.reduce((sum, index) => sum + index.analysis.linkedRepositoryCount, 0),
    );
    elements.updatedStat.textContent = dateFormatter.format(new Date(data.generatedAt));
    populateLicenses();
    bindControls();
    render();
  } catch (error) {
    elements.resultCount.textContent = "Could not load the catalog.";
    elements.empty.hidden = false;
    elements.empty.textContent = error instanceof Error ? error.message : String(error);
  }
}

void start();
