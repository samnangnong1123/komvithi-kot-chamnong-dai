const storageKey = "wedding-gift-records";

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
  recordTemplate: document.getElementById("recordTemplate")
};

let records = loadRecords();

function loadRecords() {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("Cannot load records:", error);
    return [];
  }
}

function saveRecords() {
  localStorage.setItem(storageKey, JSON.stringify(records));
}

function formatCurrency(amount, currency) {
  const symbol = currency || "$";
  if (symbol === "៛") {
    return `៛${Math.round(amount).toLocaleString()}`;
  }

  return `$${Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  })}`;
}

function formatDate(value) {
  return new Date(value).toLocaleString("km-KH", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function renderSummary(items) {
  const count = items.length;
  const totalUSD = items
    .filter((item) => item.currency === "$")
    .reduce((sum, item) => sum + item.amount, 0);
  const totalKHR = items
    .filter((item) => item.currency === "៛")
    .reduce((sum, item) => sum + item.amount, 0);

  elements.guestCount.textContent = count.toLocaleString();
  elements.totalAmount.textContent = formatCurrency(totalUSD, "$");
  elements.rielAmount.textContent = formatCurrency(totalKHR, "៛");
}

function buildMeta(record) {
  return [record.giftType || "ចំណងដៃ", record.currency === "៛" ? "រៀល" : "USD"]
    .filter(Boolean)
    .join(" • ");
}

function renderRecords(items) {
  elements.recordList.innerHTML = "";
  elements.emptyState.hidden = items.length > 0;
  renderSummary(items);

  const fragment = document.createDocumentFragment();

  items.forEach((record) => {
    const node = elements.recordTemplate.content.cloneNode(true);
    node.querySelector(".record-name").textContent = record.guestName;
    node.querySelector(".record-meta").textContent = buildMeta(record);
    node.querySelector(".record-amount").textContent = formatCurrency(record.amount, record.currency);
    node.querySelector(".record-note").textContent = record.note || "មិនមានកំណត់ចំណាំ";
    node.querySelector(".record-date").textContent = formatDate(record.createdAt);
    node.querySelector(".delete-btn").dataset.id = record.id;
    fragment.appendChild(node);
  });

  elements.recordList.appendChild(fragment);
}

function addRecord(event) {
  event.preventDefault();

  const guestName = elements.guestName.value.trim();
  const amount = Number(elements.giftAmount.value);
  const currency = elements.currency.value;
  const giftType = elements.giftType.value.trim();
  const note = elements.note.value.trim();

  if (!guestName || Number.isNaN(amount) || amount < 0) {
    return;
  }

  records.unshift({
    id: crypto.randomUUID(),
    guestName,
    amount,
    currency,
    giftType,
    note,
    createdAt: new Date().toISOString()
  });

  saveRecords();
  elements.form.reset();
  renderRecords(filterRecords(elements.searchInput.value));
}

function filterRecords(keyword) {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) {
    return records;
  }

  return records.filter((record) =>
    [record.guestName, record.note, record.giftType]
      .join(" ")
      .toLowerCase()
      .includes(normalized)
  );
}

function deleteRecord(event) {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement) || !target.dataset.id) {
    return;
  }

  records = records.filter((record) => record.id !== target.dataset.id);
  saveRecords();
  renderRecords(filterRecords(elements.searchInput.value));
}

function exportCsv() {
  if (!records.length) {
    return;
  }

  const header = ["Guest Name", "Amount", "Currency", "Gift Type", "Note", "Created At"];
  const rows = records.map((record) => [
    record.guestName,
    record.amount,
    record.currency,
    record.giftType,
    record.note,
    record.createdAt
  ]);

  const csv = [header, ...rows]
    .map((row) =>
      row
        .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "wedding-gifts.csv";
  link.click();
  URL.revokeObjectURL(url);
}

elements.form.addEventListener("submit", addRecord);
elements.searchInput.addEventListener("input", (event) => {
  renderRecords(filterRecords(event.target.value));
});
elements.exportBtn.addEventListener("click", exportCsv);
elements.recordList.addEventListener("click", deleteRecord);

renderRecords(records);
