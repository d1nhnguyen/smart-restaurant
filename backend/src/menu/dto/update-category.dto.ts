import { PartialType } from '@nestjs/mapped-types'; // Hoặc @nestjs/swagger
import { CreateCategoryDto } from './create-category.dto';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}