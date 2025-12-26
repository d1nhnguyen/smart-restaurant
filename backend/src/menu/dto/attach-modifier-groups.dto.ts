import { IsArray, IsUUID } from 'class-validator';

export class AttachModifierGroupsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  groupIds: string[];
}
