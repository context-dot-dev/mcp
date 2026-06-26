import { z } from "zod";

// ---- Shapes shared between the tool's outputSchema and the widget props ----

export const colorSchema = z.object({
  hex: z.string(),
  name: z.string().optional(),
});

export const logoSchema = z.object({
  url: z.string(),
  type: z.string().optional(), // "icon" | "logo"
  mode: z.string().optional(), // "light" | "dark" | "has_opaque_background"
});

export const socialSchema = z.object({
  type: z.string(),
  url: z.string(),
});

export const industrySchema = z.object({
  industry: z.string(),
  subindustry: z.string().optional(),
});

export const linkSchema = z.object({
  label: z.string(),
  url: z.string(),
});

export const brandSchema = z.object({
  domain: z.string(),
  title: z.string(),
  slogan: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().optional(), // best logo url
  colors: z.array(colorSchema),
  socials: z.array(socialSchema),
  industries: z.array(industrySchema),
  links: z.array(linkSchema),
  email: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  stockTicker: z.string().optional(),
  creditsRemaining: z.number().optional(),
});

export const propSchema = z.object({ brand: brandSchema });

export type Color = z.infer<typeof colorSchema>;
export type Social = z.infer<typeof socialSchema>;
export type Industry = z.infer<typeof industrySchema>;
export type LinkItem = z.infer<typeof linkSchema>;
export type Brand = z.infer<typeof brandSchema>;
export type ContextBrandProps = z.infer<typeof propSchema>;
