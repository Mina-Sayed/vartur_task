import { PrismaClient } from '@prisma/client';
import { processAndSaveImage } from '~/server/utils/image';

interface CustomError extends Error {
  statusCode?: number;
}

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

export default defineEventHandler(async (event) => {
  const method = event.method;
  const client = await getPrismaClient();

  // POST - Create new product
  if (method === 'POST') {
    try {
      const formData = await readFormData(event);
      const name = formData.get('name') as string;
      const categoryId = parseInt(formData.get('categoryId') as string);
      const picture = formData.get('picture') as File;

      console.log('Creating product with:', { name, categoryId, picture: picture?.name });

      if (!name || !picture || isNaN(categoryId)) {
        throw createError({
          statusCode: 400,
          message: 'Name, category, and picture are required'
        });
      }

      // Verify category exists
      const category = await client.category.findUnique({
        where: { id: categoryId }
      });

      if (!category) {
        throw createError({
          statusCode: 400,
          message: 'Selected category does not exist'
        });
      }

      // Process and save image
      const picturePath = await processAndSaveImage(
        picture,
        `product-${Date.now()}-${picture.name}`
      );

      console.log('Picture saved at:', picturePath);

      // Create product in database
      const product = await client.product.create({
        data: {
          name,
          picture: picturePath,
          categoryId
        },
        include: {
          category: true
        }
      });

      console.log('Product created:', product);
      return product;
    } catch (error) {
      console.error('Error creating product:', error);
      const customError = error as CustomError;
      throw createError({
        statusCode: customError.statusCode || 500,
        message: customError.message || 'Failed to create product'
      });
    }
  }

  // GET - List all products
  if (method === 'GET') {
    try {
      const products = await client.product.findMany({
        include: {
          category: {
            include: {
              parent: true
            }
          }
        }
      });

      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      const customError = error as CustomError;
      throw createError({
        statusCode: 500,
        message: customError.message || 'Failed to fetch products'
      });
    }
  }

  throw createError({
    statusCode: 405,
    message: 'Method not allowed'
  });
}); 