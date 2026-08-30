import { randomUUID, randomBytes, createHash } from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { upload } from "../lib/uploads";
import { sendOrderConfirmationEmail, sendPasswordResetEmail } from "../lib/mailer";
import {
  db,
  adminTable,
  orderItemsTable,
  ordersTable,
  productsTable,
  type NewOrderItem,
} from "@workspace/db";
import {
  AdminLoginBody,
  ChangeAdminPasswordBody,
  ChangeAdminPasswordResponse,
  ForgotAdminPasswordBody,
  ForgotAdminPasswordResponse,
  ResetAdminPasswordBody,
  ResetAdminPasswordResponse,
  CreateOrderBody,
  CreateProductBody,
  CreateProductResponse,
  CreateOrderResponse,
  DeleteOrderParams,
  DeleteOrderResponse,
  DeleteProductParams,
  DeleteProductResponse,
  GetAdminSessionResponse,
  GetAdminStatsResponse,
  GetOrderParams,
  GetOrderResponse,
  GetProductParams,
  GetProductResponse,
  ListAdminProductsResponse,
  ListOrdersQueryParams,
  ListOrdersResponse,
  ListProductsQueryParams,
  ListProductsResponse,
  AdminLoginResponse,
  AdminLogoutResponse,
  UpdateOrderStatusBody,
  UpdateOrderStatusParams,
  UpdateOrderStatusResponse,
  UpdateProductBody,
  UpdateProductParams,
  UpdateProductResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const sessions = new Set<string>();
const cookieName = "rh_admin_session";
const seedAdminUsername = process.env.ADMIN_USERNAME ?? "admin";
const seedAdminPassword = process.env.ADMIN_PASSWORD ?? "123456";
const seedAdminEmail = process.env.GMAIL_USER ?? "";
let seedChecked = false;
let adminSeeded = false;

const ensureAdminSeeded = async () => {
  if (adminSeeded) return;
  const [existing] = await db.select().from(adminTable).limit(1);
  if (!existing) {
    const passwordHash = await bcrypt.hash(seedAdminPassword, 10);
    await db.insert(adminTable).values({
      username: seedAdminUsername,
      passwordHash,
      email: seedAdminEmail,
    });
  }
  adminSeeded = true;
};

const getAdmin = async () => {
  await ensureAdminSeeded();
  const [admin] = await db.select().from(adminTable).limit(1);
  return admin ?? null;
};

const readSession = (req: Request) => {
  const raw = req.headers.cookie?.match(
    new RegExp(`${cookieName}=([^;]+)`),
  )?.[1];
  return raw && sessions.has(raw) ? raw : null;
};

const requireAdmin = (req: Request, res: Response): boolean => {
  if (readSession(req)) return true;
  res.status(401).json({ error: "Authentication required" });
  return false;
};

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const mapProduct = (product: typeof productsTable.$inferSelect) => ({
  ...product,
  sku: product.sku ?? null,
  compareAtPrice: product.compareAtPrice ?? null,
  images: product.images ?? [],
  specs: product.specs ?? {},
  sizes: product.sizes ?? [],
  colors: product.colors ?? [],
  colorImages: Object.fromEntries(
    Object.entries(product.colorImages ?? {}).map(([color, value]) => [
      color,
      Array.isArray(value) ? value : [value as unknown as string],
    ]),
  ),
  variants: product.variants ?? {},
});

const variantKey = (size: string, color: string) => `${size} ${color}`;

const ensureSeedProducts = async () => {
  if (seedChecked) return;
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(productsTable);
  if (Number(count) === 0) {
    await db.insert(productsTable).values([
      {
        name: "Royal M139 Kính Âm",
        slug: "royal-m139-kinh-am",
        sku: "M139-BLK",
        category: "3/4",
        price: 485000,
        compareAtPrice: 560000,
        thumbnail: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=85",
        images: [
          "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=85",
          "https://images.unsplash.com/photo-1558980664-10e7170d03c9?auto=format&fit=crop&w=900&q=85",
        ],
        description: "Thiết kế 3/4 thanh lịch với kính âm tiện dụng, lớp lót êm và form đội vừa vặn.",
        specs: { "Loại mũ": "3/4", "Chất liệu": "ABS nguyên sinh", "Kính": "Kính âm chống tia UV", "Trọng lượng": "Khoảng 1.2kg" },
        sizes: ["M", "L", "XL"],
        colors: ["Đen nhám", "Trắng", "Xám"],
        stock: 18,
        warranty: "Bảo hành chính hãng 12 tháng",
        featured: true,
        bestseller: true,
        isNew: false,
      },
      {
        name: "Royal M20C Carbon",
        slug: "royal-m20c-carbon",
        sku: "M20C-CBN",
        category: "fullface",
        price: 1190000,
        compareAtPrice: 1390000,
        thumbnail: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=900&q=85",
        images: ["https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=900&q=85"],
        description: "Fullface mạnh mẽ cho những cung đường dài, tối ưu bảo vệ và khả năng thông gió.",
        specs: { "Loại mũ": "Fullface", "Chất liệu": "Sợi carbon tổng hợp", "Kính": "Kính trong chống xước", "Trọng lượng": "Khoảng 1.45kg" },
        sizes: ["M", "L", "XL"],
        colors: ["Carbon", "Đen bóng"],
        stock: 9,
        warranty: "Bảo hành chính hãng 12 tháng",
        featured: true,
        bestseller: true,
        isNew: true,
      },
      {
        name: "Royal M01 Classic",
        slug: "royal-m01-classic",
        sku: "M01-CRM",
        category: "1/2",
        price: 265000,
        compareAtPrice: 310000,
        thumbnail: "https://images.unsplash.com/photo-1558980664-10e7170d03c9?auto=format&fit=crop&w=900&q=85",
        images: ["https://images.unsplash.com/photo-1558980664-10e7170d03c9?auto=format&fit=crop&w=900&q=85"],
        description: "Mũ 1/2 gọn nhẹ cho di chuyển hàng ngày, phối màu cổ điển dễ dùng.",
        specs: { "Loại mũ": "1/2", "Chất liệu": "ABS nguyên sinh", "Kính": "Không kính", "Trọng lượng": "Khoảng 850g" },
        sizes: ["M", "L"],
        colors: ["Kem", "Đen", "Xanh rêu"],
        stock: 24,
        warranty: "Bảo hành chính hãng 12 tháng",
        featured: false,
        bestseller: true,
        isNew: false,
      },
      {
        name: "Royal M268 Neo",
        slug: "royal-m268-neo",
        sku: "M268-NEO",
        category: "3/4",
        price: 620000,
        compareAtPrice: null,
        thumbnail: "https://images.unsplash.com/photo-1558980394-0c82c3d2f2d2?auto=format&fit=crop&w=900&q=85",
        images: ["https://images.unsplash.com/photo-1558980394-0c82c3d2f2d2?auto=format&fit=crop&w=900&q=85"],
        description: "Form 3/4 hiện đại với kính dài, phù hợp cả phố thị lẫn những chuyến đi cuối tuần.",
        specs: { "Loại mũ": "3/4", "Chất liệu": "ABS nguyên sinh", "Kính": "Kính dài chống UV", "Trọng lượng": "Khoảng 1.25kg" },
        sizes: ["M", "L", "XL"],
        colors: ["Xanh navy", "Đen nhám"],
        stock: 13,
        warranty: "Bảo hành chính hãng 12 tháng",
        featured: true,
        bestseller: false,
        isNew: true,
      },
      {
        name: "Royal M138 Urban",
        slug: "royal-m138-urban",
        sku: "M138-URB",
        category: "3/4",
        price: 395000,
        compareAtPrice: null,
        thumbnail: "https://images.unsplash.com/photo-1558981001-5864b3250a33?auto=format&fit=crop&w=900&q=85",
        images: ["https://images.unsplash.com/photo-1558981001-5864b3250a33?auto=format&fit=crop&w=900&q=85"],
        description: "Mũ đô thị cân bằng giữa sự nhẹ nhàng, thoáng khí và nét cá tính.",
        specs: { "Loại mũ": "3/4", "Chất liệu": "ABS nguyên sinh", "Kính": "Kính âm", "Trọng lượng": "Khoảng 1.1kg" },
        sizes: ["M", "L"],
        colors: ["Đỏ rượu", "Đen", "Trắng"],
        stock: 16,
        warranty: "Bảo hành chính hãng 12 tháng",
        featured: false,
        bestseller: false,
        isNew: true,
      },
      {
        name: "Royal M10 Touring",
        slug: "royal-m10-touring",
        sku: "M10-TOU",
        category: "fullface",
        price: 890000,
        compareAtPrice: 990000,
        thumbnail: "https://images.unsplash.com/photo-1558980394-dbb977039a86?auto=format&fit=crop&w=900&q=85",
        images: ["https://images.unsplash.com/photo-1558980394-dbb977039a86?auto=format&fit=crop&w=900&q=85"],
        description: "Fullface touring với lớp lót tháo rời, ôm đầu và sẵn sàng cho hành trình xa.",
        specs: { "Loại mũ": "Fullface", "Chất liệu": "ABS nguyên sinh", "Kính": "Kính chống xước", "Trọng lượng": "Khoảng 1.5kg" },
        sizes: ["L", "XL", "2XL"],
        colors: ["Đen nhám", "Xám xi măng"],
        stock: 7,
        warranty: "Bảo hành chính hãng 12 tháng",
        featured: false,
        bestseller: false,
        isNew: true,
      },
    ]);
  }
  seedChecked = true;
};

const getOrder = async (id: number) => {
  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, id));
  if (!order) return null;
  const items = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, id));
  return {
    ...order,
    note: order.note ?? "",
    items: items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      price: item.price,
      quantity: item.quantity,
      size: item.size ?? null,
      color: item.color ?? null,
    })),
  };
};

