import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { AssignTagDto } from './dto/assign-tag.dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api/v1/tags')
export class TagsController {
    constructor(private readonly tagsService: TagsService) { }

    @Public()
    @Get()
    async findAll() {
        return this.tagsService.findAll();
    }

    @Public()
    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.tagsService.findOne(id);
    }

    @Public()
    @Get(':id/media')
    async findMediaByTag(@Param('id', ParseIntPipe) id: number) {
        return this.tagsService.findMediaByTag(id);
    }

    @Public()
    @Post()
    async create(@Body() dto: CreateTagDto) {
        return this.tagsService.create(dto);
    }

    @Public()
    @Post('media/:mediaId/assign')
    async assignToMedia(
        @Param('mediaId') mediaId: string,
        @Body() dto: AssignTagDto,
    ) {
        return this.tagsService.assignToMedia(BigInt(mediaId), dto.tagIds);
    }

    @Public()
    @Post('media/:mediaId/remove')
    async removeFromMedia(
        @Param('mediaId') mediaId: string,
        @Body() dto: AssignTagDto,
    ) {
        return this.tagsService.removeFromMedia(BigInt(mediaId), dto.tagIds);
    }

    @Public()
    @Patch(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTagDto) {
        return this.tagsService.update(id, dto);
    }

    @Public()
    @Delete(':id')
    async remove(@Param('id', ParseIntPipe) id: number) {
        return this.tagsService.remove(id);
    }
}
