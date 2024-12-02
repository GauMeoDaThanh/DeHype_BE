import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileValidationPipe } from 'src/pipe/file-validation.pipe';
import { Roles } from 'src/decorators/role-route';
import { Role } from 'src/constants/role.enum';
import { Public } from 'src/decorators/public-route';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Tag } from 'src/constants/api-tag.enum';
import { CreateCategoryResponseDto } from './dto/response-category';

@ApiTags(Tag.CATEGORY)
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'create category' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['name', 'file'],
    },
  })
  @ApiCreatedResponse({ type: CreateCategoryResponseDto })
  @ApiInternalServerErrorResponse()
  @Post()
  create(
    @UploadedFile(new FileValidationPipe()) coverImage: Express.Multer.File,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoryService.create(coverImage, createCategoryDto);
  }

  @Public()
  @ApiOperation({ summary: 'get all categories' })
  @ApiOkResponse({ type: [CreateCategoryResponseDto] })
  @ApiInternalServerErrorResponse()
  @Get()
  findAll() {
    return this.categoryService.findAll();
  }

  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'update category info' })
  @ApiBearerAuth()
  @ApiOkResponse({ type: CreateCategoryResponseDto })
  @ApiInternalServerErrorResponse()
  @Patch(':id')
  updateCategoryInfo(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.updateCateInfo(+id, updateCategoryDto);
  }

  @ApiOperation({ summary: 'update category image' })
  @ApiBearerAuth()
  @ApiOkResponse({ type: CreateCategoryResponseDto })
  @ApiInternalServerErrorResponse()
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @Patch(':id/upload')
  updateCategoryImage(
    @Param('id') id: string,
    @UploadedFile(new FileValidationPipe()) coverImage: Express.Multer.File,
  ) {
    return this.categoryService.updateCateCover(+id, coverImage);
  }

  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'delete category' })
  @ApiOkResponse()
  @ApiInternalServerErrorResponse()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoryService.remove(+id);
  }
}