router.get("/products", async (req, res): Promise<void> => {
  await ensureSeedProducts();
  const parsed = ListProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { q, category, sort, featured, limit } = parsed.data;
  const filters = [];
  if (q) {
    filters.push(
      or(
        ilike(productsTable.name, `%${q}%`),
        ilike(productsTable.description, `%${q}%`),
      ),
    );
  }
  if (category) filters.push(eq(productsTable.category, category));
  if (featured !== undefined) filters.push(eq(productsTable.featured, featured));
  const rows = await db
    .select()
    .from(productsTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(
      sort === "price-asc"
        ? asc(productsTable.price)
        : sort === "price-desc"
          ? desc(productsTable.price)
          : sort === "featured"
            ? desc(productsTable.featured)
            : desc(productsTable.createdAt),
    )
    .limit(limit);
  res.json(ListProductsResponse.parse(rows.map(mapProduct)));
});

router.get("/products/:slug", async (req, res): Promise<void> => {
  await ensureSeedProducts();
  const parsed = GetProductParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.slug, parsed.data.slug));
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(GetProductResponse.parse(mapProduct(product)));
});

const SITE_URL = process.env.SITE_URL ?? "https://royalhelmetquangtri.io.vn";

const xmlEscape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

const absoluteUrl = (url: string) => (url.startsWith("http") ? url : `${SITE_URL}${url}`);

