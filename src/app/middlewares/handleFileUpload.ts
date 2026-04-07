/* eslint-disable @typescript-eslint/no-explicit-any */
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import { Request, Response, NextFunction } from 'express'
import AppError from '../errors/AppError'
import { removeUploadedFiles } from '../utils/removeUploadedFiles'

// Default constants
const DEFAULT_MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const DEFAULT_MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB

// Default allowed file types
const DEFAULT_ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/svg+xml'
]

const DEFAULT_ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/mov',
  'video/avi',
  'video/mkv'
]

// Helper function to ensure directory exists
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath)
  } catch {
    await fs.mkdir(dirPath, { recursive: true })
  }
}

// Dynamic storage configuration
const storage = multer.diskStorage({
  destination: async (req: Request, file, cb) => {
    let uploadPath: string

    // Determine upload path based on file type
    if (file.mimetype.startsWith('image/')) {
      uploadPath = path.join(process.cwd(), 'uploads/images')
    } else if (file.mimetype.startsWith('video/')) {
      uploadPath = path.join(process.cwd(), 'uploads/videos')
    } else {
      return cb(new AppError(400, '', 'Invalid file type'), '')
    }

    try {
      await ensureDirectoryExists(uploadPath)
      cb(null, uploadPath)
    } catch (error: any) {
      cb(error, '')
    }
  },
  filename: (req: Request, file, cb) => {
    const ext = path.extname(file.originalname)
    const originalName = path.basename(file.originalname, ext)
    // Use a more unique filename to avoid collisions
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, `${originalName}-${uniqueSuffix}${ext}`)
  }
})

// Multer instance with global file size limit
const upload = multer({
  storage,
  limits: { fileSize: DEFAULT_MAX_VIDEO_SIZE },
  fileFilter: (req: Request, file, cb) => {
    // Basic file type validation at the multer level
    if (
      file.mimetype.startsWith('image/') ||
      file.mimetype.startsWith('video/')
    ) {
      cb(null, true)
    } else {
      cb(
        new AppError(
          400,
          '',
          'Invalid file type. Only images and videos are allowed.'
        )
      )
    }
  }
})

// Field configuration interface
interface FieldConfig {
  fieldName: string
  fileType: 'image' | 'video'
  maxCount?: number
  optional?: boolean
  maxImageSize?: number
  maxVideoSize?: number
  allowedImageTypes?: string[]
  allowedVideoTypes?: string[]
}

// Main dynamic upload handler for multiple fields
export const handle_file_upload_middleware = (
  fieldConfigs: FieldConfig[],
  globalOptions?: {
    maxImageSize?: number
    maxVideoSize?: number
    allowedImageTypes?: string[]
    allowedVideoTypes?: string[]
  }
) => {
  // Set global defaults with options
  const globalMaxImageSize =
    globalOptions?.maxImageSize || DEFAULT_MAX_IMAGE_SIZE
  const globalMaxVideoSize =
    globalOptions?.maxVideoSize || DEFAULT_MAX_VIDEO_SIZE
  const globalAllowedImageTypes =
    globalOptions?.allowedImageTypes || DEFAULT_ALLOWED_IMAGE_TYPES
  const globalAllowedVideoTypes =
    globalOptions?.allowedVideoTypes || DEFAULT_ALLOWED_VIDEO_TYPES

  return (req: Request, res: Response, next: NextFunction) => {
    // Prepare multer fields configuration
    const multerFields = fieldConfigs.map(config => ({
      name: config.fieldName,
      maxCount: config.maxCount || 1
    }))

    // Use multer's fields method to handle all dynamic fields
    upload.fields(multerFields)(req, res, async (err: any) => {
      if (err) {
        // Handle multer errors
        let errorMessage = ''
        let fieldConfig: FieldConfig | undefined

        if (err instanceof multer.MulterError) {
          switch (err.code) {
            case 'LIMIT_FILE_SIZE':
              fieldConfig = fieldConfigs.find(f => f.fieldName === err.field)
              errorMessage = `File size exceeds maximum limit for ${err.field}`
              break
            case 'LIMIT_FILE_COUNT':
              fieldConfig = fieldConfigs.find(f => f.fieldName === err.field)
              errorMessage = `Too many files uploaded for ${err.field} (max ${fieldConfig?.maxCount || 1})`
              break
            case 'LIMIT_UNEXPECTED_FILE':
              fieldConfig = fieldConfigs.find(f => f.fieldName === err.field)
              if (fieldConfig) {
                errorMessage = `Too many files uploaded for ${err.field} (max ${fieldConfig.maxCount || 1})`
              } else {
                errorMessage = `Unexpected field name: ${err.field}`
              }
              break
            case 'LIMIT_FIELD_KEY':
              errorMessage = 'Too many fields specified'
              break
            case 'LIMIT_FIELD_VALUE':
              errorMessage = 'Field value too long'
              break
            case 'LIMIT_FIELD_COUNT':
              errorMessage = 'Too many fields'
              break
            case 'LIMIT_PART_COUNT':
              errorMessage = 'Too many parts in form'
              break
            default:
              errorMessage = `Upload error: ${err.message}`
          }
        } else {
          errorMessage = err.message
        }

        return next(
          new AppError(400, fieldConfig?.fieldName || '', errorMessage)
        )
      }

      // Get uploaded files with proper typing
      const files = req.files as
        | { [fieldname: string]: Express.Multer.File[] }
        | undefined

      try {
        // Check for required fields
        for (const config of fieldConfigs) {
          if (
            !config.optional &&
            (!files ||
              !files[config.fieldName] ||
              files[config.fieldName].length === 0)
          ) {
            throw new AppError(
              400,
              config.fieldName,
              `${config.fieldName} file field is required`
            )
          }
        }

        // Validate each file in each field
        for (const config of fieldConfigs) {
          const fieldFiles = files?.[config.fieldName] || []

          // Determine the max size for this field
          const maxSize =
            config.fileType === 'image'
              ? config.maxImageSize || globalMaxImageSize
              : config.maxVideoSize || globalMaxVideoSize

          // Determine allowed types for this field
          const allowedTypes =
            config.fileType === 'image'
              ? config.allowedImageTypes || globalAllowedImageTypes
              : config.allowedVideoTypes || globalAllowedVideoTypes

          for (const file of fieldFiles) {
            // Validate file type
            if (!allowedTypes.includes(file.mimetype)) {
              // Create a user-friendly list of allowed extensions
              const allowedExtensions = allowedTypes
                .map(type => {
                  const parts = type.split('/')
                  return parts[1] || type
                })
                .join(', ')

              throw new AppError(
                400,
                config.fieldName,
                `Invalid file type for ${config.fieldName}. Only ${allowedExtensions} files are allowed`
              )
            }

            // Validate file size
            if (file.size > maxSize) {
              throw new AppError(
                400,
                config.fieldName,
                `File size exceeds maximum limit for ${config.fieldName} (${maxSize / (1024 * 1024)}MB)`
              )
            }
          }
        }

        // If validation passes, proceed to next middleware
        next()
      } catch (validationError) {
        // Clean up all uploaded files on validation error
        if (files) {
          await removeUploadedFiles(files)
        }
        next(validationError)
      }
    })
  }
}
