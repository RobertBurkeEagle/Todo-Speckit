# Behavior & Rules Reference

**Living snapshot** of product rules currently in force on `dev` (not API shapes or columns — see [api.md](./api.md) and [data-model.md](./data-model.md)).

These files answer: *"What rules does the app enforce right now?"*  
They do **not** authorize new scope — implement only from `features/feature-*.md` (**FR-00N** + Gherkin). Deep scenarios stay in the introducing feature; this file is an **index**.

**Related:** [ADR-0002 — Security architecture](../../docs/adr/0002-security-architecture.md)

---

## Maintenance

| When | Action |
|------|--------|
| Feature changes a product rule (sort, ownership, validation, UI rule) | Update this file in the **same PR** |
| Feature only changes routes/payloads/schema | Update [api.md](./api.md) / [data-model.md](./data-model.md); touch this file only if rules changed |
| Drift suspected | Compare this file → code + mapped tests; fix reference or code |

---

## Auth & sessions

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Login is **username + password** (not email-only) | Auth API + Login UI | Feature 1 |
| Passwords hashed with bcrypt (`SALT_ROUNDS = 10`); hash never returned | Register/login APIs; user `defaultScope` | Feature 1 |
| Session = JWT stored server-side; client sends `Authorization: Bearer <token>` | `authenticate` middleware + `sessions` table | Feature 1 |
| Session lifetime **24 hours** from creation | Session create on register/login | Feature 1 |
| Login reuses a non-expired session for the same user when one exists | Login controller | Feature 1 |
| Logout invalidates the server session and clears client `user` storage | Logout API + `authServices.logoutUser` | Feature 1 |
| Unauthenticated protected API → `401` | `authenticate` | Feature 1 |
| Unauthenticated protected UI → redirect to login | Router `beforeEach` | Feature 1 |
| Signed-in users visiting login/register are redirected home | Router `beforeEach` | Feature 1 |
| Default role for new users is `worker` | Register | Feature 1 |
| Registration email uses shared `emailRules` (required + format) | Register UI | Feature 1 |

## Ownership & isolation

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Every authenticated request resolves to `req.user.id` from the session | `authenticate` | Feature 1 |
| Lists are private to the owner; reads/writes always scoped by `userId` | List API + `getAccessibleListOrNull` | Feature 2 |
| Cross-user list access returns `404` (never `403`) | List update/delete | Feature 2 |
| List names are trimmed; empty names rejected; max 100 characters | List create/update | Feature 2 |
| Lists are ordered alphabetically by name | `GET /todo/lists` | Feature 2 |
| Dashboard is a single lists view with dialog create/rename/delete | `Dashboard.vue` | Feature 2 |
| `MenuBar` shows the signed-in name and Sign out; hidden on login/register | `App.vue` + `MenuBar.vue` | Feature 2 |
| Todos belong to one list and one user; parent list must be owned to create/list | Todo API + `getAccessibleTodoOrNull` | Feature 3 |
| New todos default `completed: false`; ordered incomplete first then `createdAt` | Todo create + `GET .../todos` | Feature 3 |
| Deleting a list removes its todos | Sequelize `onDelete: CASCADE` | Feature 3 |
| Items are managed in nested dialogs from the list row Items icon | `Dashboard.vue` | Feature 3 |
| Profile is self-only (`:id` must match `req.user.id`); `404` for other users | User API + `getAccessibleUserOrNull` | Feature 4 |
| Optional password on profile update is bcrypt-hashed when provided | `PUT /todo/users/:id` | Feature 4 |
| Logout lives in the profile dropdown; menu bar has no Sign out button | `MenuBar.vue` | Feature 4 |
| After profile save, `localStorage` `user` is refreshed and `user-logged-in` dispatched | `MenuBar.vue` | Feature 4 |
| No Feature 1 API returns another user's profile or session | Auth controllers | Feature 1 |

## Errors (product convention)

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Error body shape `{ "message": "Human-readable explanation." }` | Controllers | Feature 1 |
| Duplicate username → `"Username is already taken."`; duplicate email → `"Email is already registered."` | Register | Feature 1 |
| Invalid login (wrong username or password) → `"Invalid username or password."` | Login | Feature 1 |

---

## How to use

| Question | Look here |
|----------|-----------|
| What rule is in force now? | This file |
| Why was this rule chosen? | Feature FR / Gherkin, or ADR |
| Exact scenario / test name | Introducing `feature-N-*.md` Test Coverage Map |
| Routes and payloads | [api.md](./api.md) |
| Tables and columns | [data-model.md](./data-model.md) |
