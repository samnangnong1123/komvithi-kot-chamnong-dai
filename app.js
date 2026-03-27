const SUPABASE_TABLE = "stories";
const REFRESH_INTERVAL_MS = 10000;
const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80";

const elements = {
  form: document.getElementById("storyForm"),
  storyTitle: document.getElementById("storyTitle"),
  authorName: document.getElementById("authorName"),
  storyCategory: document.getElementById("storyCategory"),
  coverUrl: document.getElementById("coverUrl"),
  storyExcerpt: document.getElementById("storyExcerpt"),
  storyContent: document.getElementById("storyContent"),
  searchInput: document.getElementById("searchInput"),
  exportBtn: document.getElementById("exportBtn"),
  storyCount: document.getElementById("storyCount"),
  categoryCount: document.getElementById("categoryCount"),
  wordCount: document.getElementById("wordCount"),
  emptyState: document.getElementById("emptyState"),
  storyGrid: document.getElementById("storyGrid"),
  storyTemplate: document.getElementById("storyTemplate"),
  spotlightList: document.getElementById("spotlightList"),
  spotlightTemplate: document.getElementById("spotlightTemplate"),
  categoryPills: document.getElementById("categoryPills"),
  featuredBackdrop: document.getElementById("featuredBackdrop"),
  featuredTitle: document.getElementById("featuredTitle"),
  featuredMeta: document.getElementById("featuredMeta"),
  featuredExcerpt: document.getElementById("featuredExcerpt"),
  statusBanner: document.getElementById("statusBanner"),
  syncText: document.getElementById("syncText")
};

const appConfig = window.APP_CONFIG || {};
const supabaseUrl = (appConfig.supabaseUrl || "").replace(/\/$/, "");
const supabaseAnonKey = appConfig.supabaseAnonKey || "";

let stories = [];
let pollTimer = null;
let isLoading = false;
let activeCategory = "All";

function hasSupabaseConfig() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

function updateStatus(message, tone = "muted") {
  elements.syncText.textContent = message;
  elements.statusBanner.dataset.tone = tone;
}

function escapeCsv(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function formatDate(value) {
  return new Date(value).toLocaleString("km-KH", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function toWordCount(text) {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function summarizeContent(text, length = 160) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= length) {
    return normalized;
  }
  return `${normalized.slice(0, length).trim()}...`;
}

function getFilteredStories(keyword = elements.searchInput.value) {
  const normalized = keyword.trim().toLowerCase();

  return stories.filter((story) => {
    const matchesSearch = !normalized
      || [story.title, story.author_name, story.category, story.excerpt, story.content]
        .join(" ")
        .toLowerCase()
        .includes(normalized);

    const matchesCategory = activeCategory === "All" || story.category === activeCategory;
    return matchesSearch && matchesCategory;
  });
}

function renderSummary(items) {
  const categorySet = new Set(items.map((item) => item.category).filter(Boolean));
  const words = items.reduce((sum, item) => sum + toWordCount(item.content), 0);

  elements.storyCount.textContent = `${items.length.toLocaleString()} រឿង`;
  elements.categoryCount.textContent = `${categorySet.size.toLocaleString()} ប្រភេទ`;
  elements.wordCount.textContent = `${words.toLocaleString()} ពាក្យ`;
}

function renderFeatured(items) {
  const featured = items[0];
  if (!featured) {
    elements.featuredBackdrop.style.backgroundImage = `url("${DEFAULT_COVER}")`;
    elements.featuredTitle.textContent = "មិនទាន់មានរឿង";
    elements.featuredMeta.textContent = "បង្ហោះរឿងដំបូងរបស់អ្នក";
    elements.featuredExcerpt.textContent = "នៅពេលអ្នកបង្ហោះរឿងថ្មី វានឹងបង្ហាញនៅផ្នែក Featured ដោយស្វ័យប្រវត្តិ។";
    return;
  }

  elements.featuredBackdrop.style.backgroundImage = `url("${featured.cover_url || DEFAULT_COVER}")`;
  elements.featuredTitle.textContent = featured.title;
  elements.featuredMeta.textContent = `${featured.author_name} • ${featured.category || "Story"} • ${new Date(
    featured.created_at
  ).getFullYear()}`;
  elements.featuredExcerpt.textContent = featured.excerpt || summarizeContent(featured.content, 220);
}

function renderSpotlight(items) {
  elements.spotlightList.innerHTML = "";
  const fragment = document.createDocumentFragment();

  items.slice(0, 6).forEach((story) => {
    const node = elements.spotlightTemplate.content.cloneNode(true);
    node.querySelector(".spotlight-item__cover").src = story.cover_url || DEFAULT_COVER;
    node.querySelector(".spotlight-item__cover").alt = story.title;
    node.querySelector(".spotlight-item__title").textContent = story.title;
    node.querySelector(".spotlight-item__meta").textContent = `${story.category || "Story"} • ${story.author_name}`;
    fragment.appendChild(node);
  });

  elements.spotlightList.appendChild(fragment);
}

function renderCategories(items) {
  const categories = ["All", ...new Set(items.map((item) => item.category).filter(Boolean))];
  elements.categoryPills.innerHTML = "";

  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = category === activeCategory ? "pill pill--active" : "pill";
    button.textContent = category === "All" ? "ទាំងអស់" : category;
    button.dataset.category = category;
    elements.categoryPills.appendChild(button);
  });
}

