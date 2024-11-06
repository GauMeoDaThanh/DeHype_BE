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

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @Post()
  create(
    @UploadedFile(new FileValidationPipe()) coverImage: Express.Multer.File,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoryService.create(coverImage, createCategoryDto);
  }

  @Public()
  @Get()
  findAll() {
    return this.categoryService.findAll();
  }

  @Patch(':id')
  updateCategoryInfo(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.updateCateInfo(+id, updateCategoryDto);
  }

  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @Patch(':id/upload')
  updateCategoryImage(
    @Param('id') id: string,
    @UploadedFile(new FileValidationPipe()) coverImage: Express.Multer.File,
  ) {
    return this.categoryService.updateCateCover(+id, coverImage);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoryService.remove(+id);
  }
}
