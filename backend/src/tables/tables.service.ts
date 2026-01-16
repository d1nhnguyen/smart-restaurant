import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QrService } from '../qr/qr.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';

@Injectable()
export class TablesService {
  constructor(
    private prisma: PrismaService,
    private qrService: QrService,
  ) {}

  async create(createTableDto: CreateTableDto) {
    // Check if table number already exists
    const existingTable = await this.prisma.table.findUnique({
      where: { tableNumber: createTableDto.tableNumber },
    });

    if (existingTable) {
      throw new BadRequestException('Table number already exists');
    }

    // Create table
    const table = await this.prisma.table.create({
      data: createTableDto,
    });

    // Automatically generate QR code for the new table
    await this.qrService.generateQrToken(table.id);

    // Return the table with the QR token
    return this.prisma.table.findUnique({
      where: { id: table.id },
    });
  }

  async findAll(filters?: { status?: string; location?: string; sortBy?: string }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.location) {
      where.location = filters.location;
    }

    const orderBy: any = {};
    if (filters?.sortBy) {
      const [field, order] = filters.sortBy.split(':');
      orderBy[field] = order || 'asc';
    } else {
      orderBy.tableNumber = 'asc';
    }

    return this.prisma.table.findMany({
      where,
      orderBy,
    });
  }

  async findOne(id: string) {
    const table = await this.prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      throw new NotFoundException(`Table with ID ${id} not found`);
    }

    return table;
  }

  async update(id: string, updateTableDto: UpdateTableDto) {
    await this.findOne(id); // Check if exists

    // If table number is being updated, check for duplicates
    if (updateTableDto.tableNumber) {
      const existingTable = await this.prisma.table.findFirst({
        where: {
          tableNumber: updateTableDto.tableNumber,
          NOT: { id },
        },
      });

      if (existingTable) {
        throw new BadRequestException('Table number already exists');
      }
    }

    return this.prisma.table.update({
      where: { id },
      data: updateTableDto,
    });
  }

  async updateStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
    await this.findOne(id); // Check if exists

    return this.prisma.table.update({
      where: { id },
      data: { status },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check if exists

    return this.prisma.table.delete({
      where: { id },
    });
  }

  async getLocations() {
    const tables = await this.prisma.table.findMany({
      select: { location: true },
      distinct: ['location'],
      where: {
        location: {
          not: null,
        },
      },
    });

    return tables.map((t) => t.location).filter(Boolean);
  }
}
