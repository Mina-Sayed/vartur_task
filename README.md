# Vartur Task - Categories and Products Management

A full-stack application built with Nuxt 3, Vuetify, Prisma, and MySQL for managing categories and products.

## Features

- Categories Management
  - Create, read, update, and delete categories
  - Support for nested categories (parent-child relationships)
  - Image upload and automatic resizing
  - Product count tracking for each category

- Products Management
  - Create, read, update, and delete products
  - Category assignment
  - Image upload and automatic resizing
  - Category path display

## Prerequisites

- Node.js (v18 or later)
- MySQL (v8.0 or later)
- pnpm (v8 or later)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd vartur-task
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create a MySQL database:
   ```sql
   CREATE DATABASE vartur_task;
   ```

4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your MySQL connection details:
   ```
   DATABASE_URL="mysql://root:root@localhost:3306/vartur_task"
   ```

5. Run database migrations:
   ```bash
   pnpm prisma migrate dev
   ```

## Development

Start the development server:
```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

## Build and Production

1. Build the application:
   ```bash
   pnpm build
   ```

2. Start the production server:
   ```bash
   pnpm start
   ```

## Docker Deployment

1. Build the Docker image:
   ```bash
   docker build -t vartur-task .
   ```

2. Run the containers:
   ```bash
   docker-compose up -d
   ```

The application will be available at `http://localhost:3000`.

## API Documentation

### Categories

- `GET /api/categories` - List all categories
- `POST /api/categories` - Create a new category
- `GET /api/categories/:id` - Get a single category
- `PUT /api/categories/:id` - Update a category
- `DELETE /api/categories/:id` - Delete a category

### Products

- `GET /api/products` - List all products
- `POST /api/products` - Create a new product
- `GET /api/products/:id` - Get a single product
- `PUT /api/products/:id` - Update a product
- `DELETE /api/products/:id` - Delete a product

## Project Structure

```
.
├── components/          # Vue components
├── layouts/            # Page layouts
├── pages/              # Application pages
├── prisma/            # Database schema and migrations
├── public/            # Static files
├── server/            # API routes and utilities
└── types/             # TypeScript type definitions
```

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm prisma migrate dev` - Run database migrations
- `pnpm prisma generate` - Generate Prisma client
- `pnpm prisma studio` - Open Prisma Studio

## Technologies Used

- [Nuxt 3](https://nuxt.com/) - Vue.js Framework
- [Vuetify](https://vuetifyjs.com/) - Material Design Component Framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [MySQL](https://www.mysql.com/) - Database
- [Sharp](https://sharp.pixelplumbing.com/) - Image Processing
