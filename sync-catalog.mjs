#!/usr/bin/env node
/**
 * Κάνει λήψη του καταλόγου της σχολικής βιβλιοθήκης από το myLib και γράφει
 * το assets/catalog.json που διαβάζει η σελίδα.
 *
 * Χρήση:
 *   node tools/sync-catalog.mjs            # πλήρης ενημέρωση
 *   node tools/sync-catalog.mjs --quick    # μόνο τίτλοι/συγγραφείς (1 αίτημα)
 *
 * Το myLib δεν έχει δημόσιο endpoint για μαζική εξαγωγή, οπότε:
 *   1) method=allBooks  -> barcode, title, author, Dewey
 *   2) method=bookview  -> εκδότης, έτος, σελίδες, ISBN, ταξιθετικός, γλώσσα
 * Τα αιτήματα γίνονται με μικρό parallelism για να μη ζορίζεται ο server.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = "https://lib7epal-larisa.mysch.gr";
const ENDPOINT = `${BASE}/ctrl/processbook.php`;
const CONCURRENCY = 4;
const UA = "7epal-larisa-library-site/1.0 (school library catalogue sync)";

const quick = process.argv.includes("--quick");
const here = path.dirname(fileURLToPath(import.meta.url));
const outFile = path.resolve(here, "../assets/catalog.json");

async function call(method, params = {}) {
  const body = new URLSearchParams({ method, ...params });
  let lastError;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded", "user-agent": UA },
        body,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  throw lastError;
}

async function mapLimit(items, limit, worker) {
  let index = 0;
  let done = 0;
  const results = new Array(items.length);
  async function run() {
    while (index < items.length) {
      const i = index++;
      results[i] = await worker(items[i], i);
      done++;
      if (done % 100 === 0 || done === items.length) {
        process.stdout.write(`\r  ${done}/${items.length} βιβλία`);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  process.stdout.write("\n");
  return results;
}

function clean(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\s+/g, " ").trim();
}

function numberOrZero(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

console.log("Λήψη λίστας βιβλίων (method=allBooks)…");
const list = JSON.parse(await call("allBooks"));
console.log(`  ${list.length} εγγραφές`);

const books = quick
  ? list.map((b) => ({ barcode: Number(b.barcode), title: clean(b.title), author: clean(b.author), dewey: numberOrZero(b.category) }))
  : await mapLimit(list, CONCURRENCY, async (item) => {
      const raw = await call("bookview", { barcode: String(item.barcode) });
      let detail = {};
      try {
        detail = JSON.parse(raw).book ?? {};
      } catch {
        /* κρατάμε ό,τι έχουμε από τη λίστα */
      }
      const book = {
        barcode: Number(item.barcode),
        title: clean(detail.title || item.title),
        author: clean(detail.author || item.author),
        dewey: numberOrZero(detail.category || item.category),
      };
      const subtitle = clean(detail.subtitle);
      const publisher = clean(detail.publisher);
      const callno = [clean(detail.cat_number), clean(detail.author_letters)].filter(Boolean).join(" ");
      const info = clean(detail.info);
      if (subtitle) book.subtitle = subtitle;
      if (publisher) book.publisher = publisher;
      if (callno) book.callno = callno;
      if (info) book.info = info.slice(0, 600);
      return book;
    });

books.sort((a, b) => a.title.localeCompare(b.title, "el"));

const payload = {
  generated: new Date().toISOString().slice(0, 10),
  source: `${BASE}/allBooks`,
  provider: "myLib (Πανελλήνιο Σχολικό Δίκτυο)",
  count: books.length,
  books,
};

const json = JSON.stringify(payload);
await fs.writeFile(outFile, json, "utf8");
console.log(`✓ ${outFile}`);
console.log(`  ${books.length} βιβλία, ${(json.length / 1024).toFixed(0)} KB`);
