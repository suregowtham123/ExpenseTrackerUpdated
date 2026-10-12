# Personal Expense Tracker

Full-stack app: **React + JavaScript (JSX, Vite, MUI)** frontend and an **ASP.NET Core 8 Web API** backend that stores
everything in a **JSON file**. No SQL Server or any database is needed.
There is **no authentication** - the app opens directly on the Dashboard (single-user / local-use application).

## Prerequisites

| Tool | Version | Check with |
|------|---------|-----------|
| .NET SDK | 8.x | `dotnet --version` |
| Node.js | 18+ (20 recommended) | `node -v` |

## Run it (two terminals)

### 1. Backend  ->  http://localhost:5080/swagger
```bash
cd backend/ExpenseTracker.Api
dotnet restore
dotnet run
```
On first start the data file `App_Data/expense-data.json` is created automatically with the default categories
and some demo transactions and budgets.

### 2. Frontend  ->  http://localhost:5173
```bash
cd frontend
npm install
npm run dev
```

## Where is my data?

`backend/ExpenseTracker.Api/App_Data/expense-data.json` - a readable JSON file with `categories`, `transactions`
and `budgets`. Every change made in the app is saved to it immediately.

- **Back up:** copy the file.
- **Start fresh (demo data again):** stop the backend, delete the file, run the backend again.
- **Start empty (no demo data):** replace the file contents with
  `{ "Categories": [], "Transactions": [], "Budgets": [] }` plus your own categories, or delete the demo rows.
- **Move the file:** change `Storage:DataFilePath` in `appsettings.json` (relative paths are relative to the API folder).
- If the file is edited by hand and becomes invalid JSON, the backend refuses to start and tells you which file to fix
  (it never overwrites it).
- Only run **one** backend instance against a data file.

## Tests

```bash
# Backend (xUnit)
cd backend
dotnet test

# Frontend (Vitest + React Testing Library)
cd frontend
npm run test:run
```

## Project structure

```
ExpenseTracker/
├── backend/
│   ├── ExpenseTracker.sln
│   ├── ExpenseTracker.Api/
│   │   ├── Program.cs                  App startup: DI, CORS, Swagger, middleware, data file location
│   │   ├── appsettings.json            Data file path, CORS origins
│   │   ├── Models/                     Category, Transaction, Budget + TransactionType enum
│   │   ├── Data/JsonDataStore.cs       Thread-safe JSON file storage (atomic save, rollback on error)
│   │   ├── Data/DataFile.cs            The shape of the JSON file
│   │   ├── Data/SeedData.cs            Default categories + demo data for a new file
│   │   ├── Dtos/                       Request/response models with validation attributes
│   │   ├── Services/                   Business logic (Category, Transaction, Budget, Report)
│   │   ├── Controllers/                REST endpoints
│   │   ├── Middleware/                 Global error handler -> consistent ProblemDetails JSON
│   │   └── Exceptions/                 NotFound (404), Conflict (409), Validation (400)
│   └── ExpenseTracker.Tests/           xUnit tests (storage + all services)
└── frontend/
    ├── package.json, vite.config.js, index.html, .env
    └── src/
        ├── main.jsx / App.jsx          Entry point, theme, React Router routes
        ├── theme.js                    MUI light/dark theme + chart colours
        ├── api/                        Axios client + one module per API area
        ├── context/SettingsContext.jsx Currency / dark mode / rows-per-page (Context API + localStorage)
        ├── hooks/                      useAsync (data loading), useDebounce
        ├── components/                 Layout, TransactionForm (React Hook Form + Zod), dialogs, cards
        ├── pages/                      Dashboard, Transactions, Add, Details/Edit, Budgets, Reports, Settings, NotFound
        ├── utils/                      Currency/date helpers, budget colours
        └── test/setup.js               Vitest setup
```

## Routes (frontend)

| Route | Page |
|-------|------|
| `/` | Dashboard |
| `/transactions` | Transaction list (search, filter, sort, pagination) |
| `/transactions/new` | Add transaction |
| `/transactions/:id` | Details, edit, delete |
| `/budgets` | Budget management |
| `/reports` | Monthly / yearly reports and category breakdown |
| `/settings` | Preferences + category management |
| `*` | Not found |

## REST API

| Method | Endpoint |
|--------|----------|
| GET, POST | `/api/transactions` (GET supports `search, categoryId, type, dateFrom, dateTo, minAmount, maxAmount, sortBy, sortDir, page, pageSize`) |
| GET, PUT, DELETE | `/api/transactions/{id}` |
| GET, POST | `/api/categories` |
| PUT, DELETE | `/api/categories/{id}` |
| GET, POST | `/api/budgets` (GET supports `month, year`) |
| PUT, DELETE | `/api/budgets/{id}` |
| GET | `/api/dashboard/summary?month=&year=` |
| GET | `/api/reports/monthly?from=&to=` (or `?year=`) |
| GET | `/api/reports/category-breakdown?from=&to=&type=Expense` |

Status codes: `200/201/204` success, `400` validation, `404` not found, `409` conflict (duplicate or in-use category/budget), `500` unexpected error.
Errors are always RFC 7807 `ProblemDetails` JSON.

## Security notes
- No authentication or user accounts by design; do **not** expose this app on the public internet as-is, because anyone who can reach it can read and change the data.
- Input is validated in the browser (Zod) and on the server (DataAnnotations + service rules).
- The data file is plain text and unencrypted; keep it on a machine you trust and out of source control (it is git-ignored).
- CORS only allows the origins listed in `Cors:AllowedOrigins`.
- Production: HTTPS redirection + HSTS are enabled when `ASPNETCORE_ENVIRONMENT` is not `Development`.

## Deployment
**Backend**
```bash
cd backend/ExpenseTracker.Api
dotnet publish -c Release -o ../publish
```
On the host set `ASPNETCORE_ENVIRONMENT=Production`, `Cors__AllowedOrigins__0=https://your-frontend-domain` and
`Storage__DataFilePath=/path/to/expense-data.json` (a folder the app can write to, and that you back up).

**Frontend**
```bash
cd frontend
echo VITE_API_URL=https://your-api-domain/api > .env.production
npm run build
```
Upload `frontend/dist` to any static host. For client-side routing, serve `index.html` for unknown paths.

## Troubleshooting
| Problem | Fix |
|---------|-----|
| `Cannot reach the server` banner in the UI | Backend is not running, or not on port 5080. Check `VITE_API_URL` in `frontend/.env`. |
| `You must install or update .NET` | Install the .NET 8 SDK from https://dotnet.microsoft.com/download/dotnet/8.0 |
| `The data file ... is not valid JSON` | Fix the JSON in `App_Data/expense-data.json`, or delete the file to start fresh. |
| CORS error in browser console | Frontend must run on `http://localhost:5173`, or add its origin to `Cors:AllowedOrigins`. |
| PowerShell blocks `npm` scripts | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, then reopen the terminal. |
