# Authentication Backend API

NestJS backend with authentication endpoints (signup, signin, signout) using Clean Architecture.

## Tech Stack
- **Language:** TypeScript
- **Framework:** NestJS
- **ORM:** Prisma
- **Database:** PostgreSQL (Docker)
- **Testing:** Vitest + Supertest
- **Authentication:** JWT (access + refresh tokens)

## Project Structure
```
backend/
├── src/
│   ├── auth/
│   │   ├── controllers/       # HTTP layer
│   │   ├── usecases/          # Business logic
│   │   ├── dto/               # Data transfer objects
│   │   ├── entities/          # Domain entities
│   │   ├── guards/            # JWT guards
│   │   └── strategies/        # Passport strategies
│   ├── prisma/                # Prisma module
│   ├── app.module.ts
│   └── main.ts
├── test/
│   ├── setup.ts               # E2E test utilities
│   └── auth.e2e-spec.ts       # E2E tests
├── prisma/
│   └── schema.prisma          # Database schema
├── docker-compose.yml
└── Dockerfile
```

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables
```bash
cp .env_ .env
```

Edit `.env` if needed (database credentials, JWT secrets).

### 3. Start PostgreSQL
```bash
docker-compose up postgres -d
```

### 4. Run Database Migrations
```bash
npm run prisma:migrate
```

### 5. Start Development Server
```bash
npm run start:dev
```

Server runs on `http://localhost:3000`

## API Endpoints

### POST /auth/signup
Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "message": "User created successfully"
}
```

### POST /auth/signin
Sign in with credentials.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /auth/signout
Sign out (requires authentication).

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "message": "Signed out successfully"
}
```

## Testing

### Run Unit Tests
```bash
npm run test
```

**Coverage:** 18 tests (UseCases + Controllers)

### Run Unit Tests in Watch Mode
```bash
npm run test:watch
```

### Run E2E Tests
```bash
# Setup test database first
cp .env.test_ .env.test

# Create test database
docker exec -it auth-postgres psql -U postgres -c "CREATE DATABASE authdb_test;"

# Run tests
npm run test:e2e
```

**Coverage:** 20 tests (Full HTTP request/response)

### Run E2E Tests in Watch Mode
```bash
npm run test:e2e:watch
```

### Run Tests with Coverage
```bash
npm run test:cov
```

### Open Test UI
```bash
npm run test:ui
```

## Database

### Open Prisma Studio
```bash
npm run prisma:studio
```

Browse database at `http://localhost:5555`

### Generate Prisma Client
```bash
npm run prisma:generate
```

### Create New Migration
```bash
npm run prisma:migrate
```

## Docker

### Run Full Stack with Docker
```bash
docker-compose up --build
```

This starts:
- PostgreSQL on port 5432
- Backend API on port 3000

### Stop Docker Containers
```bash
docker-compose down
```

### Remove Volumes
```bash
docker-compose down -v
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run start:dev` | Start development server (watch mode) |
| `npm run start:prod` | Start production server |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Run unit tests in watch mode |
| `npm run test:cov` | Run tests with coverage |
| `npm run test:ui` | Open test UI |
| `npm run test:e2e` | Run E2E tests |
| `npm run test:e2e:watch` | Run E2E tests in watch mode |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio |

## Coding Standards

### One Dot Per Line
```typescript
const user = await this
  .prismaService
  .user
  .findUnique({
    where: { email: signupDto.email },
  })
```

### CamelCase Naming
```typescript
const hashedPassword = await bcrypt.hash(password, 10)
const accessToken = this.jwtService.sign(payload)
```

### Clean Architecture
- **Controllers:** Handle HTTP requests/responses
- **UseCases:** Contain business logic
- **Prisma:** Data access layer

## Task Files

- **task-001-Authentication_Endpoints** - API implementation
- **task-002-Unit_Tests_Authentication_Endpoints** - Unit tests
- **task-003-E2E_Tests_Authentication_Endpoints** - E2E tests

## License
ISC
