import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../lib/db';
import { requireAuth } from '../../lib/auth';
import { Category } from '../../models/Category';
import { Tool } from '../../models/Tool';

// Helper to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// GET - Get single category
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    // The `id` param is typically a slug (e.g. "image-generation"). Only
    // include the _id branch when the value actually looks like a Mongo
    // ObjectId, otherwise mongoose throws CastError trying to cast it.
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const orQuery: Record<string, unknown>[] = [{ slug: id }, { name: id }];
    if (isObjectId) orQuery.unshift({ _id: id });
    const category = await Category.findOne({ $or: orQuery });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Get tool count
    const toolCount = await Tool.countDocuments({
      category: category.name,
      status: 'published'
    });

    return NextResponse.json({
      success: true,
      data: {
        ...category.toObject(),
        toolCount
      }
    });
  } catch (error: unknown) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

// PUT - Update category
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    await requireAuth();
    const { id } = await params;

    const body = await req.json();
    const { name, description, icon, color, isActive } = body;

    const category = await Category.findOne({
      $or: [
        { _id: id },
        { slug: id }
      ]
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Prevent modifying default categories' name
    if (category.isDefault && name && name !== category.name) {
      return NextResponse.json(
        { success: false, error: 'Cannot rename default categories' },
        { status: 400 }
      );
    }

    const updateData: {
      name?: string;
      slug?: string;
      description?: string;
      icon?: string;
      color?: string;
      isActive?: boolean;
    } = {};

    if (name && name !== category.name) {
      updateData.name = name.trim();
      updateData.slug = generateSlug(name);
    }
    if (description !== undefined) updateData.description = description?.trim();
    if (icon !== undefined) updateData.icon = icon;
    if (color !== undefined) updateData.color = color;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedCategory = await Category.findByIdAndUpdate(
      category._id,
      updateData,
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      data: updatedCategory
    });
  } catch (error: unknown) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE - Delete category
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    await requireAuth();
    const { id } = await params;

    const category = await Category.findOne({
      $or: [
        { _id: id },
        { slug: id }
      ]
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Prevent deleting default categories
    if (category.isDefault) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete default categories' },
        { status: 400 }
      );
    }

    // Check if category is in use
    const toolCount = await Tool.countDocuments({ category: category.name });
    if (toolCount > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete category: ${toolCount} tool(s) are using it` },
        { status: 400 }
      );
    }

    await Category.findByIdAndDelete(category._id);

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error: unknown) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}

