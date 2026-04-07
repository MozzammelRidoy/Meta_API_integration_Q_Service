"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdInsights_Validation = void 0;
const zod_1 = require("zod");
const store_adInsights_ValidationZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        campaign_ids: zod_1.z
            .array(zod_1.z.string({ required_error: 'campaign_ids is required' }))
            .min(1, { message: 'Minimum 1 campaign_id is required' })
            .nonempty({ message: 'campaign_ids is required' }),
        date: zod_1.z
            .string({ required_error: 'date is required' })
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format')
    })
});
exports.AdInsights_Validation = { store_adInsights_ValidationZodSchema };
