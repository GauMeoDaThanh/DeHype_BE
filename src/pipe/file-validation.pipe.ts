import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import {
  ALLOWED_MIME_TYPES,
  ERROR_MESSAGES,
  MAX_FILE_SIZE,
} from 'src/constants/file-upload-validate';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    const file = value;

    if (!file) {
      throw new BadRequestException(ERROR_MESSAGES.FILE_REQUIRED);
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_FILE_TYPE);
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(ERROR_MESSAGES.FILE_TOO_LARGE);
    }

    return file;
  }
}
