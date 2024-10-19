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
  Query,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { Role } from 'src/constants/role.enum';
import { Roles } from 'src/decorators/role-route';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileValidationPipe } from 'src/pipe/file-validation.pipe';
import { Wallet } from 'src/decorators/current-wallet';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotAcceptableResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Tag } from 'src/constants/api-tag.enum';
import {
  DetailBlogResponseDto,
  CreateBlogResponseDto,
  GetBlogResponse,
  UploadImageReponseDto,
  UpdateBlogResponseDto,
} from './dto/response-blog';
import { Public } from 'src/decorators/public-route';

@ApiTags(Tag.BLOG)
@Controller('blogs')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'create blog' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
        file: {
          type: 'string',
          format: 'binary',
        },
        blogImageIds: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['title', 'content', 'file'],
    },
  })
  @ApiCreatedResponse({
    description: 'Successful Operation',
    type: CreateBlogResponseDto,
  })
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @Post()
  create(
    @UploadedFile(new FileValidationPipe()) thumbnail: Express.Multer.File,
    @Body() createBlogDto: CreateBlogDto,
    @Wallet() walletAddress: string,
  ) {
    return this.blogService.create(thumbnail, createBlogDto, walletAddress);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'upload picture inside blog' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({
    description: 'Successfull Operation',
    type: UploadImageReponseDto,
  })
  @Roles(Role.ADMIN)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(
    @UploadedFile(new FileValidationPipe()) image: Express.Multer.File,
  ) {
    return this.blogService.uploadImage(image);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'update blog info and content' })
  @ApiOkResponse({ type: UpdateBlogResponseDto })
  @ApiNotFoundResponse({ description: "Can't find blog" })
  @ApiForbiddenResponse({ description: 'Only author can update blog' })
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBlogDto: UpdateBlogDto,
    @Wallet() walletAddress: string,
  ) {
    return this.blogService.updateContent(id, updateBlogDto, walletAddress);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'update blog thumbnail' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Successfull Operation',
    type: UploadImageReponseDto,
  })
  @ApiNotFoundResponse({ description: "Can't find blog" })
  @ApiForbiddenResponse({ description: 'Only author can update blog' })
  @Roles(Role.ADMIN)
  @Patch(':id/upload')
  @UseInterceptors(FileInterceptor('file'))
  updateThumbnail(
    @Param('id') id: string,
    @UploadedFile(new FileValidationPipe()) file: Express.Multer.File,
    @Wallet() walletAddress: string,
  ) {
    return this.blogService.updateThumbnail(id, file, walletAddress);
  }

  @ApiOperation({ summary: 'get detail blog' })
  @ApiOkResponse({ type: DetailBlogResponseDto })
  @ApiNotAcceptableResponse({ description: 'Invalid Id' })
  @ApiNotFoundResponse({ description: "Can't find blog" })
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.blogService.findOne(id);
  }

  @ApiOperation({ summary: 'get all blogs' })
  @ApiOkResponse({ type: GetBlogResponse })
  @ApiBadRequestResponse({ description: 'Query invalid' })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Number of record each page',
  })
  @ApiQuery({ name: 'current', required: false, description: 'Current page' })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Number of record each page',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'Current page',
    example: '-createdAt',
  })
  @Public()
  @Get()
  findAll(@Query() query: string) {
    return this.blogService.findAll(query);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'delete blog' })
  @ApiOkResponse()
  @ApiNotAcceptableResponse({ description: 'Invalid Id' })
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.blogService.remove(id);
  }
}
