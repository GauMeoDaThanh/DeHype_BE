import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    const file = value;

    if (!file) {
      throw new BadRequestException('File is required!');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type!');
    }

    if (file.size > 1024 * 1024 * 5) {
      throw new BadRequestException('File is too large!');
    }

    return file;
  }
}
