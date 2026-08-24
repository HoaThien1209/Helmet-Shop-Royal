import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const productsTable = pgTable("rh_products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  sku: text("sku"),
  category: text("category").notNull(),
  price: integer("price").notNull().default(0),
  compareAtPrice: integer("compare_at_price"),
  thumbnail: text("thumbnail").notNull(),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  description: text("description").notNull().default(""),
  specs: jsonb("specs").$type<Record<string, string>>().notNull().default({}),
  sizes: jsonb("sizes").$type<string[]>().notNull().default([]),
  colors: jsonb("colors").$type<string[]>().notNull().default([]),
  colorImages: jsonb("color_images").$type<Record<string, string[]>>().notNull().default({}),
  variants: jsonb("variants").$type<Record<string, number>>().notNull().default({}),
  stock: integer("stock").notNull().default(0),
  warranty: text("warranty").notNull().default("Bảo hành chính hãng"),
  featured: boolean("featured").notNull().default(false),
  bestseller: boolean("bestseller").notNull().default(false),
  isNew: boolean("is_new").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Product = typeof productsTable.$inferSelect;
export type NewProduct = typeof productsTable.$inferInsert;