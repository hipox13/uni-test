import { PartialType } from '@nestjs/mapped-types';
import { CreateDonationDto } from './create-donation.dto';
import { IsOptional, IsDateString } from 'class-validator';

export class UpdateDonationDto extends PartialType(CreateDonationDto) {
    @IsOptional()
    @IsDateString()
    dateUnpublished?: string;

    @IsOptional()
    @IsDateString()
    dateInactive?: string;
}
