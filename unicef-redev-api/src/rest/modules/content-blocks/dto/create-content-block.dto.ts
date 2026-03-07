import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateContentBlockDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsInt()
  authorId?: number;
}
