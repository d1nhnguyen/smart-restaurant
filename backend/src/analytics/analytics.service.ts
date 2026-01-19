import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus, OrderStatus } from '@prisma/client';

@Injectable()
export class AnalyticsService {
    constructor(private prisma: PrismaService) { }

    async getSummaryStats(startDate?: Date, endDate?: Date) {
        const whereClause: any = {
            paymentStatus: PaymentStatus.PAID,
        };

        if (startDate && endDate) {
            whereClause.createdAt = {
                gte: startDate,
                lte: endDate,
            };
        }

        // Total Revenue
        const revenueAgg = await this.prisma.order.aggregate({
            _sum: {
                totalAmount: true,
            },
            where: whereClause,
        });
        const totalRevenue = Number(revenueAgg._sum.totalAmount || 0);

        // Total Orders (Completed)
        const ordersCount = await this.prisma.order.count({
            where: {
                status: OrderStatus.COMPLETED,
                ...(startDate && endDate ? {
                    createdAt: {
                        gte: startDate,
                        lte: endDate,
                    }
                } : {})
            },
        });

        // Avg Order Value
        const avgOrderValue = ordersCount > 0 ? totalRevenue / ordersCount : 0;

        // Avg Prep Time (in minutes)
        // We fetch completed orders and calculate avg time manually since simple AVG on timestamp diff might be complex in Prisma alone without raw query
        const completedOrders = await this.prisma.order.findMany({
            where: {
                status: OrderStatus.COMPLETED,
                completedAt: { not: null },
                ...(startDate && endDate ? {
                    createdAt: {
                        gte: startDate,
                        lte: endDate,
                    }
                } : {})
            },
            select: {
                createdAt: true,
                completedAt: true,
            },
            take: 1000, // Limit to avoid memory issues on large sets
        });

        let totalPrepMinutes = 0;
        completedOrders.forEach(o => {
            const diffMs = new Date(o.completedAt).getTime() - new Date(o.createdAt).getTime();
            totalPrepMinutes += diffMs / (1000 * 60);
        });
        const avgPrepTime = completedOrders.length > 0 ? Math.round(totalPrepMinutes / completedOrders.length) : 0;

        return {
            totalRevenue,
            totalOrders: ordersCount,
            avgOrderValue,
            avgPrepTime, // in minutes
        };
    }

    async getRevenueChart(startDate: Date, endDate: Date, period: 'day' | 'week' | 'month' = 'day', timeZone: string = 'Asia/Ho_Chi_Minh') {
        // For simplicity, we will fetch daily sums and aggregate in JS or use raw query.
        // Given PostgreSQL, we can use date_trunc.

        let groupBy: string;
        switch (period) {
            case 'week': groupBy = 'week'; break;
            case 'month': groupBy = 'month'; break;
            default: groupBy = 'day';
        }

        // Note: Prisma raw query returns BigInt for sums, needs handling.
        // Also ensuring timezones might be tricky, assuming UTC for now.
        const result = await this.prisma.$queryRawUnsafe(`
      SELECT 
        DATE_TRUNC('${groupBy}', created_at AT TIME ZONE 'UTC' AT TIME ZONE $3) as date,
        SUM(total_amount) as revenue
      FROM orders 
      WHERE payment_status = '${PaymentStatus.PAID}'
      AND created_at >= $1 AND created_at <= $2
      GROUP BY DATE_TRUNC('${groupBy}', created_at AT TIME ZONE 'UTC' AT TIME ZONE $3)
      ORDER BY date ASC
    `, startDate, endDate, timeZone);

        return (result as any[]).map(r => ({
            date: r.date,
            revenue: Number(r.revenue || 0)
        }));
    }

    async getPeakHours(startDate: Date, endDate: Date, timeZone: string = 'Asia/Ho_Chi_Minh') {
        // Extract hour from created_at
        // Using queryRawUnsafe to ensure consistent parameter usage for timezone and GROUP BY
        const result = await this.prisma.$queryRawUnsafe(`
      SELECT 
        EXTRACT(HOUR FROM created_at AT TIME ZONE 'UTC' AT TIME ZONE $3) as hour,
        COUNT(*) as count
      FROM orders
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY 1
      ORDER BY 1 ASC
    `, startDate, endDate, timeZone);

        // Initialize all 24 hours with 0
        const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));

        (result as any[]).forEach(r => {
            const h = Number(r.hour);
            if (hours[h]) hours[h].count = Number(r.count);
        });

        return hours;
    }

    async getTopSellingItems(startDate: Date, endDate: Date) {
        // Assuming we group by menuItemName from OrderItem
        const result = await this.prisma.orderItem.groupBy({
            by: ['menuItemName'],
            _sum: {
                quantity: true,
                subtotal: true,
            },
            where: {
                order: {
                    status: { not: OrderStatus.CANCELLED }, // Exclude cancelled orders
                    paymentStatus: PaymentStatus.PAID,      // Only include PAID orders
                    createdAt: {
                        gte: startDate,
                        lte: endDate,
                    }
                }
            },
            orderBy: {
                _sum: {
                    quantity: 'desc',
                }
            },
            take: 10,
        });

        return result.map(item => ({
            name: item.menuItemName,
            quantity: item._sum.quantity || 0,
            revenue: Number(item._sum.subtotal || 0),
        }));
    }
}
