import { PartialType } from '@nestjs/mapped-types';
import { CreateMenuItemDto } from './create-item.dto';

export class UpdateMenuItemDto extends PartialType(CreateMenuItemDto) {}