router.get("/feed.xml", async (_req, res): Promise<void> => {
  await ensureSeedProducts();
  const rows = await db.select().from(productsTable).orderBy(desc(productsTable.createdAt));
  const items = rows
    .map(mapProduct)
    .filter((p) => p.thumbnail)
    .map((p) => {
      const description = xmlEscape((p.description || p.name).replace(/\s+/g, " ").trim().slice(0, 5000));
      return `  <item>
    <g:id>${p.id}</g:id>
    <title>${xmlEscape(p.name)}</title>
    <description>${description}</description>
    <link>${SITE_URL}/p/${p.slug}</link>
    <g:image_link>${absoluteUrl(p.thumbnail)}</g:image_link>
    <g:availability>${p.stock > 0 ? "in_stock" : "out_of_stock"}</g:availability>
    <g:price>${Math.round(p.price)} VND</g:price>
    <g:condition>new</g:condition>
    <g:brand>Royal</g:brand>
    <g:google_product_category>Apparel &amp; Accessories &gt; Clothing Accessories &gt; Helmets</g:google_product_category>
  </item>`;
    })
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>Royal Helmet Quảng Trị</title>
  <link>${SITE_URL}</link>
  <description>Mũ bảo hiểm Royal chính hãng tại Đông Hà, Quảng Trị</description>
${items}
</channel>
</rss>`;
  res.type("application/xml").send(xml);
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const requestedIds = [...new Set(parsed.data.items.map((item) => item.productId))];
  const products = await db
    .select()
    .from(productsTable)
    .where(sql`${productsTable.id} in ${requestedIds}`);
  const productById = new Map(products.map((product) => [product.id, product]));
  let total = 0;
  const lineItems: Omit<NewOrderItem, "orderId">[] = [];
  for (const item of parsed.data.items) {
    const product = productById.get(item.productId);
    if (!product) {
      res.status(400).json({ error: `Product ${item.productId} not found` });
      return;
    }
    const key = item.size && item.color ? variantKey(item.size, item.color) : null;
    const variantStock = key ? product.variants?.[key] : undefined;
    const availableStock = variantStock !== undefined ? variantStock : product.stock;
    if (availableStock < item.quantity) {
      const variantLabel = item.size && item.color ? ` (size ${item.size}, màu ${item.color})` : "";
      res.status(400).json({ error: `${product.name}${variantLabel} không đủ tồn kho` });
      return;
    }
    total += product.price * item.quantity;
    lineItems.push({
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity: item.quantity,
      size: item.size ?? null,
      color: item.color ?? null,
    });
  }
  const result = await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(ordersTable)
      .values({
        customerName: parsed.data.customerName,
        phone: parsed.data.phone,
        email: parsed.data.email ?? "",
        address: parsed.data.address,
        note: parsed.data.note ?? "",
        paymentMethod: parsed.data.paymentMethod ?? "cod",
        total,
        status: "new",
      })
      .returning();
    await tx.insert(orderItemsTable).values(
      lineItems.map((item) => ({ ...item, orderId: order.id })),
    );
    const stockUpdates = new Map<number, { stock: number; variants: Record<string, number> }>();
    for (const item of parsed.data.items) {
      const product = productById.get(item.productId)!;
      if (!stockUpdates.has(product.id)) {
        stockUpdates.set(product.id, { stock: product.stock, variants: { ...(product.variants ?? {}) } });
      }
      const state = stockUpdates.get(product.id)!;
      const key = item.size && item.color ? variantKey(item.size, item.color) : null;
      if (key && state.variants[key] !== undefined) {
        state.variants[key] -= item.quantity;
      }
      state.stock -= item.quantity;
    }
    for (const [productId, state] of stockUpdates) {
      await tx
        .update(productsTable)
        .set({ stock: state.stock, variants: state.variants })
        .where(eq(productsTable.id, productId));
    }
    return order;
  });
  if (result.email) {
    void sendOrderConfirmationEmail({
      orderId: result.id,
      customerName: result.customerName,
      email: result.email,
      phone: result.phone,
      address: result.address,
      total: result.total,
      paymentMethod: result.paymentMethod,
      items: lineItems,
    });
  }
  res.status(201).json(
    CreateOrderResponse.parse({
      orderId: result.id,
      total: result.total,
      status: result.status,
    }),
  );
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const admin = await getAdmin();
  const passwordOk = admin ? await bcrypt.compare(parsed.data.password, admin.passwordHash) : false;
  if (!admin || parsed.data.username !== admin.username || !passwordOk) {
    res.status(401).json({ error: "Sai tên đăng nhập hoặc mật khẩu" });
    return;
  }
  const session = randomUUID();
  sessions.add(session);
  res.setHeader(
    "Set-Cookie",
    `${cookieName}=${session}; HttpOnly; Path=/; SameSite=Lax; Max-Age=86400`,
  );
  res.json(AdminLoginResponse.parse({ authenticated: true, username: admin.username }));
});

router.post("/auth/logout", async (_req, res): Promise<void> => {
  res.setHeader(
    "Set-Cookie",
    `${cookieName}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`,
  );
  res.json(AdminLogoutResponse.parse({ success: true }));
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const authenticated = Boolean(readSession(req));
  const admin = authenticated ? await getAdmin() : null;
  res.json(
    GetAdminSessionResponse.parse({
      authenticated,
      username: admin?.username ?? "",
    }),
  );
});

router.post("/auth/change-password", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  const parsed = ChangeAdminPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const admin = await getAdmin();
  if (!admin) {
    res.status(400).json({ error: "Không tìm thấy tài khoản quản trị" });
    return;
  }
  const currentOk = await bcrypt.compare(parsed.data.currentPassword, admin.passwordHash);
  if (!currentOk) {
    res.status(400).json({ error: "Mật khẩu hiện tại không đúng" });
    return;
  }
  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await db.update(adminTable).set({ passwordHash, updatedAt: new Date() }).where(eq(adminTable.id, admin.id));
  res.json(ChangeAdminPasswordResponse.parse({ success: true }));
});

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const parsed = ForgotAdminPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const admin = await getAdmin();
  if (admin?.email) {
    const rawToken = randomBytes(32).toString("hex");
    const resetTokenHash = createHash("sha256").update(rawToken).digest("hex");
    const resetTokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await db
      .update(adminTable)
      .set({ resetTokenHash, resetTokenExpiresAt, updatedAt: new Date() })
      .where(eq(adminTable.id, admin.id));
    const resetUrl = `${parsed.data.origin}/admin/reset-password?token=${rawToken}`;
    void sendPasswordResetEmail(admin.email, resetUrl);
  }
  res.json(ForgotAdminPasswordResponse.parse({ success: true }));
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const parsed = ResetAdminPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const admin = await getAdmin();
  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const tokenValid =
    admin?.resetTokenHash === tokenHash &&
    admin.resetTokenExpiresAt &&
    admin.resetTokenExpiresAt.getTime() > Date.now();
  if (!admin || !tokenValid) {
    res.status(400).json({ error: "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn" });
    return;
  }
  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await db
    .update(adminTable)
    .set({ passwordHash, resetTokenHash: null, resetTokenExpiresAt: null, updatedAt: new Date() })
    .where(eq(adminTable.id, admin.id));
  res.json(ResetAdminPasswordResponse.parse({ success: true }));
});

router.get("/admin/stats", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  const [productCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(productsTable);
  const [orderCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(ordersTable);
  const [newOrderCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(ordersTable)
    .where(eq(ordersTable.status, "new"));
  const [revenue] = await db
    .select({ total: sql<number>`coalesce(sum(${ordersTable.total}), 0)` })
    .from(ordersTable)
    .where(sql`${ordersTable.status} <> 'cancelled'`);
  res.json(
    GetAdminStatsResponse.parse({
      productCount: Number(productCount.count),
      orderCount: Number(orderCount.count),
      newOrderCount: Number(newOrderCount.count),
      revenue: Number(revenue.total),
    }),
  );
});

router.get("/admin/products", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  await ensureSeedProducts();
  const rows = await db.select().from(productsTable).orderBy(desc(productsTable.createdAt));
  res.json(ListAdminProductsResponse.parse(rows.map(mapProduct)));
});

router.post("/admin/upload", (req, res): void => {
  if (!requireAdmin(req, res)) return;
  upload.array("images", 12)(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : "Tải ảnh thất bại" });
      return;
    }
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const urls = files.map((file) => `/uploads/${file.filename}`);
    res.status(201).json({ urls });
  });
});

router.post("/admin/products", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const baseSlug = slugify(parsed.data.name);
  const slug = `${baseSlug}-${Date.now().toString(36)}`;
  const [product] = await db
    .insert(productsTable)
    .values({
      ...parsed.data,
      slug,
      images: parsed.data.images ?? [parsed.data.thumbnail],
      specs: parsed.data.specs ?? {},
      sizes: parsed.data.sizes ?? [],
      colors: parsed.data.colors ?? [],
      colorImages: parsed.data.colorImages ?? {},
      variants: parsed.data.variants ?? {},
      stock: parsed.data.stock ?? 0,
      warranty: parsed.data.warranty ?? "Bảo hành chính hãng 12 tháng",
      featured: parsed.data.featured ?? false,
      bestseller: parsed.data.bestseller ?? false,
      isNew: parsed.data.isNew ?? true,
    })
    .returning();
  res.status(201).json(CreateProductResponse.parse(mapProduct(product)));
});

router.patch("/admin/products/:id", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  const params = UpdateProductParams.safeParse(req.params);
  const parsed = UpdateProductBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Dữ liệu sản phẩm không hợp lệ" });
    return;
  }
  const [product] = await db
    .update(productsTable)
    .set({
      ...parsed.data,
      images: parsed.data.images ?? [parsed.data.thumbnail],
      specs: parsed.data.specs ?? {},
      sizes: parsed.data.sizes ?? [],
      colors: parsed.data.colors ?? [],
      colorImages: parsed.data.colorImages ?? {},
      variants: parsed.data.variants ?? {},
      updatedAt: new Date(),
    })
    .where(eq(productsTable.id, params.data.id))
    .returning();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(UpdateProductResponse.parse(mapProduct(product)));
});

router.delete("/admin/products/:id", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [product] = await db
    .delete(productsTable)
    .where(eq(productsTable.id, params.data.id))
    .returning();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(DeleteProductResponse.parse({ success: true }));
});

router.get("/admin/orders", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  const parsed = ListOrdersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const rows = await db
    .select()
    .from(ordersTable)
    .where(parsed.data.status ? eq(ordersTable.status, parsed.data.status) : undefined)
    .orderBy(desc(ordersTable.createdAt));
  const orders = await Promise.all(rows.map((order) => getOrder(order.id)));
  res.json(ListOrdersResponse.parse(orders.filter(Boolean)));
});

router.get("/admin/orders/:id", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  const parsed = GetOrderParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const order = await getOrder(parsed.data.id);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(GetOrderResponse.parse(order));
});

router.patch("/admin/orders/:id", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  const params = UpdateOrderStatusParams.safeParse(req.params);
  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!params.success || !parsed.success || (!parsed.data.status && !parsed.data.paymentStatus)) {
    res.status(400).json({ error: "Trạng thái đơn hàng không hợp lệ" });
    return;
  }
  const [updated] = await db
    .update(ordersTable)
    .set({
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(parsed.data.paymentStatus ? { paymentStatus: parsed.data.paymentStatus } : {}),
      updatedAt: new Date(),
    })
    .where(eq(ordersTable.id, params.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const order = await getOrder(updated.id);
  res.json(UpdateOrderStatusResponse.parse(order));
});

router.delete("/admin/orders/:id", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  const params = DeleteOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [order] = await db
    .delete(ordersTable)
    .where(eq(ordersTable.id, params.data.id))
    .returning();
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(DeleteOrderResponse.parse({ success: true }));
});

export default router;