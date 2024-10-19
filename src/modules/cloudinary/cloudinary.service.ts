import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryResponse } from 'src/constants/cloudinary-response';
const streamifier = require('streamifier');

@Injectable()
export class CloudinaryService {
  uploadFile(
    file: Express.Multer.File,
    folder: string,
  ): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (error) {
            return reject(
              new InternalServerErrorException(
                'File upload failed',
                error.message,
              ),
            );
          }
          resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    }).catch((error) => {
      throw new InternalServerErrorException(
        'File upload failed',
        error.message,
      );
    });
  }

  async removeFile(publicId: string): Promise<CloudinaryResponse> {
    try {
      return await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      throw new InternalServerErrorException('File removal failed', error);
    }
  }

  async removeFiles(public_ids: string[]): Promise<CloudinaryResponse> {
    try {
      return await cloudinary.api.delete_resources(public_ids);
    } catch (error) {
      throw new InternalServerErrorException(
        'Batch file removal failed',
        error,
      );
    }
  }
}
