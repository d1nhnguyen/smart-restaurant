import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('analytics')
// @UseGuards(AuthGuard('jwt')) // Un-comment to enforce auth, assuming admins only
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('summary')
    async getSummaryStats(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;

        // Default to last 30 days if not provided, or handle in service. 
        // Let's pass undefined if not provided and let service handle or return all-time if needed.
        // However, for reports, usually we want a range. 
        // If user doesn't provide, let's default to current month in Controller or let frontend send it.
        // For now passing as is.
        return this.analyticsService.getSummaryStats(start, end);
    }

    @Get('revenue-chart')
    async getRevenueChart(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Query('period') period: 'day' | 'week' | 'month' = 'day',
        @Query('timeZone') timeZone: string,
    ) {
        // These are required for chart
        if (!startDate || !endDate) {
            // Default to last 7 days? Better to throw error or default.
            const end = new Date();
            const start = new Date();
            start.setDate(end.getDate() - 7);
            return this.analyticsService.getRevenueChart(start, end, period, timeZone);
        }
        return this.analyticsService.getRevenueChart(new Date(startDate), new Date(endDate), period, timeZone);
    }

    @Get('peak-hours')
    async getPeakHours(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Query('timeZone') timeZone: string,
    ) {
        if (!startDate || !endDate) {
            const end = new Date();
            const start = new Date();
            start.setDate(end.getDate() - 7);
            return this.analyticsService.getPeakHours(start, end, timeZone);
        }
        return this.analyticsService.getPeakHours(new Date(startDate), new Date(endDate), timeZone);
    }

    @Get('top-items')
    async getTopSellingItems(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ) {
        if (!startDate || !endDate) {
            const end = new Date();
            const start = new Date();
            start.setDate(end.getDate() - 30);
            return this.analyticsService.getTopSellingItems(start, end);
        }
        return this.analyticsService.getTopSellingItems(new Date(startDate), new Date(endDate));
    }
}
