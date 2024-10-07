import { Controller, Post, Body, UploadedFile, UseInterceptors } from '@nestjs/common';
import { MetadataService } from './metadata.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';

@Controller('metadata')
export class MetadataController {
  constructor(private readonly metadataService: MetadataService) { }

  // @Post('upload')
  // @UseInterceptors(
  //   FileInterceptor('imageFile', {
  //     storage: diskStorage({
  //       destination: './uploads',
  //       filename: (req, file, callback) => {
  //         const fileName = `${Date.now()}-${file.originalname}`;
  //         callback(null, fileName);
  //       },
  //     }),
  //   }),
  // )
  // async uploadMetadata(
  //   @Body('tokenName') tokenName: string,
  //   @Body('tokenSymbol') tokenSymbol: string,
  //   @Body('tokenDescription') tokenDescription: string,
  //   @UploadedFile() imageFile: Express.Multer.File,
  // ): Promise<string> {
  //   const imagePath = path.join(__dirname, '..', '..', 'uploads', imageFile.filename);
  //   // return await this.metadataService.(tokenName, tokenSymbol, tokenDescription, imagePath);
  // }
}
