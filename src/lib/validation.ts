import { z } from 'zod';

// User validation schemas
export const userSchema = z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
    email: z.string().email('Invalid email address'),
    role: z.enum(['admin', 'manager', 'employee']),
    teamId: z.string().optional(),
});

export const signUpSchema = z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
    email: z.string().email('Invalid email address'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    role: z.enum(['admin', 'manager', 'employee']).default('employee'),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

// Task validation schemas
export const taskSchema = z.object({
    title: z.string()
        .min(3, 'Title must be at least 3 characters')
        .max(200, 'Title is too long'),
    description: z.string()
        .min(10, 'Description must be at least 10 characters')
        .max(2000, 'Description is too long'),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    status: z.enum(['assigned', 'in_progress', 'blocked', 'completed']),
    dueDate: z.coerce.date(),
    assignedTo: z.array(z.string().email()).min(1, 'At least one assignee is required'),
    kraId: z.string().optional(),
    attachments: z.array(z.string().url()).optional(),
});

export const taskUpdateSchema = taskSchema.partial();

export const checklistItemSchema = z.object({
    text: z.string().min(1, 'Checklist item cannot be empty').max(500, 'Text is too long'),
    completed: z.boolean().default(false),
});

// KRA validation schemas
export const kraSchema = z.object({
    title: z.string()
        .min(3, 'Title must be at least 3 characters')
        .max(200, 'Title is too long'),
    description: z.string()
        .min(10, 'Description must be at least 10 characters')
        .max(2000, 'Description is too long'),
    target: z.string().max(500, 'Target description is too long').optional(),
    type: z.enum(['daily', 'weekly', 'monthly']),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    status: z.enum(['not_started', 'in_progress', 'completed']).default('not_started'),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    assignedTo: z.array(z.string().email()).min(1, 'At least one assignee is required'),
    attachments: z.array(z.string().url()).optional(),
}).refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
});

export const kraUpdateSchema = kraSchema.partial();

// Team validation schemas
export const teamSchema = z.object({
    name: z.string().min(2, 'Team name must be at least 2 characters').max(100, 'Name is too long'),
    description: z.string().max(500, 'Description is too long').optional(),
    managerId: z.string().min(1, 'Manager is required'),
    memberIds: z.array(z.string()).min(1, 'At least one member is required'),
});

// Comment validation schema
export const commentSchema = z.object({
    text: z.string()
        .min(1, 'Comment cannot be empty')
        .max(1000, 'Comment is too long'),
});

// Scoring configuration validation
export const scoringConfigSchema = z.object({
    completionWeight: z.number().min(0).max(100),
    timelinessWeight: z.number().min(0).max(100),
    qualityWeight: z.number().min(0).max(100),
    kraAlignmentWeight: z.number().min(0).max(100),
}).refine((data) => {
    const total = data.completionWeight + data.timelinessWeight + data.qualityWeight + data.kraAlignmentWeight;
    return total === 100;
}, {
    message: 'Weights must total 100%',
});

// Search and filter validation
export const searchQuerySchema = z.object({
    query: z.string().max(200, 'Search query is too long').optional(),
    status: z.enum(['all', 'assigned', 'in_progress', 'blocked', 'completed']).optional(),
    priority: z.enum(['all', 'low', 'medium', 'high', 'critical']).optional(),
    assignedTo: z.string().optional(),
    dateFrom: z.date().optional(),
    dateTo: z.date().optional(),
}).refine((data) => {
    if (data.dateFrom && data.dateTo) {
        return data.dateTo >= data.dateFrom;
    }
    return true;
}, {
    message: 'End date must be after start date',
    path: ['dateTo'],
});

// Reassignment validation
export const reassignmentSchema = z.object({
    newAssignees: z.array(z.string().email()).min(1, 'At least one assignee is required'),
    reason: z.string().max(500, 'Reason is too long').optional(),
});

// Helper function to validate data
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
    try {
        const validatedData = schema.parse(data);
        return { success: true, data: validatedData };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errors = error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
            return { success: false, errors };
        }
        return { success: false, errors: ['Validation failed'] };
    }
}

// Helper function for safe parsing
export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown) {
    return schema.safeParse(data);
}

// Type exports
export type UserInput = z.infer<typeof userSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
export type KRAInput = z.infer<typeof kraSchema>;
export type KRAUpdateInput = z.infer<typeof kraUpdateSchema>;
export type TeamInput = z.infer<typeof teamSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type ScoringConfigInput = z.infer<typeof scoringConfigSchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type ReassignmentInput = z.infer<typeof reassignmentSchema>;
