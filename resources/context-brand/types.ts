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
  domain: z.string().describe("Brand domain."),
  title: z.string().describe("Brand name."),
  slogan: z.string().optional().describe("Slogan."),
  description: z.string().optional().describe("Description."),
  logo: z.string().optional().describe("Logo URL, or the icon when there is no logo."),
  colors: z.array(colorSchema).describe("Colors: hex and optional name."),
  socials: z.array(socialSchema).describe("Social profiles: type and url."),
  industries: z.array(industrySchema).describe("Industries: industry and optional subindustry."),
  links: z.array(linkSchema).describe("Key links, such as pricing and careers: label and url."),
  email: z.string().optional().describe("Contact email."),
  phone: z.string().optional().describe("Contact phone."),
  location: z.string().optional().describe("City, region, and country."),
  stockTicker: z.string().optional().describe("Exchange and ticker, such as NASDAQ: AAPL."),
});

export const propSchema = z.object({ brand: brandSchema });

export type Color = z.infer<typeof colorSchema>;
export type Social = z.infer<typeof socialSchema>;
export type Industry = z.infer<typeof industrySchema>;
export type LinkItem = z.infer<typeof linkSchema>;
export type Brand = z.infer<typeof brandSchema>;
export type ContextBrandProps = z.infer<typeof propSchema>;
