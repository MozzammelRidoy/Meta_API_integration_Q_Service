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
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-explicit-any */
class PrismaQueryBuilder {
    constructor(prismaModel, query) {
        this.baseWhereClause = {}; // Priority query - cannot be overridden
        this.whereClause = {}; // User filters
        this.orderBy = [];
        this.selectFields = null;
        this.includeRelations = null;
        this.secretFields = []; // Fields that can NEVER be shown
        this.prismaModel = prismaModel;
        this.query = query;
    }
    /**
     * Set base WHERE conditions that have PRIORITY and cannot be overridden
     * These conditions are always applied regardless of user input
     *
     * @param baseWhere - Base WHERE conditions with priority
     * @returns PrismaQueryBuilder instance for chaining
     *
     * @example
     * .setBaseQuery({ ownerId: user.id, isDeleted: false })
     * // User cannot override these conditions
     */
    setBaseQuery(baseWhere) {
        this.baseWhereClause = baseWhere;
        return this;
    }
    /**
     * Set fields that are SECRET and can NEVER be shown in output
     * Even if user explicitly requests them via ?fields=password
     *
     * @param secretFields - Array of field names that must always be hidden
     * @returns PrismaQueryBuilder instance for chaining
     *
     * @example
     * .setSecretFields(['password', 'refreshToken', 'isDeleted'])
     */
    setSecretFields(secretFields) {
        this.secretFields = secretFields;
        return this;
    }
    /**
     * Add search functionality to the query
     * @param searchableFields - Array of fields to search in
     * @returns PrismaQueryBuilder instance for chaining
     */
    search(searchableFields) {
        const searchTerm = this.query.search;
        if (searchTerm) {
            const searchConditions = searchableFields.map(field => ({
                [field]: {
                    contains: searchTerm,
                    mode: 'insensitive'
                }
            }));
            if (Object.keys(this.whereClause).length > 0) {
                this.whereClause = {
                    AND: [Object.assign({}, this.whereClause), { OR: searchConditions }]
                };
            }
            else {
                this.whereClause = {
                    OR: searchConditions
                };
            }
        }
        return this;
    }
    /**
     * Add filtering to the query (exact field = value matching)
     * User filters are applied AFTER base query
     * @returns PrismaQueryBuilder instance for chaining
     */
    filter() {
        const queryObj = Object.assign({}, this.query);
        const excludeFields = [
            'search',
            'sort',
            'page',
            'limit',
            'fields',
            'field',
            'filelds',
            'include',
            'populate',
            'select'
        ];
        excludeFields.forEach(el => delete queryObj[el]);
        // Remove any keys that match base query (prevent override)
        Object.keys(this.baseWhereClause).forEach(key => {
            delete queryObj[key];
        });
        Object.entries(queryObj).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                let processedValue = value;
                if (value === 'true')
                    processedValue = true;
                if (value === 'false')
                    processedValue = false;
                if (this.whereClause.AND || this.whereClause.OR) {
                    const existingClause = Object.assign({}, this.whereClause);
                    this.whereClause = {
                        AND: [existingClause, { [key]: processedValue }]
                    };
                }
                else {
                    this.whereClause[key] = processedValue;
                }
            }
        });
        return this;
    }
    /**
     * Add sorting to the query
     * @returns PrismaQueryBuilder instance for chaining
     */
    sort() {
        const sortField = this.query.sort;
        if (sortField) {
            const sortFields = sortField.split(',');
            this.orderBy = sortFields.map(field => {
                const isDescending = field.startsWith('-');
                const fieldName = isDescending ? field.substring(1) : field;
                return {
                    [fieldName]: isDescending ? 'desc' : 'asc'
                };
            });
        }
        else {
            this.orderBy = [{ createdAt: 'desc' }];
        }
        return this;
    }
    /**
     * Add pagination to the query
     * @returns PrismaQueryBuilder instance for chaining
     */
    paginate() {
        const page = Number(this.query.page) || 1;
        const limit = Number(this.query.limit) || 10;
        this.skipValue = (page - 1) * limit;
        this.takeValue = limit;
        return this;
    }
    /**
     * Field selection to include specific fields
     * Secret fields are ALWAYS removed even if user requests them
     *
     * @returns PrismaQueryBuilder instance for chaining
     */
    fields() {
        const fields = (this.query.fields ||
            this.query.field ||
            this.query.filelds);
        if (fields) {
            const fieldArray = fields.split(',').map(f => f.trim());
            // Filter out secret fields - user cannot request them
            const allowedFields = fieldArray.filter(field => !this.secretFields.includes(field) && field !== '__v' && field !== '');
            if (allowedFields.length > 0) {
                this.selectFields = allowedFields.reduce((acc, field) => {
                    acc[field] = true;
                    return acc;
                }, {});
            }
        }
        return this;
    }
    /**
     * Add relations to include with automatic secret field removal
     *
     * @param relations - Object defining which relations to include
     * @param nestedSecretFields - Secret fields for nested relations
     * @returns PrismaQueryBuilder instance for chaining
     *
     * @example
     * .include(
     *   {
     *     owner: { select: { id: true, name: true, phone: true } },
     *     posts: true
     *   },
     *   {
     *     owner: ['password', 'refreshToken'],
     *     posts: ['isDeleted', 'internalNotes']
     *   }
     * )
     */
    include(relations, nestedSecretFields) {
        if (typeof relations === 'object' && relations !== null) {
            // Process relations and apply secret field filtering
            const processedRelations = Object.assign({}, relations);
            if (nestedSecretFields) {
                Object.keys(processedRelations).forEach(relationName => {
                    const relation = processedRelations[relationName];
                    const secretFieldsForRelation = nestedSecretFields[relationName];
                    if (secretFieldsForRelation && relation !== true) {
                        // If relation has select, filter out secret fields
                        if (relation.select) {
                            secretFieldsForRelation.forEach(field => {
                                delete relation.select[field];
                            });
                        }
                    }
                });
            }
            this.includeRelations = processedRelations;
        }
        return this;
    }
    /**
     * Execute the query and return data
     * Combines base query with user filters
     * Removes secret fields from output
     *
     * @returns Array of data
     */
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            // Combine base query (priority) with user filters
            let finalWhereClause = {};
            if (Object.keys(this.baseWhereClause).length > 0 &&
                Object.keys(this.whereClause).length > 0) {
                // Both base and user filters exist - combine with AND
                finalWhereClause = {
                    AND: [this.baseWhereClause, this.whereClause]
                };
            }
            else if (Object.keys(this.baseWhereClause).length > 0) {
                // Only base query
                finalWhereClause = this.baseWhereClause;
            }
            else if (Object.keys(this.whereClause).length > 0) {
                // Only user filters
                finalWhereClause = this.whereClause;
            }
            const queryOptions = {
                where: Object.keys(finalWhereClause).length > 0 ? finalWhereClause : undefined,
                orderBy: this.orderBy.length > 0 ? this.orderBy : undefined,
                skip: this.skipValue,
                take: this.takeValue
            };
            if (this.selectFields && !this.includeRelations) {
                queryOptions.select = this.selectFields;
            }
            if (this.includeRelations) {
                queryOptions.include = this.includeRelations;
            }
            let data = yield this.prismaModel.findMany(queryOptions);
            // Remove secret fields from output (post-processing for security)
            if (this.secretFields.length > 0) {
                data = this.removeSecretFields(data, this.secretFields);
            }
            return data;
        });
    }
    /**
     * Remove secret fields from data recursively (handles nested objects)
     * @param data - Data to process
     * @param secretFields - Fields to remove
     * @returns Cleaned data
     */
    removeSecretFields(data, secretFields) {
        if (Array.isArray(data)) {
            return data.map(item => this.removeSecretFields(item, secretFields));
        }
        // ✅ IMPORTANT: Preserve Date objects
        if (data instanceof Date) {
            return data;
        }
        if (data && typeof data === 'object') {
            const cleaned = {};
            Object.keys(data).forEach(key => {
                if (!secretFields.includes(key)) {
                    cleaned[key] = this.removeSecretFields(data[key], secretFields);
                }
            });
            return cleaned;
        }
        return data;
    }
    /**
     * Get pagination metadata
     * Uses combined WHERE clause (base + user filters)
     *
     * @returns Object with pagination metadata
     */
    countTotal() {
        return __awaiter(this, void 0, void 0, function* () {
            const page = Number(this.query.page) || 1;
            const limit = Number(this.query.limit) || 10;
            // Combine base query with user filters for counting
            let finalWhereClause = {};
            if (Object.keys(this.baseWhereClause).length > 0 &&
                Object.keys(this.whereClause).length > 0) {
                finalWhereClause = {
                    AND: [this.baseWhereClause, this.whereClause]
                };
            }
            else if (Object.keys(this.baseWhereClause).length > 0) {
                finalWhereClause = this.baseWhereClause;
            }
            else if (Object.keys(this.whereClause).length > 0) {
                finalWhereClause = this.whereClause;
            }
            const totalData = yield this.prismaModel.count({
                where: Object.keys(finalWhereClause).length > 0 ? finalWhereClause : undefined
            });
            const totalPage = Math.ceil(totalData / limit);
            return {
                page,
                limit,
                totalData,
                totalPage
            };
        });
    }
}
exports.default = PrismaQueryBuilder;
