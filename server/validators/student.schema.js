const { z } = require('zod');

const studentSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    studentId: z.string().optional().nullable(),
    email: z.string().email().optional().nullable(),
    phone: z.string().optional().nullable(),
    year: z.number().int().min(1).max(4).optional().nullable(),
    semester: z.number().int().min(1).max(8).optional().nullable(),
    attendance: z.number().min(0).max(100).optional().nullable(),

    janAtt: z.number().min(0).max(100).optional().nullable(),
    febAtt: z.number().min(0).max(100).optional().nullable(),
    marAtt: z.number().min(0).max(100).optional().nullable(),
    aprAtt: z.number().min(0).max(100).optional().nullable(),
    mayAtt: z.number().min(0).max(100).optional().nullable(),
    junAtt: z.number().min(0).max(100).optional().nullable(),
    julAtt: z.number().min(0).max(100).optional().nullable(),
    augAtt: z.number().min(0).max(100).optional().nullable(),
    sepAtt: z.number().min(0).max(100).optional().nullable(),
    octAtt: z.number().min(0).max(100).optional().nullable(),
    novAtt: z.number().min(0).max(100).optional().nullable(),
    decAtt: z.number().min(0).max(100).optional().nullable(),

    customData: z.any().optional()
});

module.exports = { studentSchema };