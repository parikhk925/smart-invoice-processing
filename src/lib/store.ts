"use client";

import { AppNotification, Invoice, User } from "./types";

const USERS_KEY = "sip_users";
const SESSION_KEY = "sip_session";
const INVOICES_KEY = "sip_invoices";
const NOTIFICATIONS_KEY = "sip_notifications";
const SEEDED_KEY = "sip_seeded";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getUsers(): User[] {
  return read<User[]>(USERS_KEY, []);
}

export function saveUsers(users: User[]) {
  write(USERS_KEY, users);
}

export function getSession(): string | null {
  return read<string | null>(SESSION_KEY, null);
}

export function setSession(userId: string | null) {
  write(SESSION_KEY, userId);
}

export function getCurrentUser(): User | null {
  const id = getSession();
  if (!id) return null;
  return getUsers().find((u) => u.id === id) ?? null;
}

export function getInvoicesForUser(userId: string): Invoice[] {
  const all = read<Invoice[]>(INVOICES_KEY, []);
  return all.filter((inv) => inv.createdBy === userId);
}

export function getAllInvoices(): Invoice[] {
  return read<Invoice[]>(INVOICES_KEY, []);
}

export function saveInvoice(invoice: Invoice) {
  const all = read<Invoice[]>(INVOICES_KEY, []);
  const idx = all.findIndex((i) => i.id === invoice.id);
  if (idx >= 0) {
    all[idx] = invoice;
  } else {
    all.unshift(invoice);
  }
  write(INVOICES_KEY, all);
}

export function deleteInvoice(id: string) {
  const all = read<Invoice[]>(INVOICES_KEY, []).filter((i) => i.id !== id);
  write(INVOICES_KEY, all);
}

export function getNotificationsForUser(userId: string): AppNotification[] {
  return read<AppNotification[]>(`${NOTIFICATIONS_KEY}_${userId}`, []);
}

export function addNotification(userId: string, notif: AppNotification) {
  const list = getNotificationsForUser(userId);
  list.unshift(notif);
  write(`${NOTIFICATIONS_KEY}_${userId}`, list);
}

export function markAllNotificationsRead(userId: string) {
  const list = getNotificationsForUser(userId).map((n) => ({ ...n, read: true }));
  write(`${NOTIFICATIONS_KEY}_${userId}`, list);
}

