import { PrismaClient } from '@prisma/client';
import { processAndSaveImage } from '~/server/utils/image';

interface Category {
  id: number;
  name: string;
  picture: string;
  parentId: number | null;
  products: any[];
  children: any[];
}

// Create a single PrismaClient instance
let prisma: PrismaClient;

async function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: ['query', 'error', 'warn']
    });
    try {
      await prisma.$connect();
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  }
  return prisma;
}

// Helper function to get recursive children count
async function getRecursiveChildrenCount(categoryId: number): Promise<number> {
  const client = await getPrismaClient();
  const children = await client.category.findMany({
    where: { parentId: categoryId },
    include: { products: true }
  });

  let count = 0;
  for (const child of children) {
    count += child.products.length;
    count += await getRecursiveChildrenCount(child.id);
  }
  return count;
}

export default defineEventHandler(async (event) => {
  const method = event.method;
  const client = await getPrismaClient();

  // POST - Create new category
  if (method === 'POST') {
    try {
      const formData = await readFormData(event);
      const name = formData.get('name') as string;
      const parentId = formData.get('parentId') ? parseInt(formData.get('parentId') as string) : null;
      const picture = formData.get('picture') as File;

      console.log('Creating category with:', { name, parentId, picture: picture?.name });

      if (!name || !picture) {
        throw createError({
          statusCode: 400,
          message: 'Name and picture are required'
        });
      }

      // Process and save image
      const picturePath = await processAndSaveImage(
        picture,
        `category-${Date.now()}-${picture.name}`
      );

      console.log('Picture saved at:', picturePath);

      // Create category in database
      const category = await client.category.create({
        data: {
          name,
          picture: picturePath,
          parentId
        }
      });

      console.log('Category created:', category);
      return category;
    } catch (error) {
      console.error('Error creating category:', error);
      throw createError({
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Failed to create category'
      });
    }
  }

  // GET - List all categories
  if (method === 'GET') {
    try {
      const categories = await client.category.findMany({
        include: {
          parent: true,
          products: true,
          children: true
        }
      });

      const categoriesWithCounts = await Promise.all(
        categories.map(async (category: Category) => {
          const directProductCount = category.products.length;
          const childrenProductCount = await getRecursiveChildrenCount(category.id);
          return {
            ...category,
            productCount: directProductCount + childrenProductCount,
            children: undefined,
            products: undefined
          };
        })
      );

      return categoriesWithCounts;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw createError({
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Failed to fetch categories'
      });
    }
  }

  throw createError({
    statusCode: 405,
    message: 'Method not allowed'
  });
}); 