import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findAll(params?: {
        page?: number;
        limit?: number;
        search?: string;
        role?: string;
        isActive?: boolean;
        sort?: string;
    }) {
        const page = params?.page || 1;
        const limit = params?.limit || 10;
        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        if (params?.search) {
            where.OR = [
                { name: { contains: params.search, mode: 'insensitive' } },
                { email: { contains: params.search, mode: 'insensitive' } },
            ];
        }

        if (params?.role) {
            where.role = params.role;
        }

        if (params?.isActive !== undefined) {
            where.isActive = params.isActive;
        }

        // Build orderBy clause
        let orderBy: any = { createdAt: 'desc' }; // default

        if (params?.sort) {
            const [field, direction] = params.sort.split('_');
            if (field === 'name') {
                orderBy = { name: direction };
            } else if (field === 'email') {
                orderBy = { email: direction };
            } else if (field === 'role') {
                orderBy = { role: direction };
            } else if (field === 'status') {
                orderBy = { isActive: direction };
            }
        }

        const [data, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                    lastLoginAt: true,
                },
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async create(createUserDto: CreateUserDto) {
        const { email, password, name, role } = createUserDto;

        // Check if user already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await this.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return user;
    }

    async update(id: string, updateUserDto: UpdateUserDto) {
        // Check if user exists
        const existingUser = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            throw new NotFoundException('User not found');
        }

        // If email is being updated, check for duplicates
        if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
            const emailExists = await this.prisma.user.findUnique({
                where: { email: updateUserDto.email },
            });

            if (emailExists) {
                throw new ConflictException('User with this email already exists');
            }
        }

        // Prepare update data
        const updateData: any = { ...updateUserDto };

        // Hash password if provided
        if (updateUserDto.password) {
            updateData.password = await bcrypt.hash(updateUserDto.password, 10);
        }

        // Update user
        const user = await this.prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return user;
    }

    async updateStatus(id: string, isActive: boolean) {
        // Check if user exists
        const existingUser = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            throw new NotFoundException('User not found');
        }

        // Update status
        const user = await this.prisma.user.update({
            where: { id },
            data: { isActive },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
            },
        });

        return user;
    }

    async remove(id: string) {
        // Check if user exists
        const existingUser = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            throw new NotFoundException('User not found');
        }

        // Delete user
        await this.prisma.user.delete({
            where: { id },
        });

        return { message: 'User deleted successfully' };
    }
}
