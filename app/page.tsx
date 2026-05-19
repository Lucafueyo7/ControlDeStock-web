import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getProducts } from './actions/products';
import { getSales, getDashboardStats } from './actions/sales';
import StockApp from './components/StockApp';

export default async function Home() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await currentUser();
  const [products, sales, { dailySales }] = await Promise.all([
    getProducts(),
    getSales(),
    getDashboardStats(),
  ]);

  const userName = user?.firstName ?? user?.username ?? 'Usuario';
  const userEmail = user?.emailAddresses[0]?.emailAddress ?? '';
  const userImageUrl = user?.imageUrl;

  return (
    <StockApp
      initialProducts={products}
      initialSales={sales}
      initialDailySales={dailySales}
      userName={userName}
      userEmail={userEmail}
      userImageUrl={userImageUrl}
    />
  );
}
