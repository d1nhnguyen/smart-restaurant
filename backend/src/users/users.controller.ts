import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    // Profile routes MUST come before :id routes to avoid matching conflicts
    @Get('profile/me')
    @UseGuards(JwtAuthGuard)
    async getProfile(@Request() req) {
        return this.usersService.findOne(req.user.id);
    }

    @Patch('profile/me')
    @UseGuards(JwtAuthGuard)
    async updateProfile(
        @Request() req,
        @Body() updateUserDto: UpdateUserDto,
    ) {
        // Don't allow role change through profile update
        const { role, isActive, ...profileData } = updateUserDto;
        return this.usersService.update(req.user.id, profileData);
    }

    // Admin-only routes
    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('role') role?: string,
        @Query('isActive') isActive?: string,
        @Query('sort') sort?: string,
    ) {
        return this.usersService.findAll({
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            search,
            role,
            isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
            sort,
        });
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(id, updateUserDto);
    }

    @Patch(':id/status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async updateStatus(
        @Request() req,
        @Param('id') id: string,
        @Body('isActive') isActive: boolean,
    ) {
        // Prevent admin from deactivating themselves
        if (id === req.user.id && isActive === false) {
            throw new Error('You cannot deactivate your own account');
        }
        return this.usersService.updateStatus(id, isActive);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    async remove(@Request() req, @Param('id') id: string) {
        // Prevent admin from deleting themselves
        if (id === req.user.id) {
            throw new Error('You cannot delete your own account');
        }
        return this.usersService.remove(id);
    }
}
