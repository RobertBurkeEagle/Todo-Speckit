# API Reference

**Base path:** `/todo/`  
**Status:** Integrated API through **Feature 5** (auth, lists, todos, profile, due dates).  
**Authority for new work:** feature specs in `features/` — update this file in the same PR when routes or payloads change.

**Auth:** Send `Authorization: Bearer <token>` on protected routes.  
**Errors:** `{ "message": "Human-readable explanation." }` unless noted.

## Feature provenance

| Area | Feature |
|------|---------|
| Register, login, logout | 1 |
| List CRUD | 2 |
| Todo items | 3 |
| User profile | 4 |
| Todo due dates | 5 |

---

## Authentication (Feature 1)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/todo/register` | No | Create account |
| `POST` | `/todo/login` | No | Sign in; returns session payload |
| `POST` | `/todo/logout` | Yes | Invalidate session token |

**Register body:**
```json
{
  "fName": "Jane",
  "lName": "Doe",
  "email": "jdoe@example.com",
  "username": "jdoe",
  "password": "password123"
}
```

**Login body:**
```json
{
  "username": "jdoe",
  "password": "password123"
}
```

**Register / login success** (`201` register · `200` login):
```json
{
  "userId": 1,
  "username": "jdoe",
  "email": "jdoe@example.com",
  "fName": "Jane",
  "lName": "Doe",
  "role": "worker",
  "token": "<jwt>"
}
```

**Logout success** (`200`):
```json
{
  "message": "Signed out successfully."
}
```

**Common auth errors:** missing fields `400`; password < 8 chars `400`; duplicate username/email `400`; invalid login `401` with `"Invalid username or password."`; missing/invalid token on protected routes `401`.

---

## Lists (Feature 2)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/todo/lists` | Yes | Lists owned by the caller, sorted by `name` ASC |
| `POST` | `/todo/lists` | Yes | Create a list; `userId` from session only |
| `PUT` | `/todo/lists/:listId` | Yes | Rename an owned list |
| `DELETE` | `/todo/lists/:listId` | Yes | Delete an owned list |

**Create / rename body:** `{ "name": "Groceries" }`  
**Success object:** `{ id, name, userId, createdAt, updatedAt }` (`201` create, `200` update/list).  
**Errors:** empty name `400` `"List name is required."`; name > 100 chars `400` `"List name must be 100 characters or fewer."`; invalid id `400`; missing/unowned list `404` `"List with id=<id> not found."` (never `403`).

---

## Todos (Feature 3)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/todo/lists/:listId/todos` | Yes | Todos in an owned list; incomplete first, then `createdAt` ASC |
| `POST` | `/todo/lists/:listId/todos` | Yes | Add a todo; `userId`/`listId` from session + owned list |
| `PUT` | `/todo/todos/:id` | Yes | Update title and/or `completed` |
| `DELETE` | `/todo/todos/:id` | Yes | Delete an owned todo |

**Create body:** `{ "title": "Buy milk" }`  
**Success object:** `{ id, listId, title, completed, dueDate, userId, createdAt, updatedAt }` (`201` create, `200` update). New todos default `completed: false`. `dueDate` is `YYYY-MM-DD` or `null`.  
**Errors:** empty title `400` `"Todo title is required."`; title > 255 chars `400`; invalid due date `400` `"Due date must be a valid date in YYYY-MM-DD format."`; missing/unowned list or todo `404`. Unauthenticated `401`. Deleting a list cascades todos. Omitting `dueDate` on PUT leaves the stored value; `dueDate: null` clears it.

---

## Profile (Feature 4)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/todo/users/:id` | Yes | Own profile only |
| `PUT` | `/todo/users/:id` | Yes | Update own name, email, username; optional password |

**Success object:** `{ id, fName, lName, email, username, role, createdAt, updatedAt }` — never a password hash.  
**Errors:** missing required fields `400`; password < 8 `400`; duplicate username/email `400`; other user `404` `"User with id=<id> not found."`; unauthenticated `401`.