export function seedDemoData(userId: string) {
  const seededKey = `${SEEDED_KEY}_${userId}`;
  if (read<boolean>(seededKey, false)) return;

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const demoInvoices: Invoice[] = [
    {
      id: crypto.randomUUID(),
      invoiceNumber: "INV-2026-0142",
      vendor: "Nimbus Cloud Supplies",
      vendorAddress: "14 Ring Road, Ahmedabad, GJ 380015",
      invoiceDate: new Date(now - 20 * day).toISOString().slice(0, 10),
      dueDate: new Date(now + 10 * day).toISOString().slice(0, 10),
      paymentTerms: "Net 30",
      gstNumber: "24AAACN1234F1Z5",
      currency: "INR",
      category: "Office Supplies",
      subtotal: 42000,
      tax: 7560,
      discount: 500,
      total: 49060,
      status: "Approved",
      fileName: "nimbus-invoice-0142.pdf",
      fileDataUrl: "",
      items: [
        { id: crypto.randomUUID(), description: "Laser printer toner (x6)", quantity: 6, unitPrice: 3500, amount: 21000 },
        { id: crypto.randomUUID(), description: "A4 paper reams (x50)", quantity: 50, unitPrice: 420, amount: 21000 },
      ],
      aiSummary: "Routine office-supplies order from a recurring vendor; amount is consistent with prior invoices.",
      aiRecommendation: "Approve for payment within the Net 30 window.",
      aiRisk: "Low",
      aiFlags: [],
      createdBy: userId,
      createdAt: new Date(now - 20 * day).toISOString(),
      statusHistory: [
        { status: "Draft", at: new Date(now - 20 * day).toISOString() },
        { status: "Pending", at: new Date(now - 19 * day).toISOString() },
        { status: "Approved", at: new Date(now - 17 * day).toISOString() },
      ],
    },
    {
      id: crypto.randomUUID(),
      invoiceNumber: "INV-2026-0198",
      vendor: "Vertex Cloud Hosting",
      vendorAddress: "221 Tech Park, Bengaluru, KA 560103",
      invoiceDate: new Date(now - 6 * day).toISOString().slice(0, 10),
      dueDate: new Date(now + 24 * day).toISOString().slice(0, 10),
      paymentTerms: "Net 30",
      gstNumber: "29AACCV5678K1Z9",
      currency: "INR",
      category: "Software & Subscriptions",
      subtotal: 118000,
      tax: 21240,
      discount: 0,
      total: 139240,
      status: "Pending",
      fileName: "vertex-hosting-0198.pdf",
      fileDataUrl: "",
      items: [
        { id: crypto.randomUUID(), description: "Cloud hosting — Monthly plan", quantity: 1, unitPrice: 98000, amount: 98000 },
        { id: crypto.randomUUID(), description: "Additional storage (500GB)", quantity: 1, unitPrice: 20000, amount: 20000 },
      ],
      aiSummary: "Monthly hosting invoice, amount is ~8% higher than last month due to extra storage add-on.",
      aiRecommendation: "Review the storage add-on before approving; otherwise routine.",
      aiRisk: "Medium",
      aiFlags: ["Amount higher than previous invoice from this vendor"],
      createdBy: userId,
      createdAt: new Date(now - 6 * day).toISOString(),
      statusHistory: [
        { status: "Draft", at: new Date(now - 6 * day).toISOString() },
        { status: "Pending", at: new Date(now - 5 * day).toISOString() },
      ],
    },
    {
      id: crypto.randomUUID(),
      invoiceNumber: "INV-2026-0071",
      vendor: "Prime Facilities Co.",
      vendorAddress: "9 MG Road, Pune, MH 411001",
      invoiceDate: new Date(now - 45 * day).toISOString().slice(0, 10),
      dueDate: new Date(now - 15 * day).toISOString().slice(0, 10),
      paymentTerms: "Net 30",
      gstNumber: "27AABCP4321L1ZQ",
      currency: "INR",
      category: "Facilities",
      subtotal: 30000,
      tax: 5400,
      discount: 0,
      total: 35400,
      status: "Paid",
      fileName: "prime-facilities-0071.pdf",
      fileDataUrl: "",
      items: [
        { id: crypto.randomUUID(), description: "Office cleaning services — Monthly", quantity: 1, unitPrice: 30000, amount: 30000 },
      ],
      aiSummary: "Standard monthly facilities invoice, matches contracted rate.",
      aiRecommendation: "No action needed — already paid on time.",
      aiRisk: "Low",
      aiFlags: [],
      createdBy: userId,
      createdAt: new Date(now - 45 * day).toISOString(),
      statusHistory: [
        { status: "Draft", at: new Date(now - 45 * day).toISOString() },
        { status: "Pending", at: new Date(now - 44 * day).toISOString() },
        { status: "Approved", at: new Date(now - 40 * day).toISOString() },
        { status: "Paid", at: new Date(now - 18 * day).toISOString() },
      ],
    },
  ];

  const all = read<Invoice[]>(INVOICES_KEY, []);
  write(INVOICES_KEY, [...demoInvoices, ...all]);

  const notifs: AppNotification[] = [
    { id: crypto.randomUUID(), message: "Invoice INV-2026-0198 uploaded and is awaiting review.", type: "upload", createdAt: new Date(now - 5 * day).toISOString(), read: false },
    { id: crypto.randomUUID(), message: "Invoice INV-2026-0142 was approved.", type: "approved", createdAt: new Date(now - 17 * day).toISOString(), read: true },
    { id: crypto.randomUUID(), message: "Invoice INV-2026-0071 payment completed.", type: "paid", createdAt: new Date(now - 18 * day).toISOString(), read: true },
  ];
  write(`${NOTIFICATIONS_KEY}_${userId}`, notifs);

  write(seededKey, true);
}
