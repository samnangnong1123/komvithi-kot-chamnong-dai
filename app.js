const SUPABASE_TABLE = "wedding_gifts";
const REFRESH_INTERVAL_MS = 10000;

const elements = {
  form: document.getElementById("giftForm"),
  guestName: document.getElementById("guestName"),
  giftAmount: document.getElementById("giftAmount"),
  currency: document.getElementById("currency"),
  giftType: document.getElementById("giftType"),
  note: document.getElementById("note"),
  searchInput: document.getElementById("searchInput"),
  exportBtn: document.getElementById("exportBtn"),
  guestCount: document.getElementById("guestCount"),
  totalAmount: document.getElementById("totalAmount"),
  rielAmount: document.getElementById("rielAmount"),
  emptyState: document.getElementById("emptyState"),
  recordList: document.getElementById("recordList"),
  recordTemplate: document.getElementById("recordTemplate"),
  statusBanner: document.getElementById("statusBanner"),
  syncText: document.getElementById("syncText")
};

const appConfig = window.APP_CONFIG || {};
const supabaseUrl = (appConfig.supabaseUrl || "").replace(/\/$/, "");
const supabaseAnonKey = appConfig.supabaseAnonKey || "";

let records = [];
let pollTimer = null;
let isLoading = false;

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

function formatCurrency(amount, currency) {
  if (currency === "KHR") {
    return `៛${Math.round(Number(amount || 0)).toLocaleString()}`;
  }

  return `$${Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: Number(amount || 0) % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  })}`;
}

function formatDate(value) {
  return new Date(value).toLocaleString("km-KH", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function buildMeta(record) {
  return [record.gift_type || "ចំណងដៃ", record.currency === "KHR" ? "រៀល" : "USD"]
    .filter(Boolean)
    .join(" • ");
}

function filterRecords(keyword) {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) {
    return records;
  }

  return records.filter((record) =>
    [record.guest_name, record.note, record.gift_type]
      .join(" ")
      .toLowerCase()
      .includes(normalized)
  );
}

function renderSummary(items) {
  const totalUSD = items
    .filter((item) => item.currency === "USD")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalKHR = items
    .filter((item) => item.currency === "KHR")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  elements.guestCount.textContent = items.length.toLocaleString();
  elements.totalAmount.textContent = formatCurrency(totalUSD, "USD");
  elements.rielAmount.textContent = formatCurrency(totalKHR, "KHR");
}

function renderRecords(items) {
  elements.recordList.innerHTML = "";
  elements.emptyState.hidden = items.length > 0;
  renderSummary(items);

  const fragment = document.createDocumentFragment();

  items.forEach((record) => {
    const node = elements.recordTemplate.content.cloneNode(true);
    node.querySelector(".record-name").textContent = record.guest_name;
    node.querySelector(".record-meta").textContent = buildMeta(record);
    node.querySelector(".record-amount").textContent = formatCurrency(record.amount, record.currency);
    node.querySelector(".record-note").textContent = record.note || "មិនមានកំណត់ចំណាំ";
    node.querySelector(".record-date").textContent = formatDate(record.created_at);
    node.querySelector(".delete-btn").dataset.id = record.id;
    fragment.appendChild(node);
  });

  elements.recordList.appendChild(fragment);
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

async function loadRecords() {
  if (!hasSupabaseConfig() || isLoading) {
    return;
  }

  isLoading = true;
  updateStatus("កំពុងទាញទិន្នន័យពី Supabase...", "muted");

  try {
    const data = await supabaseRequest(
      `${SUPABASE_TABLE}?select=id,guest_name,amount,currency,gift_type,note,created_at&order=created_at.desc`
    );
    records = Array.isArray(data) ? data : [];
    renderRecords(filterRecords(elements.searchInput.value));
    updateStatus(`ទាញទិន្នន័យចុងក្រោយបាននៅ ${formatDate(new Date().toISOString())}`, "success");
  } catch (error) {
    console.error("Failed to load records:", error);
    updateStatus("មិនអាចភ្ជាប់ទៅ Supabase បានទេ។ សូមពិនិត្យ config និង policy។", "danger");
  } finally {
    isLoading = false;
  }
}

async function addRecord(event) {
  event.preventDefault();

  if (!hasSupabaseConfig()) {
    updateStatus("សូមបំពេញ Supabase URL និង anon key ក្នុង config.js ជាមុនសិន។", "danger");
    return;
  }

  const guestName = elements.guestName.value.trim();
  const amount = Number(elements.giftAmount.value);
  const currency = elements.currency.value;
  const giftType = elements.giftType.value.trim();
  const note = elements.note.value.trim();

  if (!guestName || Number.isNaN(amount) || amount < 0) {
    updateStatus("សូមបញ្ចូលឈ្មោះភ្ញៀវ និងចំនួនទឹកប្រាក់ឲ្យត្រឹមត្រូវ។", "danger");
    return;
  }

  updateStatus("កំពុងរក្សាទុកទៅ database...", "muted");

  try {
    await supabaseRequest(SUPABASE_TABLE, {
      method: "POST",
      body: [
        {
          guest_name: guestName,
          amount,
          currency,
          gift_type: giftType || null,
          note: note || null
        }
      ]
    });

    elements.form.reset();
    await loadRecords();
    updateStatus("រក្សាទុកទៅ database បានជោគជ័យ។", "success");
  } catch (error) {
    console.error("Failed to save record:", error);
    updateStatus("រក្សាទុកមិនបានទេ។ សូមពិនិត្យ table/policy នៅ Supabase។", "danger");
  }
}

async function deleteRecord(event) {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement) || !target.dataset.id) {
    return;
  }

  if (!hasSupabaseConfig()) {
    updateStatus("សូមបំពេញ Supabase config ជាមុនសិន។", "danger");
    return;
  }

  updateStatus("កំពុងលុបទិន្នន័យ...", "muted");

  try {
    await supabaseRequest(`${SUPABASE_TABLE}?id=eq.${encodeURIComponent(target.dataset.id)}`, {
      method: "DELETE",
      prefer: "return=minimal"
    });
    await loadRecords();
    updateStatus("លុបទិន្នន័យបានជោគជ័យ។", "success");
  } catch (error) {
    console.error("Failed to delete record:", error);
    updateStatus("លុបទិន្នន័យមិនបានទេ។ សូមពិនិត្យ delete policy។", "danger");
  }
}

function exportCsv() {
  const items = filterRecords(elements.searchInput.value);
  if (!items.length) {
    updateStatus("មិនមានទិន្នន័យសម្រាប់ export ទេ។", "muted");
    return;
  }

  const header = ["Guest Name", "Amount", "Currency", "Gift Type", "Note", "Created At"];
  const rows = items.map((record) => [
    record.guest_name,
    record.amount,
    record.currency,
    record.gift_type,
    record.note,
    record.created_at
  ]);

  const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "wedding-gifts.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function startAutoRefresh() {
  if (!hasSupabaseConfig()) {
    updateStatus("សូមកែ config.js ដាក់ Supabase URL និង anon key ជាមុនសិន។", "danger");
    renderRecords([]);
    return;
  }

  if (pollTimer) {
    clearInterval(pollTimer);
  }

  loadRecords();
  pollTimer = window.setInterval(loadRecords, REFRESH_INTERVAL_MS);
}

elements.form.addEventListener("submit", addRecord);
elements.searchInput.addEventListener("input", (event) => {
  renderRecords(filterRecords(event.target.value));
});
elements.exportBtn.addEventListener("click", exportCsv);
elements.recordList.addEventListener("click", deleteRecord);

startAutoRefresh();
