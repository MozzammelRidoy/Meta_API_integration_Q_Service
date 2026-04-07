/**
 * User Role Constants
 * Defines available user roles in the application
 */
export const USER_ROLE = {
  superAdmin: 'superAdmin',
  admin: 'admin',
  user: 'user',
  developer: 'developer',
  editor: 'editor'
} as const

/**
 * Array of all available user roles
 * This is automatically generated from USER_ROLE to ensure consistency
 */
export const UserRole = Object.values(USER_ROLE) as readonly string[]
