import { ApiProperty } from '@nestjs/swagger';

export class CreateBlogResponseDto {
  @ApiProperty({ description: 'Thumbnail URL of the blog post' })
  thumbnailUrl: string;

  @ApiProperty({ description: 'Title of the blog post' })
  tittle: string;

  @ApiProperty({ description: 'Content of the blog post' })
  content: string;

  @ApiProperty({ description: 'User information', type: 'object' })
  user: {
    walletAddress: string;
  };

  @ApiProperty({ description: 'images in blog' })
  blogImageIds: string[];

  @ApiProperty({ description: 'Unique ID of the blog post' })
  id: string;

  @ApiProperty({ description: 'Date and time when the blog was created' })
  createdAt: Date;

  @ApiProperty({ description: 'Date and time when the blog was last updated' })
  updatedAt: Date;
}

export class UploadImageReponseDto {
  @ApiProperty({ description: 'public id of image' })
  public_id: string;

  @ApiProperty({ description: 'public url of image' })
  url: string;
}

export class BlogResultDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: 'http://example.com/thumbnail.jpg' })
  thumbnail: string;

  @ApiProperty({ example: 'Example Blog Title' })
  title: string;

  @ApiProperty({ example: 'exampleUser' })
  author: string;
}

export class MetaDto {
  @ApiProperty({ example: 1 })
  current: number;

  @ApiProperty({ example: 10 })
  pageSize: number;

  @ApiProperty({ example: 5 })
  pages: number;

  @ApiProperty({ example: 50 })
  total: number;
}

export class GetBlogResponse {
  @ApiProperty({ type: [BlogResultDto] })
  comments: BlogResultDto[];

  @ApiProperty({ type: MetaDto })
  meta: MetaDto;
}

class UserDto {
  @ApiProperty({
    description: 'The username of the user',
    example: '12341',
  })
  username: string;

  @ApiProperty({
    description: 'The URL of the user avatar',
    example:
      'https://res.cloudinary.com/diwacy6yr/image/upload/v1728441530/User/default.png',
  })
  avatarUrl: string;
}

export class UpdateBlogResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the blog post',
    example: '05171c8a-d670-4071-988e-5073b2546755',
  })
  id: string;

  @ApiProperty({
    description: 'The URL of the blog post thumbnail',
    example:
      'http://res.cloudinary.com/diwacy6yr/image/upload/v1729224075/Blog/thumbnail/image',
  })
  thumbnailUrl: string;

  @ApiProperty({
    description: 'The title of the blog post',
    example: 'blog 3 updated',
  })
  title: string;

  @ApiProperty({
    description: 'The content of the blog post in HTML format',
    example: '<p>contenttt 3</p>',
  })
  content: string;

  @ApiProperty({
    description: 'The creation date of the blog post',
    example: '2024-10-17T20:31:57.632Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The last update date of the blog post',
    example: '2024-10-17T21:06:37.321Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'An array of IDs related to blog images',
    example: [],
  })
  blogImageIds: string[];
}

export class DetailBlogResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the blog post',
    example: '05171c8a-d670-4071-988e-5073b2546755',
  })
  id: string;

  @ApiProperty({
    description: 'The URL of the blog post thumbnail',
    example:
      'http://res.cloudinary.com/diwacy6yr/image/upload/v1729224075/Blog/thumbnail/image',
  })
  thumbnailUrl: string;

  @ApiProperty({
    description: 'The title of the blog post',
    example: 'blog 3 updated',
  })
  title: string;

  @ApiProperty({
    description: 'The content of the blog post in HTML format',
    example: '<p>contenttt 3</p>',
  })
  content: string;

  @ApiProperty({
    description: 'The creation date of the blog post',
    example: '2024-10-17T20:31:57.632Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The last update date of the blog post',
    example: '2024-10-17T21:06:37.321Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'An array of IDs related to blog images',
    example: [],
  })
  blogImageIds: string[];

  @ApiProperty({
    description: 'The user information associated with the blog post',
    type: UserDto,
  })
  user: UserDto;
}
