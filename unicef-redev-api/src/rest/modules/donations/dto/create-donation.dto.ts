import { IsString, IsOptional, IsInt, IsIn, MaxLength, Matches, IsDateString } from 'class-validator';

export class CreateDonationDto {
    @IsString()
    @MaxLength(255)
    title: string;

    @IsOptional()
    @IsString()
    @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        message: 'Slug must be lowercase alphanumeric with hyphens only',
    })
    @MaxLength(255)
    slug?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    body?: string;

    @IsOptional()
    @IsInt()
    @IsIn([0, 1, 2])
    status?: number; // 0=Draft, 1=Review, 2=Published

    @IsOptional()
    @IsInt()
    donateType?: number;

    @IsOptional()
    @IsString()
    customCss?: string;

    @IsOptional()
    @IsString()
    customJs?: string;

    @IsOptional()
    @IsInt()
    campaignType?: number;

    @IsOptional()
    @IsString()
    specialTags?: string;

    @IsOptional()
    @IsDateString()
    datePublished?: string;

    @IsOptional()
    @IsDateString()
    dateInactive?: string;

    @IsOptional()
    @IsString()
    picture?: string;

    @IsOptional()
    @IsString()
    mobilePicture?: string;

    @IsOptional()
    @IsString()
    thumbnail?: string;

    @IsOptional()
    @IsString()
    thankyouPicture?: string;

    @IsOptional()
    @IsString()
    monthlyParams?: string;

    @IsOptional()
    @IsString()
    oneoffParams?: string;

    @IsOptional()
    @IsString()
    keywords?: string;

    @IsOptional()
    @IsString()
    bodyOneOff?: string;

    @IsOptional()
    @IsString()
    metaData?: string;
}
