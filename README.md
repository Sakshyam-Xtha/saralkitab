# Sales Record (Saral Kitab)

A personal inventory & sales tracking app for a small shop, built as an Android app
(Capacitor + React) backed by a Django REST API.

Record sales, returns and restocks on the go, keep an eye on stock and profit, and keep
working even when the hosted backend is slow to wake up or briefly unreachable.

## Features

- **Products** — add, edit, delete products; cost & selling price, profit per unit, stock
  value, supplier contact, categories; search and category filters; batch select/delete;
  a full detail page (stock badge, cost/sell/profit, supplier, added/updated dates).
- **Transactions** — record **sales**, **returns** and **restocks**; payment method
  (Cash, eSewa, Khalti, Card, Bank Transfer); initial stock is recorded as a restock
  transaction; edit previous transactions (stock is rolled back and re-applied by the
  backend).
- **Analytics** — revenue, gross profit, margin, units sold, stock spend, net stock change;
  daily revenue and restock charts; sales & restocks by payment; top products; revenue by
  category; inventory value at cost/retail; low-stock list.
- **Account** — shop name, currency, theme (light/dark/system), font size (small → extra large), export products &
  transactions as JSON, logout.
- **UX** — toast notifications, pull-to-refresh with a stretch animation, safe-area-aware
  mobile layout.
