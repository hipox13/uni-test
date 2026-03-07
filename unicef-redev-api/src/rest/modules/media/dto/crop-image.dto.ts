import { IsNumber, Min } from 'class-validator';

export class CropImageDto {
  @IsNumber()
  @Min(0)
  left: number;

  @IsNumber()
  @Min(0)
  top: number;

  @IsNumber()
  @Min(1)
  width: number;

  @IsNumber()
  @Min(1)
  height: number;
}
