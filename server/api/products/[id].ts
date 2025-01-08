import { PrismaClient } from '@prisma/client';
import { processAndSaveImage } from '~/server/utils/image';
import { unlink } from 'fs/promises';
import { join } from 'path';

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
  const id = parseInt(event.context.params?.id || '');
  if (isNaN(id)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid product ID'
    });
  }

  const method = event.method;
  const client = await getPrismaClient();

  // GET - Get single product
  if (method === 'GET') {
    try {
      const product = await client.product.findUnique({
        where: { id },
        include: {
          category: {
            include: {
              parent: true
            }
          }
        }
      });

      if (!product) {
        throw createError({
          statusCode: 404,
          message: 'Product not found'
        });
      }

      return product;
    } catch (error) {
      console.error('Error fetching product:', error);
      const customError = error as CustomError;
      throw createError({
        statusCode: customError.statusCode || 500,
        message: customError.message || 'Failed to fetch product'
      });
    }
  }

  // PUT - Update product
  if (method === 'PUT') {
    try {
      const formData = await readFormData(event);
      const name = formData.get('name') as string;
      const categoryId = parseInt(formData.get('categoryId') as string);
      const picture = formData.get('picture') as File;

      console.log('Updating product with:', { id, name, categoryId, picture: picture?.name });

      if (!name || isNaN(categoryId)) {
        throw createError({
          statusCode: 400,
          message: 'Name and category are required'
        });
      }

      // Verify product exists
      const existingProduct = await client.product.findUnique({
        where: { id }
      });

      if (!existingProduct) {
        throw createError({
          statusCode: 404,
          message: 'Product not found'
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

      let picturePath = existingProduct.picture;

      // Process and save new image if provided
      if (picture) {
        try {
          // Delete old picture
          const oldPicturePath = join(process.cwd(), 'public', existingProduct.picture);
          await unlink(oldPicturePath);
        } catch (error) {
          console.error('Error deleting old picture:', error);
          // Continue even if old picture deletion fails
        }

        // Save new picture
        picturePath = await processAndSaveImage(
          picture,
          `product-${Date.now()}-${picture.name}`
        );
        console.log('New picture saved at:', picturePath);
      }

      // Update product in database
      const updatedProduct = await client.product.update({
        where: { id },
        data: {
          name,
          picture: picturePath,
          categoryId
        },
        include: {
          category: {
            include: {
              parent: true
            }
          }
        }
      });

      console.log('Product updated:', updatedProduct);
      return updatedProduct;
    } catch (error) {
      console.error('Error updating product:', error);
      const customError = error as CustomError;
      throw createError({
        statusCode: customError.statusCode || 500,
        message: customError.message || 'Failed to update product'
      });
    }
  }

  // DELETE - Delete product
  if (method === 'DELETE') {
    try {
      const product = await client.product.findUnique({
        where: { id }
      });

      if (!product) {
        throw createError({
          statusCode: 404,
          message: 'Product not found'
        });
      }

      // Delete the picture file
      try {
        const picturePath = join(process.cwd(), 'public', product.picture);
        console.log('Deleting picture at:', picturePath);
        await unlink(picturePath);
      } catch (error) {
        console.error('Error deleting picture:', error);
        // Continue with product deletion even if picture deletion fails
      }

      // Delete the product
      await client.product.delete({
        where: { id }
      });

      console.log('Product deleted successfully');
      return { message: 'Product deleted successfully' };
    } catch (error) {
      console.error('Error deleting product:', error);
      const customError = error as CustomError;
      throw createError({
        statusCode: customError.statusCode || 500,
        message: customError.message || 'Failed to delete product'
      });
    }
  }

  throw createError({
    statusCode: 405,
    message: 'Method not allowed'
  });
}); 