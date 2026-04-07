import { JwtPayload } from 'jsonwebtoken'
import config from '../config'
import AppError from '../errors/AppError'
import { TUserRole } from '../interfaces/userRole_type'
import catchAsync from '../utils/catchAsync'
import { verifyToken } from '../utils/commonUtils'

// initiate authentication route auth function
const auth = (...rolesAndFlags: Array<TUserRole | boolean>) => {
  // Check if the last argument is a boolean flag
  let isIgnoreAuthentication = false
  if (typeof rolesAndFlags[rolesAndFlags.length - 1] === 'boolean') {
    isIgnoreAuthentication = rolesAndFlags.pop() as boolean
  }

  // The remaining arguments are the required roles
  const requiredRoles = rolesAndFlags as TUserRole[]
  return catchAsync(async (req, res, next) => {
    // Skip authentication if flag is set
    if (isIgnoreAuthentication) {
      return next()
    }
    // Extract token from Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(
        401,
        'UNAUTHORIZED',
        'You are not authorized. No token provided.'
      )
    }
    const token = authHeader.split(' ')[1]

    // Verify token
    const decoded = verifyToken(token, config.jwt_access_token_secret as string)
    const { user_id, role, iat } = decoded

    // Check if user exists (implementation depends on your user model)
    // const user = await User.isUserStatusCheckFindBy_id(user_id);
    // if (!user) {
    //   throw new AppError(404, 'NOT_FOUND', 'User not found!');
    // }
    // Check if user is deleted
    // if (user.isDeleted) {
    //   throw new AppError(401, 'UNAUTHORIZED', 'This user has been deleted!');
    // }
    // Check if user is blocked
    // if (user.status === 'blocked') {
    //   throw new AppError(403, 'FORBIDDEN', 'This user is blocked!');
    // }
    // Check if user role matches
    // if (user.role !== role) {
    //   throw new AppError(403, 'FORBIDDEN', 'Invalid user role!');
    // }
    // Check if password was changed after token was issued
    // if (user.passwordChangedAt) {
    //   const isPasswordChanged = User.isJWTIssuedAtBeforePasswordChanged(
    //     user.passwordChangedAt,
    //     iat as number
    //   );
    //   if (isPasswordChanged) {
    //     // Clear cache if needed
    //     // delete_cache_from_RAM(user._id?.toString() as string);
    //     throw new AppError(401, 'UNAUTHORIZED', 'Password has been changed. Please login again.');
    //   }
    // }

    // Check if user has required role
    if (requiredRoles.length > 0 && !requiredRoles.includes(role)) {
      throw new AppError(
        403,
        'FORBIDDEN',
        'You do not have permission to perform this action.'
      )
    }
    // Attach user to request object
    req.user = decoded as JwtPayload
    next()
  })
}
export default auth
