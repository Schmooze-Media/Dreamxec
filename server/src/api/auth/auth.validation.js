const { z } = require("zod");

exports.registerSchema = z.object({
  body: z.object({
    email: z.string().email("Not a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    name: z.string().min(2, "Name must be at least 2 characters long"),
    role: z.enum(["USER", "DONOR", "ADMIN"]).optional(),
    organizationName: z.string().optional(),
    institutionName: z.string().optional(),
    institutionAicteId: z.string().optional(),
    institutionState: z.string().optional(),
  }),
});

exports.loginSchema = z.object({
  body: z.object({
    email: z.string().email("Not a valid email"),
    password: z.string().min(1, "Password is required"),
  }),
});

exports.forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Not a valid email"),
  }),
});

exports.resetPasswordSchema = z.object({
  body: z.object({
    password: z.string().min(8, "Password must be at least 8 characters long"),
  }),
});
