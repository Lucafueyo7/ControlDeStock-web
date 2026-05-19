'use server';
import { prisma } from '../lib/db';
import { auth } from '@clerk/nextjs/server';
import type { Product } from '../lib/data';

type DbProduct = {
  id: number;
  codigo: string;
  nombre: string;
  precio: number;
  cantidad: number;
  activo: boolean | null;
};

function mapProduct(p: DbProduct): Product {
  return { id: p.id, codigo: p.codigo, nombre: p.nombre, precio: p.precio, cantidad: p.cantidad, activity: p.activo ?? true };
}

export async function getProducts(): Promise<Product[]> {
  const { userId } = await auth();
  if (!userId) throw new Error('No autorizado');
  const rows = await prisma.products.findMany({ orderBy: { id: 'asc' } });
  return rows.map(mapProduct);
}

export async function createProduct(data: { codigo: string; nombre: string; precio: number; cantidad: number }): Promise<Product> {
  const { userId } = await auth();
  if (!userId) throw new Error('No autorizado');
  const row = await prisma.products.create({ data: { ...data, activo: true } });
  return mapProduct(row);
}

export async function updateProduct(id: number, data: Partial<Omit<Product, 'id'>>): Promise<Product> {
  const { userId } = await auth();
  if (!userId) throw new Error('No autorizado');
  const { activity, ...rest } = data;
  const row = await prisma.products.update({
    where: { id },
    data: { ...rest, ...(activity !== undefined ? { activo: activity } : {}) },
  });
  return mapProduct(row);
}

export async function deleteProduct(id: number): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error('No autorizado');
  const hasSales = await prisma.sale_items.count({ where: { product_id: id } });
  if (hasSales > 0) {
    await prisma.products.update({ where: { id }, data: { activo: false } });
  } else {
    await prisma.products.delete({ where: { id } });
  }
}
