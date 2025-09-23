import { supabase } from '@/lib/supabaseClient';
import { formatPrice } from '@/utils/currency';

interface DailyStats {
  date: string;
  totalRevenue: number;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  newClients: number;
  totalClients: number;
  topServices: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
  staffPerformance: Array<{
    name: string;
    bookings: number;
    revenue: number;
  }>;
  productsSold: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  averageBookingValue: number;
  totalCommissions: number;
}

class DailyReportService {
  
  async generateDailyReport(date?: string): Promise<DailyStats> {
    const reportDate = date || new Date().toISOString().split('T')[0];
    const startOfDay = `${reportDate} 00:00:00`;
    const endOfDay = `${reportDate} 23:59:59`;

    try {
      // Get daily bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          *,
          clients(*),
          services(*),
          staff(*)
        `)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);

      // Get new clients for the day
      const { data: newClients } = await supabase
        .from('clients')
        .select('*')
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);

      // Get total clients count
      const { count: totalClientsCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      // Get sales for the day
      const { data: sales } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items(
            *,
            products(*)
          )
        `)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);

      // Get commissions for the day
      const { data: commissions } = await supabase
        .from('commissions')
        .select('*')
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);

      // Calculate statistics
      const stats = this.calculateStats(
        bookings || [],
        newClients || [],
        totalClientsCount || 0,
        sales || [],
        commissions || [],
        reportDate
      );

      return stats;

    } catch (error) {
      console.error('Error generating daily report:', error);
      throw error;
    }
  }

  private calculateStats(
    bookings: any[],
    newClients: any[],
    totalClientsCount: number,
    sales: any[],
    commissions: any[],
    date: string
  ): DailyStats {
    
    // Basic booking stats
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'completed').length;
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
    
    // Revenue from bookings
    const bookingRevenue = bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.services?.price || 0), 0);

    // Revenue from sales
    const salesRevenue = sales.reduce((sum, sale) => {
      const saleTotal = sale.sale_items?.reduce((itemSum: number, item: any) => 
        itemSum + (item.quantity * item.unit_price), 0) || 0;
      return sum + saleTotal;
    }, 0);

    const totalRevenue = bookingRevenue + salesRevenue;
    const averageBookingValue = completedBookings > 0 ? bookingRevenue / completedBookings : 0;

    // Top services
    const serviceStats = new Map();
    bookings.filter(b => b.status === 'completed').forEach(booking => {
      if (booking.services) {
        const serviceName = booking.services.name;
        const current = serviceStats.get(serviceName) || { count: 0, revenue: 0 };
        serviceStats.set(serviceName, {
          count: current.count + 1,
          revenue: current.revenue + booking.services.price
        });
      }
    });

    const topServices = Array.from(serviceStats.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Staff performance
    const staffStats = new Map();
    bookings.filter(b => b.status === 'completed').forEach(booking => {
      if (booking.staff) {
        const staffName = booking.staff.name;
        const current = staffStats.get(staffName) || { bookings: 0, revenue: 0 };
        staffStats.set(staffName, {
          bookings: current.bookings + 1,
          revenue: current.revenue + (booking.services?.price || 0)
        });
      }
    });

    const staffPerformance = Array.from(staffStats.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue);

    // Products sold
    const productStats = new Map();
    sales.forEach(sale => {
      sale.sale_items?.forEach((item: any) => {
        if (item.products) {
          const productName = item.products.name;
          const current = productStats.get(productName) || { quantity: 0, revenue: 0 };
          productStats.set(productName, {
            quantity: current.quantity + item.quantity,
            revenue: current.revenue + (item.quantity * item.unit_price)
          });
        }
      });
    });

    const productsSold = Array.from(productStats.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Total commissions
    const totalCommissions = commissions.reduce((sum, c) => sum + c.amount, 0);

    return {
      date,
      totalRevenue,
      totalBookings,
      completedBookings,
      cancelledBookings,
      newClients: newClients.length,
      totalClients: totalClientsCount,
      topServices,
      staffPerformance,
      productsSold,
      averageBookingValue,
      totalCommissions
    };
  }

  formatReportMessage(stats: DailyStats): string {
    const date = new Date(stats.date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let message = `📊 *RAPPORT QUOTIDIEN - ${date.toUpperCase()}*\n\n`;
    
    message += `💰 *REVENUS TOTAUX:* ${formatPrice(stats.totalRevenue)}\n`;
    message += `📅 *RÉSERVATIONS:* ${stats.totalBookings} (${stats.completedBookings} terminées, ${stats.cancelledBookings} annulées)\n`;
    message += `👥 *CLIENTS:* ${stats.newClients} nouveaux | ${stats.totalClients} total\n`;
    message += `💵 *VALEUR MOYENNE:* ${formatPrice(stats.averageBookingValue)}\n`;
    message += `🎯 *COMMISSIONS:* ${formatPrice(stats.totalCommissions)}\n\n`;

    if (stats.topServices.length > 0) {
      message += `🏆 *TOP SERVICES:*\n`;
      stats.topServices.forEach((service, index) => {
        message += `${index + 1}. ${service.name}: ${service.count}x - ${formatPrice(service.revenue)}\n`;
      });
      message += `\n`;
    }

    if (stats.staffPerformance.length > 0) {
      message += `👨‍💼 *PERFORMANCE ÉQUIPE:*\n`;
      stats.staffPerformance.forEach((staff, index) => {
        message += `${index + 1}. ${staff.name}: ${staff.bookings} réservations - ${formatPrice(staff.revenue)}\n`;
      });
      message += `\n`;
    }

    if (stats.productsSold.length > 0) {
      message += `🛍️ *PRODUITS VENDUS:*\n`;
      stats.productsSold.forEach((product, index) => {
        message += `${index + 1}. ${product.name}: ${product.quantity}x - ${formatPrice(product.revenue)}\n`;
      });
      message += `\n`;
    }

    message += `📱 Rapport généré automatiquement à ${new Date().toLocaleTimeString('fr-FR')}`;

    return message;
  }
}

export const dailyReportService = new DailyReportService();
export default DailyReportService;