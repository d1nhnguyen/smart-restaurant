import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export const multerOptions = {
    storage: diskStorage({
        destination: './uploads/menu-items',
        filename: (req, file, callback) => {
            const uniqueSuffix = uuidv4();
            const ext = extname(file.originalname);
            callback(null, `${uniqueSuffix}${ext}`);
        },
    }),
    fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/)) {
            return callback(new BadRequestException('Only image files are allowed!'), false);
        }
        callback(null, true);
    },
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
};
