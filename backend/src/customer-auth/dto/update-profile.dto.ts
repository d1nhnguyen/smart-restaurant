import { IsOptional, IsString, MinLength, MaxLength, Matches, IsIn } from 'class-validator';

export class UpdateProfileDto {
  @IsString({ message: 'Name must be a string' })
  @IsOptional()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  @Matches(/^[a-zA-ZÀ-ỹ\s'-]+$/, { message: 'Name can only contain letters, spaces, hyphens, and apostrophes' })
  name?: string;

  @IsString({ message: 'Phone must be a string' })
  @IsOptional()
  @Matches(/^\+?[0-9]{10,15}$/, { message: 'Phone must be a valid phone number (10-15 digits, optionally starting with +)' })
  phone?: string;

  @IsString({ message: 'Preferred language must be a string' })
  @IsOptional()
  @IsIn(['en', 'vi'], { message: 'Preferred language must be either "en" or "vi"' })
  preferredLanguage?: string;
}
