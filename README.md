# Dalwa's Kitchen — Static Marketplace Demo

This is a **client-side, static** demo marketplace named **Dalwa's Kitchen** built to be functional without a server, using `localStorage` to simulate data storage.

## What's included
- `index.html` — Homepage (categories, featured)
- `shop.html` — Marketplace with search, filters, cart, and checkout (COD / simulated online)
- `vendor.html` — Vendor dashboard to register and post items (posts go to admin pending list)
- `admin.html` — Admin dashboard to approve vendors/products, set commission, view transactions
- `buyer.html` — Buyer account to login, view favorites and past orders
- `styles.css` — Basic styles
- `app.js` — All functionality implemented in plain JavaScript using `localStorage`

## How to use
1. Unzip and open `index.html` in your browser.
2. Use `vendor.html` to register a vendor — registration is pending until approved in `admin.html`.
3. Admin approves vendors and pending products.
4. Buyer can login on `buyer.html`, add items to cart on `shop.html` and checkout.
5. All data is stored locally in your browser's localStorage.

## Notes & Limitations
- This is a front-end demo only — no real backend or payments.
- For real deployment, you would connect the UI to a backend (e.g., Firebase, Supabase, Node.js + database).
- Images use placeholder `picsum.photos` URLs.
- To reset demo data, clear localStorage for key `dalwas_kitchen_v1` and other `dk_*` keys.

Enjoy! — Dalwa's Kitchen demo