- **Offline-friendly reading** — stale-while-revalidate caching shows the last known data
  instantly while the backend refreshes in the background (see [Caching](#caching)).
- **Offline writes** — if a save/restock/edit/delete can't reach the server it is queued on
  the device, reflected in the UI immediately, and shown in a **Pending** section (a list of
  the queued changes with what and when). Changes are synced **automatically** — on app
  start, on the `online` event, on app resume, after any successful write, and a background
  retry every 30 s while anything is pending. Products and transactions created offline get
  real server ids on sync, and later edits/deletes that reference them are re-pointed
  automatically.

## Architecture

| Layer    | Tech                                                    |
| -------- | ------------------------------------------------------- |
| App      | React 19, Vite 8, Capacitor 6 (Android)                 |
| Backend  | Django 5.2, Django REST Framework 3.17, Token auth      |

The app is a single-page React app with four tabs (Products, Transactions, Analytics,
Account) rendered by `App.jsx` and wrapped by a global `ToastProvider` and a
`PullToRefresh` gesture container.

```
frontend/src/
  api.js                    # API client (fetch) + request timeout + queue-aware writes
  cache.js                  # localStorage cache service (SWR data store)
  queue.js                  # offline write queue + automatic sync + id remapping
  useCachedData.js          # hook: cached data + background revalidation
  settings.js               # shop settings (currency, theme, shop name)
  App.jsx                   # tab shell, auth gate, theme, logout
  components/
    Auth.jsx                # sign in / create account
    Products.jsx            # product CRUD, detail view, batch select
    Transactions.jsx        # record & edit sales/returns/restocks
    Analytics.jsx           # KPIs and charts
    Profile.jsx             # personalization + tools
    PendingSection.jsx       # "waiting to sync" section listing queued changes
    ui.jsx                  # shared UI primitives + CacheStatus pill
    Toast.jsx               # toast provider
    PullToRefresh.jsx       # gesture wrapper for pull-to-refresh
    Sheet.jsx, Select.jsx   # bottom sheets, pickers
```

## Caching

The app hides slow Render cold starts and brief outages with a stale-while-revalidate
cache:

- `cache.js` stores `{ data, cachedAt }` entries under the `sra_cache_` prefix in
  `localStorage`. Entries are considered **fresh** for 5 minutes
  (`CACHE.freshMs`).
- `useCachedData(fetcher, key)` seeds instantly from the cache, then revalidates in the
  background. A small `CacheStatus` pill appears only when relevant:
  - `Updating…` — fresh data shown while the background request runs
  - `Offline — showing saved data` — network unreachable, showing cached data
  - `Session expired — showing saved data` — 401/403, showing cached data
  - `Last updated …` — data is older than the freshness window
- **Invalidation** — successful mutations invalidate the affected lists centrally in
  `api.js`, so stale server data never overwrites fresh data:
  - product add / update / delete, restock → `products:list`
  - sale / return / restock / transaction update → `transactions:list` + `products:list`
- Requests have a 60 s timeout; timeouts/network failures keep the cached data visible
  instead of showing a blank error.
- Cache is cleared on logout. No tokens or passwords are ever stored in the cache.

## Offline writes & sync queue

When the network is unreachable, mutations are **queued** instead of failing:

- `queue.js` persists pending ops in `localStorage` (`sra_queue`) in FIFO order, tagged with
  the account that created them.
- On failure (`status 0`) `api.js` enqueues the op and applies an **optimistic update** to the
  local cache so products, stock and transactions reflect the change immediately. A
  **Pending** section lists the queued changes ("Add product: …", "Sale 2 × …") with a
  "waiting to sync" header.
- Sync is **automatic** and needs no user action: on app start, on the `online` event, when
  the app is resumed (visibility change), after any successful write, and via a background
  retry every 30 s while anything is pending. The section's *Sync now* button is only a
  manual fallback.
- The queue flushes in order; server-rejected ops (400/404, e.g. "not enough stock") are
  dropped and reported via toast so the rest of the queue isn't blocked. Offline, auth
  (401/403) and 5xx responses pause the flush and retry on the next trigger.
- **Id remapping** — products and transactions created offline use a negative temp id. On
  sync the backend returns the real id (product & transaction create endpoints now include
  `id` in the response), the queue rewrites later queued edits/deletes/sales that referenced
  the temp id to the real id, and the caches are invalidated so the app refetches fresh data.
- Queued work never syncs into a different account: entries are tagged with the username
  that created them and dropped if the signed-in account changes.

## Getting started

### Backend

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

On Render the app uses `entrypoint.sh` (migrate + `runserver`). The production API base URL
is hardcoded in `frontend/src/api.js` (`API_URL`); change it for local development.

### Frontend

```bash
cd frontend
npm install
npm run dev        # Vite dev server
npm run lint       # oxlint
npm run build      # production build -> dist/
```

## Building the Android APK

```bash
cd frontend
npm run build
npx cap sync android
cd android
./gradlew assembleDebug --no-daemon
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

The signed debug APK is also copied to `SalesRecord.apk` in the repo root.

## Testing on a connected device

The app is a Capacitor WebView, so it can be inspected over Chrome DevTools Protocol:

```bash
# forward the WebView's CDP endpoint
adb forward tcp:9222 localabstract:webview_devtools_remote_$(adb shell pidof com.salesrecord.app)
curl http://127.0.0.1:9222/json   # find the page target
```

Connect a WebSocket to the page's `webSocketDebuggerUrl` to evaluate JS, capture
screenshots, or simulate slow/offline networks while validating cache behaviour.

## API summary

Auth: `Authorization: Token <token>`. All endpoints are `IsAuthenticated`.

| Method | Endpoint                             | Purpose                    |
| ------ | ------------------------------------ | -------------------------- |
| GET    | `/products/`                         | list products              |
| POST   | `/products/add/`                     | create product             |
| GET    | `/products/<id>/`                    | product detail             |
| PATCH  | `/products/update/<id>/`             | update product             |
| DELETE | `/products/delete/<id>/`             | delete product             |
| POST   | `/products/restock/<id>/`            | restock (creates txn)      |
| GET    | `/products/search/<name>/`           | search products            |
| POST   | `/products/filter/`                  | filter products            |
| GET    | `/products/transactions/`            | list transactions          |
| GET    | `/products/transactions/<id>/`       | transaction detail         |
| POST   | `/products/transactions/add/`        | create sale/return         |
| PATCH  | `/products/transactions/update/<id>/`| update transaction         |
| POST   | `/user/register/`                    | create account             |
| POST   | `/user/login/`                       | obtain token               |