function renderStories(items) {
  elements.storyGrid.innerHTML = "";
  elements.emptyState.hidden = items.length > 0;
  renderSummary(items);

  const fragment = document.createDocumentFragment();

  items.forEach((story) => {
    const node = elements.storyTemplate.content.cloneNode(true);
    const cover = node.querySelector(".story-cover");

    cover.src = story.cover_url || DEFAULT_COVER;
    cover.alt = story.title;
    node.querySelector(".story-badge").textContent = `${toWordCount(story.content)} ពាក្យ`;
    node.querySelector(".story-category").textContent = story.category || "Story";
    node.querySelector(".story-title").textContent = story.title;
    node.querySelector(".story-meta").textContent = `${story.author_name} • ${new Date(story.created_at).getFullYear()}`;
    node.querySelector(".story-excerpt").textContent = story.excerpt || "មិនមានសេចក្តីសង្ខេប";
    node.querySelector(".story-content").textContent = summarizeContent(story.content, 260);
    node.querySelector(".record-date").textContent = formatDate(story.created_at);
    node.querySelector(".delete-btn").dataset.id = story.id;
    fragment.appendChild(node);
  });

  elements.storyGrid.appendChild(fragment);
}

function refreshUi() {
  const filtered = getFilteredStories();
  renderFeatured(filtered.length ? filtered : stories);
  renderSpotlight(stories);
  renderCategories(stories);
  renderStories(filtered);
}

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    method: options.method || "GET",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
      ...options.headers
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function loadStories() {
  if (!hasSupabaseConfig() || isLoading) {
    return;
  }

  isLoading = true;
  updateStatus("កំពុងទាញរឿងពី Supabase...", "muted");

  try {
    const data = await supabaseRequest(
      `${SUPABASE_TABLE}?select=id,title,author_name,category,cover_url,excerpt,content,created_at&order=created_at.desc`
    );
    stories = Array.isArray(data) ? data : [];
    refreshUi();
    updateStatus(`ទាញរឿងចុងក្រោយបាននៅ ${formatDate(new Date().toISOString())}`, "success");
  } catch (error) {
    console.error("Failed to load stories:", error);
    updateStatus("មិនអាចភ្ជាប់ទៅ Supabase បានទេ។ សូមពិនិត្យ config និង SQL schema។", "danger");
  } finally {
    isLoading = false;
  }
}

async function addStory(event) {
  event.preventDefault();

  if (!hasSupabaseConfig()) {
    updateStatus("សូមបំពេញ Supabase URL និង anon key ក្នុង config.js ជាមុនសិន។", "danger");
    return;
  }

  const title = elements.storyTitle.value.trim();
  const authorName = elements.authorName.value.trim();
  const category = elements.storyCategory.value;
  const coverUrl = elements.coverUrl.value.trim();
  const excerpt = elements.storyExcerpt.value.trim();
  const content = elements.storyContent.value.trim();

  if (!title || !authorName || !content) {
    updateStatus("សូមបំពេញចំណងជើង អ្នកនិពន្ធ និងខ្លឹមសាររឿងឲ្យគ្រប់។", "danger");
    return;
  }

  updateStatus("កំពុងបង្ហោះរឿងទៅ database...", "muted");

  try {
    await supabaseRequest(SUPABASE_TABLE, {
      method: "POST",
      body: [
        {
          title,
          author_name: authorName,
          category,
          cover_url: coverUrl || null,
          excerpt: excerpt || null,
          content
        }
      ]
    });

    elements.form.reset();
    await loadStories();
    updateStatus("បង្ហោះរឿងបានជោគជ័យ។", "success");
  } catch (error) {
    console.error("Failed to save story:", error);
    updateStatus("បង្ហោះរឿងមិនបានទេ។ សូមពិនិត្យ table/policy នៅ Supabase។", "danger");
  }
}

async function deleteStory(event) {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement) || !target.dataset.id) {
    return;
  }

  if (!hasSupabaseConfig()) {
    updateStatus("សូមបំពេញ Supabase config ជាមុនសិន។", "danger");
    return;
  }

  updateStatus("កំពុងលុបរឿង...", "muted");

  try {
    await supabaseRequest(`${SUPABASE_TABLE}?id=eq.${encodeURIComponent(target.dataset.id)}`, {
      method: "DELETE",
      prefer: "return=minimal"
    });
    await loadStories();
    updateStatus("លុបរឿងបានជោគជ័យ។", "success");
  } catch (error) {
    console.error("Failed to delete story:", error);
    updateStatus("លុបរឿងមិនបានទេ។ សូមពិនិត្យ delete policy។", "danger");
  }
}

function exportCsv() {
  const items = getFilteredStories();
  if (!items.length) {
    updateStatus("មិនមានរឿងសម្រាប់ export ទេ។", "muted");
    return;
  }

  const header = ["Title", "Author", "Category", "Excerpt", "Content", "Created At"];
  const rows = items.map((story) => [
    story.title,
    story.author_name,
    story.category,
    story.excerpt,
    story.content,
    story.created_at
  ]);

  const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "stories.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function startAutoRefresh() {
  if (!hasSupabaseConfig()) {
    updateStatus("សូមកែ config.js ដាក់ Supabase URL និង anon key ជាមុនសិន។", "danger");
    refreshUi();
    return;
  }

  if (pollTimer) {
    clearInterval(pollTimer);
  }

  loadStories();
  pollTimer = window.setInterval(loadStories, REFRESH_INTERVAL_MS);
}

elements.form.addEventListener("submit", addStory);
elements.searchInput.addEventListener("input", () => {
  refreshUi();
});
elements.exportBtn.addEventListener("click", exportCsv);
elements.storyGrid.addEventListener("click", deleteStory);
elements.categoryPills.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement) || !target.dataset.category) {
    return;
  }

  activeCategory = target.dataset.category;
  refreshUi();
});

refreshUi();
startAutoRefresh();
