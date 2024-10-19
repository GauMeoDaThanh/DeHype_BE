import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Blog } from './entities/blog.entity';
import { Repository } from 'typeorm';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import aqp from 'api-query-params';
import { GetBlogResponse, MetaDto } from './dto/response-blog';
import { extractPublicId } from 'cloudinary-build-url';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(Blog)
    private blogRepository: Repository<Blog>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async validateUserOwner(id: string, walletAddress: string) {
    const blog = await this.blogRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!blog) throw new NotFoundException(`Can't find a blog with id ${id}`);
    if (blog.user.walletAddress !== walletAddress)
      throw new ForbiddenException("You're not the author");
    return blog;
  }

  validateId(id: string) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new NotAcceptableException('Invalid UUID');
    }
  }

  async findBlog(id: string) {
    this.validateId(id);
    const blog = await this.blogRepository.findOneBy({ id });
    if (!blog) throw new NotFoundException(`Can't find a blog with id ${id}`);

    return blog;
  }

  async create(
    thumbnail: Express.Multer.File,
    createBlogDto: CreateBlogDto,
    walletAddress: string,
  ) {
    const { content, title, blogImages } = createBlogDto;

    const folder = 'Blog/thumbnail';
    const uploadResult = await this.cloudinaryService.uploadFile(
      thumbnail,
      folder,
    );

    const blog = this.blogRepository.create({
      thumbnailUrl: uploadResult.url,
      content: DOMPurify.sanitize(await marked.parse(content.trim())),
      title: title.trim(),
      user: { walletAddress: walletAddress },
      blogImageIds: blogImages,
    });

    return await this.blogRepository.save(blog);
  }

  async uploadImage(image: Express.Multer.File) {
    const folder = 'Blog/blogImage';
    const uploadResult = await this.cloudinaryService.uploadFile(image, folder);

    return {
      public_id: uploadResult.public_id,
      url: uploadResult.url,
    };
  }

  async findOne(id: string) {
    this.validateId(id);
    const blog = await this.blogRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!blog) throw new NotFoundException(`Can't find a blog with id ${id}`);

    const user = {
      username: blog.user.username,
      avatarUrl: blog.user.avatarUrl,
    };

    return {
      ...blog,
      user,
      content: blog.content,
    };
  }

  async updateContent(
    id: string,
    updateBlogDto: UpdateBlogDto,
    walletAddress: string,
  ) {
    const blog = await this.validateUserOwner(id, walletAddress);
    if (updateBlogDto.content)
      updateBlogDto.content = DOMPurify.sanitize(
        await marked.parse(updateBlogDto.content.trim()),
      );

    const hasChange = Object.keys(updateBlogDto).some((key) => {
      return JSON.stringify(updateBlogDto[key]) !== JSON.stringify(blog[key]);
    });

    if (!hasChange)
      return {
        message: 'No update made, data is unchanged',
      };

    if (updateBlogDto.content) blog.content = updateBlogDto.content;
    if (updateBlogDto.title) blog.title = updateBlogDto.title.trim();

    const imageDifferences = blog.blogImageIds.filter(
      (x) => !updateBlogDto.blogImageIds.includes(x),
    );
    if (updateBlogDto.blogImageIds)
      blog.blogImageIds = updateBlogDto.blogImageIds;

    if (imageDifferences.length > 0) {
      this.cloudinaryService.removeFiles(imageDifferences);
    }

    const savedBlog = await this.blogRepository.save(blog);

    const { user, ...blogWithoutUser } = savedBlog;

    return blogWithoutUser;
  }

  async updateThumbnail(
    id: string,
    file: Express.Multer.File,
    walletAddress: string,
  ) {
    const blog = await this.validateUserOwner(id, walletAddress);

    const public_id = extractPublicId(blog.thumbnailUrl);

    this.cloudinaryService.removeFile(public_id);

    const folder = 'Blog/thumbnail';

    const uploadReponse = await this.cloudinaryService.uploadFile(file, folder);

    blog.thumbnailUrl = uploadReponse.url;
    this.blogRepository.save(blog);

    return {
      public_id: uploadReponse.public_id,
      url: uploadReponse.url,
    };
  }

  async findAll(query: string) {
    const { filter, sort } = aqp(query);
    const allowedSortColumns = ['id', 'createdAt', 'title', 'updatedAt'];

    let { pageSize, current, ...restFilter } = filter;

    if (!pageSize) pageSize = 10;
    if (!current) current = 1;
    if (sort) {
      const sortField = Object.keys(sort);
      sortField.forEach((field) => {
        if (allowedSortColumns.includes(field) === false)
          throw new BadRequestException(`Invalid sort column: ${field}`);
      });
    }

    const [results, totalItems] = await this.blogRepository.findAndCount({
      relations: ['user'],
      where: { ...restFilter },
      order: sort,
      take: pageSize,
      skip: (current - 1) * pageSize,
    });

    const customizedResults = results.map((blog) => ({
      id: blog.id,
      thumbnail: blog.thumbnailUrl,
      title: blog.title,
      author: blog.user ? blog.user.username : null,
    }));

    const meta: MetaDto = {
      current: current,
      pageSize: pageSize,
      pages: Math.ceil(totalItems / pageSize),
      total: totalItems,
    };

    const response: GetBlogResponse = {
      comments: customizedResults,
      meta: meta,
    };

    return response;
  }

  async remove(id: string) {
    this.validateId(id);
    const blog = await this.blogRepository.findOneBy({ id });

    if (blog) {
      this.cloudinaryService.removeFile(extractPublicId(blog.thumbnailUrl));
      if (blog.blogImageIds.length > 0)
        this.cloudinaryService.removeFiles(blog.blogImageIds);
    }

    return await this.blogRepository.delete(id);
  }
}
