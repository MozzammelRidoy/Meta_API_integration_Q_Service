"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
/**
 * Request validation middleware using Zod schemas
 * Creates a middleware function that validates the request against the provided Zod schema
 *
 * @param schema - Zod schema object to validate against
 * @returns Express middleware function
 *
 * @example
 * // Define a schema for user registration
 * const userSchema = z.object({
 *   body: z.object({
 *     email: z.string().email(),
 *     password: z.string().min(8)
 *   }),
 *   params: z.object({
 *     id: z.string().uuid()
 *   })
 * });
 *
 * // Use the middleware
 * app.post('/users/:id', validateRequest(userSchema), userController.createUser);
 */
const validateRequest = (schema) => {
    return (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Prepare the data to validate (body, cookies, and params)
            const dataToValidate = {
                body: req.body,
                cookies: req.cookies,
                params: req.params
            };
            // Validate the data against the schema
            yield schema.parseAsync(dataToValidate);
            // If validation passes, proceed to the next middleware
            next();
        }
        catch (error) {
            // For other types of errors, rethrow them
            next(error);
        }
    }));
};
exports.default = validateRequest;
