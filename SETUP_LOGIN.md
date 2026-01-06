Setup for Admin Login (Next.js App Router)

Steps to install dependencies and prepare database:

1. Install required packages:

```powershell
npm install mysql2 bcrypt
```

2. Environment variables (set in `.env` file or hosting env):

- `MYSQL_HOST` (default: `localhost`)
- `MYSQL_PORT` (default: `3306`)
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE` (default: `simkinerja`)

3. Create `users` table in MySQL:

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','pimpinan','pelaksana') NOT NULL DEFAULT 'pelaksana',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

4. To insert an admin user, generate a bcrypt hash (example using Node REPL):

```powershell
node -e "const bcrypt=require('bcrypt'); bcrypt.hash('yourPassword',10).then(h=>console.log(h));"
```

Then insert the hashed password into `users.password`.

5. Start dev server:

```powershell
npm run dev
```

Notes:

- The login route is at `/login` and posts to `/api/auth/login`.
- The `auth` cookie stores a small JSON payload `{ id, username, role }` and is `HttpOnly; SameSite=Lax`.
- Middleware protects `/admin/*` routes and redirects unauthorized users to `/login`.
