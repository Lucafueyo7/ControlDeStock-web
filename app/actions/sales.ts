'use server';
import { prisma } from '../lib/db';
import { auth } from '@clerk/nextjs/server';
import type { Sale, DaySales } from '../lib/data';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSale(s: any): Sale {
  return {
    id: s.id,
    fecha: s.fecha ? new Date(s.fecha).toISOString() : new Date().toISOString(),
    total: s.total,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: (s.sale_items ?? []).map((i: any) => ({
      id: i.id,
      product_id: i.product_id,
      cantidad: i.cantidad,
      precio_unitario: i.precio_unitario,
      subtotal: i.subtotal,
    })),
  };
}

export async function getSales(): Promise<Sale[]> {
  const { userId } = await auth();
  if (!userId) throw new Error('No autorizado');
  const rows = await prisma.sales.findMany({
    include: { sale_items: true },
    orderBy: { fecha: 'desc' },
  });
  return rows.map(mapSale);
}

export async function createSale(
  items: { product_id: number; cantidad: number; precio_unitario: number }[],
  total: number,
): Promise<Sale> {
  const { userId } = await auth();
  if (!userId) throw new Error('No autorizado');

  const sale = await prisma.$transaction(async (tx) => {
    const s = await tx.sales.create({
      data: {
        total,
        sale_items: {
          create: items.map((i) => ({
            product_id: i.product_id,
            cantidad: i.cantidad,
            precio_unitario: i.precio_unitario,
            subtotal: i.cantidad * i.precio_unitario,
          })),
        },
      },
      include: { sale_items: true },
    });
    for (const i of items) {
      await tx.products.update({
        where: { id: i.product_id },
        data: { cantidad: { decrement: i.cantidad } },
      });
    }
    return s;
  });

  return mapSale(sale);
}

export async function getDashboardStats(): Promise<{ dailySales: DaySales[] }> {
  const { userId } = await auth();
  if (!userId) throw new Error('No autorizado');

  const since = new Date();
  since.setDate(since.getDate() - 13);

  const rows = await prisma.$queryRaw<{ d: string; t: number }[]>`
    SELECT DATE(fecha)::text AS d, SUM(total)::float AS t
    FROM sales
    WHERE fecha >= ${since}
    GROUP BY DATE(fecha)
    ORDER BY d ASC
  `;

  return { dailySales: rows };
}
