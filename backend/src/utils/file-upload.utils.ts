import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { cloudinaryStorage } from '../config/cloudinary.config';

// Check if we should use Cloudinary (production) or local storage (development)
const useCloudinary = process.env.NODE_ENV === 'production' || process.env.USE_CLOUDINARY === 'true';

// Local disk storage configuration
const localDiskStorage = diskStorage({
    destination: './uploads/menu-items',
    filename: (req, file, callback) => {
        const uniqueSuffix = uuidv4();
        const ext = extname(file.originalname);
        callback(null, `${uniqueSuffix}${ext}`);
    },
});

// File filter for both local and cloudinary
const fileFilter = (req, file, callback) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/i)) {
        return callback(new BadRequestException('Only image files are allowed!'), false);
    }
    callback(null, true);
};

// Export multer options based on environment
export const multerOptions = {
    storage: useCloudinary ? cloudinaryStorage : localDiskStorage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
};

// Helper to check if using cloudinary
export const isUsingCloudinary = () => useCloudinary;
