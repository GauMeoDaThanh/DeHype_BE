import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Repository } from 'typeorm';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { extractPublicId } from 'cloudinary-build-url';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async isExistCategoryName(categoryName: string) {
    return await this.categoryRepository.existsBy({ name: categoryName });
  }

  async create(
    coverImage: Express.Multer.File,
    createCategoryDto: CreateCategoryDto,
  ) {
    try {
      const { name } = createCategoryDto;

      if (await this.isExistCategoryName(name))
        throw new BadRequestException(
          `Already have category with name: ${name}`,
        );

      const folder = 'category';
      const uploadResult = await this.cloudinaryService.uploadFile(
        coverImage,
        folder,
      );

      const createCategory = this.categoryRepository.create({
        name: name.trim(),
        coverUrl: uploadResult.url,
      });

      return await this.categoryRepository.save(createCategory);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error(`Error in create category - ${error}`);
      throw new InternalServerErrorException('Error in create category');
    }
  }

  async findAll() {
    try {
      return await this.categoryRepository.find({ order: { name: 'ASC' } });
    } catch (error) {
      console.log('Error in get categories: ', error);
      throw new InternalServerErrorException('Error in get all category');
    }
  }

  async updateCateInfo(id: number, updateCategoryDto: UpdateCategoryDto) {
    try {
      const categoryInfo = await this.categoryRepository.findOneBy({ id });

      if (!categoryInfo)
        throw new NotFoundException(`Not found the category with id: ${id}`);

      categoryInfo.name = updateCategoryDto.name.trim();

      return await this.categoryRepository.save(categoryInfo);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Error in update category:', error);
      throw new InternalServerErrorException('Error in update category');
    }
  }

  async updateCateCover(id: number, coverImage: Express.Multer.File) {
    try {
      const categoryInfo = await this.categoryRepository.findOneBy({ id });
      if (!categoryInfo)
        throw new NotFoundException(`Not found the category with id: ${id}`);

      const publicId = extractPublicId(categoryInfo.coverUrl);
      this.cloudinaryService.removeFile(publicId);

      const folder = 'category';

      const uploadReponse = await this.cloudinaryService.uploadFile(
        coverImage,
        folder,
      );
      categoryInfo.coverUrl = uploadReponse.url;
      return await this.categoryRepository.save(categoryInfo);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Error in update category cover:', error);
      throw new InternalServerErrorException('Error in update category cover');
    }
  }

  async remove(id: number) {
    try {
      const categoryInfo = await this.categoryRepository.findOneBy({ id });

      if (categoryInfo) {
        this.cloudinaryService.removeFile(
          extractPublicId(categoryInfo.coverUrl),
        );
      }

      return await this.categoryRepository.delete(id);
    } catch (error) {
      console.error('Error in remove category:', error);
      throw new InternalServerErrorException('Error in remove category');
    }
  }
}
