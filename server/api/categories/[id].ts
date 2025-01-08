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
      message: 'Invalid category ID'
    });
  }
  
  const method = event.method;
  const client = await getPrismaClient();

  // GET - Get single category
  if (method === 'GET') {
    const category = await client.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        products: true
      }
    });

    if (!category) {
      throw createError({
        statusCode: 404,
        message: 'Category not found'
      });
    }

    return category;
  }

  // PUT - Update category
  if (method === 'PUT') {
    const formData = await readFormData(event);
    const name = formData.get('name') as string;
    const parentId = formData.get('parentId') ? parseInt(formData.get('parentId') as string) : null;
    const picture = formData.get('picture') as File;

    const category = await client.category.findUnique({
      where: { id }
    });

    if (!category) {
      throw createError({
        statusCode: 404,
        message: 'Category not found'
      });
    }

    // Process new picture if provided
    let picturePath = category.picture;
    if (picture) {
      // Delete old picture
      try {
        await unlink(join(process.cwd(), 'public', category.picture));
      } catch (error) {
        console.error('Error deleting old picture:', error);
      }

      picturePath = await processAndSaveImage(
        picture,
        `category-${Date.now()}-${picture.name}`
      );
    }

    const updatedCategory = await client.category.update({
      where: { id },
      data: {
        name: name || category.name,
        picture: picturePath,
        parentId: parentId !== undefined ? parentId : category.parentId
      }
    });

    return updatedCategory;
  }

  // DELETE - Delete category
  if (method === 'DELETE') {
    try {
      console.log('Attempting to delete category:', id);
      
      const category = await client.category.findUnique({
        where: { id },
        include: {
          children: true,
          products: true
        }
      });

      if (!category) {
        throw createError({
          statusCode: 404,
          message: 'Category not found'
        });
      }

      // Check if category has children or products
      if (category.children.length > 0 || category.products.length > 0) {
        throw createError({
          statusCode: 400,
          message: 'Cannot delete category with children or products'
        });
      }

      // Delete the picture file
      try {
        const picturePath = join(process.cwd(), 'public', category.picture);
        console.log('Deleting picture at:', picturePath);
        await unlink(picturePath);
      } catch (error) {
        console.error('Error deleting picture:', error);
        // Continue with category deletion even if picture deletion fails
      }

      // Delete the category
      await client.category.delete({
        where: { id }
      });

      console.log('Category deleted successfully');
      return { message: 'Category deleted successfully' };
    } catch (error) {
      console.error('Error deleting category:', error);
      const customError = error as CustomError;
      throw createError({
        statusCode: customError.statusCode || 500,
        message: customError.message || 'Failed to delete category'
      });
    }
  }

  throw createError({
    statusCode: 405,
    message: 'Method not allowed'
  });
}); 