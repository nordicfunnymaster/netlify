const STORAGE_KEY = "inventory-items-v1";

const form = document.getElementById("item-form");
const search = document.getElementById("search");
const body = document.getElementById("inventory-body");
const rowTemplate = document.getElementById("row-template");

let items = loadItems();

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const name = (formData.get("name") || "").toString().trim();
  const category = (formData.get("category") || "").toString().trim();
  const quantity = Number(formData.get("quantity") || 0);
  const minStock = Number(formData.get("minStock") || 0);

  if (!name || !category || Number.isNaN(quantity) || Number.isNaN(minStock)) {
    return;
  }

  items.push({
    id: crypto.randomUUID(),
    name,
    category,
    quantity,
    minStock,
  });

  persistAndRender();
  form.reset();
  form.quantity.value = "0";
  form.minStock.value = "0";
});

search.addEventListener("input", render);

body.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;

  const row = target.closest("tr");
  if (!row) return;
  const id = row.dataset.id;
  if (!id) return;

  if (target.dataset.action === "delete") {
    items = items.filter((item) => item.id !== id);
    persistAndRender();
  }

  if (target.dataset.action === "save") {
    const quantityInput = row.querySelector('input[data-cell="quantity"]');
    const minStockInput = row.querySelector('input[data-cell="minStock"]');

    if (!(quantityInput instanceof HTMLInputElement) || !(minStockInput instanceof HTMLInputElement)) {
      return;
    }

    const updatedQuantity = Number(quantityInput.value);
    const updatedMinStock = Number(minStockInput.value);

    if (Number.isNaN(updatedQuantity) || Number.isNaN(updatedMinStock)) {
      return;
    }

    items = items.map((item) =>
      item.id === id
        ? { ...item, quantity: Math.max(0, updatedQuantity), minStock: Math.max(0, updatedMinStock) }
        : item,
    );

    persistAndRender();
  }
});

function loadItems() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && item.id && item.name && item.category);
  } catch {
    return [];
  }
}

function persistAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  render();
}

function render() {
  const query = search.value.trim().toLowerCase();

  const filtered = items.filter((item) => {
    if (!query) return true;
    return (
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  });

  body.innerHTML = "";

  for (const item of filtered) {
    const fragment = rowTemplate.content.cloneNode(true);
    const row = fragment.querySelector("tr");
    row.dataset.id = item.id;

    fragment.querySelector('[data-cell="name"]').textContent = item.name;
    fragment.querySelector('[data-cell="category"]').textContent = item.category;

    const quantityInput = fragment.querySelector('input[data-cell="quantity"]');
    const minStockInput = fragment.querySelector('input[data-cell="minStock"]');

    quantityInput.value = String(item.quantity);
    minStockInput.value = String(item.minStock);

    const statusCell = fragment.querySelector('[data-cell="status"]');
    const low = item.quantity <= item.minStock;
    statusCell.textContent = low ? "Lav beholdning" : "OK";
    statusCell.className = low ? "status-low" : "status-ok";

    body.appendChild(fragment);
  }
}

render();
