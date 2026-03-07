import { IsNumber, IsString, IsOptional, IsIn, Min } from 'class-validator';

export class ChargeDto {
  @IsNumber()
  @Min(10000)
  amount!: number;

  @IsString()
  firstName!: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  email!: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsIn(['bank_transfer', 'gopay', 'shopeepay', 'credit_card'])
  paymentMethod!: string;

  @IsString()
  @IsOptional()
  @IsIn(['bca', 'bni', 'bri', 'permata', 'mandiri'])
  bankCode?: string;

  @IsNumber()
  @IsOptional()
  articleId?: number;

  /** 1 = Monthly, 2 = One-off */
  @IsNumber()
  @IsIn([1, 2])
  donateType!: number;

  /** 1 = Default, 2 = Consideration, 3 = WID one-off, 4 = WID monthly */
  @IsNumber()
  @IsOptional()
  @IsIn([1, 2, 3, 4])
  campaignType?: number;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  utm_source?: string;

  @IsString()
  @IsOptional()
  utm_medium?: string;

  @IsString()
  @IsOptional()
  utm_content?: string;

  @IsString()
  @IsOptional()
  utm_campaign?: string;

  @IsString()
  @IsOptional()
  utm_term?: string;
}
