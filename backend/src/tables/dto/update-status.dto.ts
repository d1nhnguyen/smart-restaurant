import { IsEnum } from 'class-validator';

export class UpdateStatusDto {
  @IsEnum(['ACTIVE', 'INACTIVE'])
  status: 'ACTIVE' | 'INACTIVE';
}
