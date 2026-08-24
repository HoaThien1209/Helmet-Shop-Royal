import { FormEvent, MouseEvent, useEffect, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight, BadgeCheck, Banknote, Check, ChevronDown, ChevronLeft, ChevronRight,
  CircleAlert, ClipboardList, CreditCard, Facebook, Filter, Flame, Heart, Instagram, KeyRound, LayoutDashboard,
  Eye, Loader2, LogOut, MapPin, Menu, MessageCircle, Moon, Package, Pencil, Phone, Plus, Search, ShieldCheck, ShoppingBag,
  ShoppingCart, Star, Sun, Trash2, Truck, UserRound, Wrench, X, ZoomIn,
} from "lucide-react";
import {
  useAdminLogin, useAdminLogout, useChangeAdminPassword, useForgotAdminPassword, useResetAdminPassword,
  useCreateOrder, useCreateProduct, useDeleteOrder, useDeleteProduct,
  useGetAdminSession, useGetAdminStats, useGetProduct, useListAdminProducts, useListOrders,
  useListProducts, useUpdateOrderStatus, useUpdateProduct,
  getGetAdminSessionQueryKey, getGetAdminStatsQueryKey, getListAdminProductsQueryKey,
  getListOrdersQueryKey, getListProductsQueryKey, type Order, type OrderInput,
  type Product, type ProductInput, type ListProductsParams,
} from "@workspace/api-client-react";
import { ErrorBoundary } from "@/components/error-boundary";
import NotFound from "@/pages/not-found";
import { useCart } from "@/lib/cart-store";
import { Route, Switch, Link, useLocation, useRoute, useSearch, Router as WouterRouter } from "wouter";

const queryClient = new QueryClient();
const money = (value: number) => new Intl.NumberFormat("vi-VN").format(value) + "đ";
const date = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
const imageFallback = "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=85";
const categories = [
  { value: "fullface", label: "Mũ Fullface", images: ["/img/categories/fullface-1.webp", "/img/categories/fullface-2.webp", "/img/categories/fullface-3.webp"] },
  { value: "3/4", label: "Mũ 3/4", images: ["/img/categories/threefour-1.webp", "/img/categories/threefour-2.webp", "/img/categories/threefour-3.webp"] },
  { value: "1/2", label: "Mũ 1/2", images: ["/img/categories/half-1.webp", "/img/categories/half-2.webp", "/img/categories/half-3.webp"] },
  { value: "kids", label: "Mũ trẻ em", images: ["/img/categories/kids-1.jpg", "/img/categories/kids-2.jpg", "/img/categories/kids-3.jpg"] },
  { value: "phu-kien", label: "Phụ kiện", images: ["/img/categories/accessories-1.jpg", "/img/categories/accessories-2.jpg", "/img/categories/accessories-3.jpg"] },
];

function BrandMark({ className = "brand-mark" }: { className?: string }) {
  return <svg viewBox="0 0 34 34" className={className} aria-hidden="true">
    <rect width="34" height="34" fill="#FBBF24" />
    <path d="M10 26 V8 H18 A6 6 0 0 1 21.5 18.5 L26 26 H21 L17.5 19 H14 V26 Z M14 11.5 V15.5 H17.5 A2 2 0 0 0 17.5 11.5 Z" fill="#1C1400" />
    <path d="M10 12.5 A8 5 0 0 1 24 12.5" stroke="#1C1400" strokeWidth="1.6" fill="none" opacity=".55" />
  </svg>;
}

function CategoryCard({ cat }: { cat: { value: string; label: string; images: string[] } }) {
  const [index, setIndex] = useState(0);
  const shift = (e: MouseEvent, dir: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i + dir + cat.images.length) % cat.images.length);
  };
  return (
    <Link href={`/products?category=${cat.value}`} className="category-card">
      {cat.images.map((src, i) => <img key={src} src={src} alt={cat.label} className={i === index ? "active" : ""} />)}
      {cat.images.length > 1 && <>
        <button type="button" className="category-nav prev" aria-label="Ảnh trước" onClick={(e) => shift(e, -1)}><ChevronLeft size={16} /></button>
        <button type="button" className="category-nav next" aria-label="Ảnh sau" onClick={(e) => shift(e, 1)}><ChevronRight size={16} /></button>
        <div className="category-dots">{cat.images.map((src, i) => <span key={src} className={i === index ? "active" : ""} />)}</div>
      </>}
      <div><span>{cat.label}</span><ArrowRight size={18} /></div>
    </Link>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <ErrorBoundary>
          <Switch>
            <Route path="/" component={() => <Storefront><Home /></Storefront>} />
            <Route path="/products" component={() => <Storefront><Catalog /></Storefront>} />
            <Route path="/p/:slug" component={() => <Storefront><ProductDetail /></Storefront>} />
            <Route path="/cart" component={() => <Storefront><CartPage /></Storefront>} />
            <Route path="/checkout" component={() => <Storefront><CartPage checkout /></Storefront>} />
            <Route path="/order-success/:id" component={() => <Storefront><OrderSuccess /></Storefront>} />
            <Route path="/policies" component={() => <Storefront><Policies /></Storefront>} />
            <Route path="/gioi-thieu" component={() => <Storefront><AboutPage /></Storefront>} />
            <Route path="/admin/login" component={AdminLogin} />
            <Route path="/admin/forgot-password" component={ForgotPassword} />
            <Route path="/admin/reset-password" component={ResetPassword} />
            <Route path="/admin" component={() => <AdminShell><Dashboard /></AdminShell>} />
            <Route path="/admin/products" component={() => <AdminShell><ProductAdmin /></AdminShell>} />
            <Route path="/admin/orders" component={() => <AdminShell><OrderAdmin /></AdminShell>} />
            <Route path="/admin/account" component={() => <AdminShell><AccountSettings /></AdminShell>} />
            <Route component={NotFound} />
          </Switch>
        </ErrorBoundary>
      </WouterRouter>
    </QueryClientProvider>
  );
}

const SHOP_PHONE = "0858925982";
const SHOP_PHONE_DISPLAY = "0858 925 982";
const SHOP_ADDRESS = "06 Lê Lợi - Đông Hà - Quảng Trị";
const ZALO_LINK = `https://zalo.me/${SHOP_PHONE}`;
const FACEBOOK_LINK = "https://m.me/dophuotdongha";
const SPEC_FIELDS = ["Trọng lượng", "Đạt chuẩn", "Vỏ", "Loại xốp", "Mũ lót", "Ốp tai", "Kính"];
const storeCategories = [
  { value: "", label: "Tất cả" },
  { value: "fullface", label: "Fullface" },
  { value: "3/4", label: "Nón 3/4" },
  { value: "1/2", label: "Nón 1/2" },
  { value: "kids", label: "Trẻ em" },
  { value: "phu-kien", label: "Phụ kiện" },
];

function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">(() => (localStorage.getItem("rh-theme") === "light" ? "light" : "dark"));
  useEffect(() => {
    const root = document.documentElement;
    // Some elements keep a CSS-transitioned property (e.g. button hover backgrounds) painted with
    // its stale value when the change comes from a custom-property cascade instead of a direct
    // style/pseudo-class match on that element. Freezing transitions for one frame during the
    // theme swap forces every element to repaint with the new colors immediately.
    root.classList.add("theme-switching");
    root.setAttribute("data-theme", theme);
    localStorage.setItem("rh-theme", theme);
    const id = requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("theme-switching")));
    return () => cancelAnimationFrame(id);
  }, [theme]);
  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  return { theme, toggle };
}

function Storefront({ children }: { children: React.ReactNode }) {
  const cart = useCart();
  const { theme, toggle: toggleTheme } = useTheme();
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onNavigate = () => {
      setMenu(false);
      clearTimeout(timer);
      if (!window.location.hash) {
        window.scrollTo(0, 0);
        return;
      }
      const id = window.location.hash.slice(1);
      timer = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    };
    onNavigate();
    const events = ["pushState", "replaceState", "popstate", "hashchange"];
    events.forEach((event) => window.addEventListener(event, onNavigate));
    return () => {
      clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, onNavigate));
    };
  }, []);
  return (
    <div className="site">
      <div className="announcement">
        <span><MapPin size={12} /> {SHOP_ADDRESS}</span>
        <span><Phone size={12} /> {SHOP_PHONE_DISPLAY}</span>
        <span>Tư vấn chọn size nhanh</span>
      </div>
      <header className="header">
        <div className="container header-inner">
          <button className="icon-button mobile-menu" onClick={() => setMenu(!menu)} aria-label="Mở menu"><Menu size={20} /></button>
          <Link href="/" className="brand"><BrandMark /><span><b>ROYAL</b><small>HELMET QUẢNG TRỊ</small></span></Link>
          <nav className={menu ? "nav open" : "nav"}>
            <Link href="/products">Sản phẩm</Link><Link href="/products?category=phu-kien">Phụ kiện</Link><Link href="/gioi-thieu">Giới thiệu</Link><Link href="/gioi-thieu#dich-vu">Dịch vụ</Link><Link href="/policies">Chính sách</Link>
          </nav>
          <div className="header-actions">
            <Link href="/products" className="icon-button" aria-label="Tìm kiếm"><Search size={20} strokeWidth={2.5} /></Link>
            <button type="button" className="icon-button theme-toggle" onClick={toggleTheme} aria-label={theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"} title={theme === "dark" ? "Giao diện sáng" : "Giao diện tối"}>{theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}</button>
            <Link href="/cart" className="cart-link" aria-label="Giỏ hàng"><ShoppingCart size={21} strokeWidth={2.5} /><span>{cart.count}</span></Link>
          </div>
        </div>
        <div className="category-bar">
          <div className="container category-bar-inner">
            {storeCategories.map((cat) => (
              <Link key={cat.value || "all"} href={cat.value ? `/products?category=${cat.value}` : "/products"} className="catPill">{cat.label}</Link>
            ))}
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="footer">
        <div className="container footer-grid">
          <div><Link href="/" className="brand footer-brand"><BrandMark /><span><b>ROYAL</b><small>HELMET QUẢNG TRỊ</small></span></Link><p>Mũ bảo hiểm chính hãng Royal, chọn chuẩn size, giao tận nơi tại Quảng Trị và toàn quốc.</p><div className="socials"><a href={FACEBOOK_LINK} target="_blank" rel="noopener" aria-label="Nhắn tin Facebook"><Facebook size={17} /></a><a href={ZALO_LINK} target="_blank" rel="noopener" aria-label="Zalo"><MessageCircle size={17} /></a></div></div>
          <div><h4>Mua hàng</h4><Link href="/products">Tất cả sản phẩm</Link><Link href="/products?sort=featured">Sản phẩm nổi bật</Link><Link href="/cart">Giỏ hàng</Link></div>
          <div><h4>Hỗ trợ</h4><Link href="/policies">Giao hàng & đổi size</Link><Link href="/policies#warranty">Bảo hành</Link><Link href="/policies#size">Hướng dẫn chọn size</Link></div>
          <div><h4>Liên hệ</h4><a href={`tel:${SHOP_PHONE}`}><Phone size={15} /> {SHOP_PHONE_DISPLAY}</a><p><MapPin size={15} /><span>{SHOP_ADDRESS}<br />Thứ 2 — Chủ nhật, 8:00 — 21:00</span></p></div>
        </div>
        <div className="container footer-bottom"><span>© 2026 Royal Helmet Quảng Trị</span><Link href="/admin/login">Quản trị viên</Link></div>
      </footer>
    </div>
  );
}

function Home() {
  const products = useQueryProducts({ limit: 100 });
  const featured = products.data?.filter((p) => p.featured).slice(0, 8) ?? [];
  const newItems = products.data?.filter((p) => p.isNew).slice(0, 8) ?? [];
  const bestsellers = products.data?.filter((p) => p.bestseller).slice(0, 8) ?? [];
  const accessories = products.data?.filter((p) => p.category === "phu-kien").slice(0, 4) ?? [];
  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="hero-frame">
            <img className="hero-bg" src="/img/hero-phuot.jpg" alt="Đồ phượt Quảng Trị" />
            <div className="hero-scrim"></div>
            <div className="hero-card animate-rise">
              <p className="eyebrow">ROYAL HELMET / QUẢNG TRỊ</p>
              <h1 className="hero-title">Bảo vệ điều <span>quan trọng.</span></h1>
              <p className="hero-lead">Chuyên mũ bảo hiểm <b>Royal chính hãng</b> – đầy đủ mẫu, nửa đầu, 3/4, fullface. Hỗ trợ <b>đổi size</b>, tư vấn đội mũ chuẩn – êm – an toàn. Ship nhanh toàn quốc.</p>
              <div className="hero-tags"><span>Royal chính hãng</span><span>Đổi size 7 ngày</span><span>Bảo hành 12 tháng</span></div>
              <div className="hero-actions"><Link href="/products" className="hero-btn hero-btn-accent">Khám phá sản phẩm <ArrowRight size={14} /></Link><a href={ZALO_LINK} target="_blank" rel="noopener" className="hero-btn hero-btn-ghost"><MessageCircle size={13} /> Chat Zalo</a></div>
            </div>
          </div>
        </div>
      </section>
      <section className="trust-strip"><div className="container trust-items"><div><ShieldCheck size={21} /><span><b>Chính hãng 100%</b><small>Kiểm tra nguồn gốc rõ ràng</small></span></div><div><Truck size={21} /><span><b>Giao hàng toàn quốc</b><small>Đóng gói cẩn thận, thu hộ COD</small></span></div><div><BadgeCheck size={21} /><span><b>Đổi size 7 ngày</b><small>Hỗ trợ tận tình sau khi nhận</small></span></div><div><Heart size={21} /><span><b>Tư vấn có tâm</b><small>Chọn đúng ngay từ lần đầu</small></span></div></div></section>
      <section className="section container"><div className="section-heading"><div><p className="eyebrow">BỘ SƯU TẬP</p><h2>Chọn theo phong cách</h2></div><Link href="/products" className="text-link">Xem tất cả <ArrowRight size={15} /></Link></div><div className="category-grid">{categories.map((cat) => <CategoryCard key={cat.value} cat={cat} />)}</div></section>
      <ProductSection eyebrow="BÁN CHẠY" title="Được khách hàng tin chọn" products={bestsellers} loading={products.isLoading} />
      <ProductSection eyebrow="ĐƯỢC YÊU THÍCH" title="Những lựa chọn nổi bật" products={featured} loading={products.isLoading} />
      <section className="editorial"><div className="container editorial-grid"><div><p className="eyebrow">CHỌN MŨ ĐÚNG — ĐI XA HƠN</p><h2>Chiếc mũ tốt<br /><em>là người bạn đường.</em></h2><p>Từ những chuyến đi hàng ngày đến cung đường cuối tuần, Royal mang đến sự cân bằng giữa an toàn, thoải mái và cá tính.</p><Link href="/policies" className="button button-light">Xem chính sách hậu mãi <ArrowRight size={17} /></Link></div><div className="editorial-note"><span>01</span><p>Không chọn mũ chỉ vì đẹp.<br /><b>Hãy chọn chiếc mũ vừa với bạn.</b></p><span>02</span><p>Không chạy theo giá rẻ.<br /><b>Hãy chọn sự an tâm.</b></p></div></div></section>
      <ProductSection eyebrow="MỚI VỀ" title="Sẵn sàng cho hành trình mới" products={newItems} loading={products.isLoading} />
      <ProductSection eyebrow="PHỤ KIỆN" title="Trang bị thêm cho hành trình" products={accessories} loading={products.isLoading} viewAllHref="/products?category=phu-kien" />
    </>
  );
}

function useQueryProducts(params?: ListProductsParams) {
  return useListProducts(params, { query: { staleTime: 30_000 } as any });
}

function ProductSection({ eyebrow, title, products, loading, viewAllHref = "/products" }: { eyebrow: string; title: string; products: Product[]; loading: boolean; viewAllHref?: string }) {
  return <section className="section container"><div className="section-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div><Link href={viewAllHref} className="text-link">Xem thêm <ArrowRight size={15} /></Link></div>{loading ? <ProductSkeleton /> : products.length ? <div className="product-grid">{products.map((p) => <ProductCard key={p.id} product={p} />)}</div> : <EmptyState text="Sản phẩm đang được cập nhật." />}</section>;
}

function ProductSkeleton() { return <div className="product-grid">{[1, 2, 3, 4].map((i) => <div className="product-skeleton" key={i}><div /><span /><small /></div>)}</div>; }

function ProductCard({ product }: { product: Product }) {
  const [, setLocation] = useLocation();
  const outOfStock = product.stock <= 0;
  const salePercent = product.compareAtPrice ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0;
  return <article className={outOfStock ? "product-card out-of-stock" : "product-card"}><Link href={`/p/${product.slug}`} className="product-image"><img src={product.thumbnail || imageFallback} alt={product.name} />{outOfStock && <div className="out-of-stock-overlay"><span>Hết hàng</span></div>}<div className="product-badges">{salePercent > 0 && <span className="badge sale"><Flame size={14} /> -{salePercent}%</span>}</div>{!outOfStock && <button className="quick-add" onClick={(e) => { e.preventDefault(); setLocation(`/p/${product.slug}`); }}><ShoppingBag size={16} /> Xem chi tiết</button>}</Link><div className="product-info"><Link href={`/p/${product.slug}`} className="product-name">{product.name}</Link><div className="product-price"><b>{money(product.price)}</b>{product.compareAtPrice && <del>{money(product.compareAtPrice)}</del>}</div></div></article>;
}

function Catalog() {
  const [, setLocation] = useLocation();
  const searchStr = useSearch();
  const query = new URLSearchParams(searchStr);
  const category = query.get("category") || "";
  const sort = query.get("sort") || "newest";
  const [search, setSearch] = useState(query.get("q") || "");
  useEffect(() => { setSearch(query.get("q") || ""); }, [searchStr]);
  const updateQuery = (patch: Record<string, string>) => {
    const next = new URLSearchParams(searchStr);
    Object.entries(patch).forEach(([k, v]) => { if (v) next.set(k, v); else next.delete(k); });
    const qs = next.toString();
    setLocation(qs ? `/products?${qs}` : "/products");
  };
  const result = useListProducts({ q: search || undefined, category: category || undefined, sort: sort as any, limit: 100 });
  const CATALOG_PAGE_SIZE = 16, CATALOG_LOAD_MORE = 12;
  const [visibleCount, setVisibleCount] = useState(CATALOG_PAGE_SIZE);
  useEffect(() => { setVisibleCount(CATALOG_PAGE_SIZE); }, [category, sort, search]);
  const visibleProducts = result.data?.slice(0, visibleCount) ?? [];
  const hasMore = (result.data?.length ?? 0) > visibleCount;
  return <section className="catalog-page container"><div className="breadcrumbs"><Link href="/">Trang chủ</Link><ChevronRight size={14} />{category ? <><Link href="/products">Sản phẩm</Link><ChevronRight size={14} /><span>{categories.find((c) => c.value === category)?.label || category}</span></> : <span>Sản phẩm</span>}</div><div className="catalog-heading"><div><p className="eyebrow">ROYAL COLLECTION</p><h1>Tất cả sản phẩm</h1><p>Thiết kế cho những người không đứng yên.</p></div><div className="catalog-search"><Search size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm tên sản phẩm..." /></div></div><div className="catalog-toolbar"><div className="filter-pills"><button className={!category ? "active" : ""} onClick={() => updateQuery({ category: "" })}>Tất cả</button>{categories.map((cat) => <button className={category === cat.value ? "active" : ""} onClick={() => updateQuery({ category: cat.value })} key={cat.value}>{cat.label}</button>)}</div><label className="sort-select"><Filter size={16} /><span>Sắp xếp</span><select value={sort} onChange={(e) => updateQuery({ sort: e.target.value })}><option value="newest">Mới nhất</option><option value="featured">Nổi bật</option><option value="price-asc">Giá thấp đến cao</option><option value="price-desc">Giá cao đến thấp</option></select><ChevronDown size={15} /></label></div>{result.isLoading ? <ProductSkeleton /> : result.isError ? <ErrorState /> : result.data?.length ? <><div className="product-grid catalog-grid">{visibleProducts.map((p) => <ProductCard key={p.id} product={p} />)}</div>{hasMore && <div className="load-more"><button type="button" className="button button-ghost" onClick={() => setVisibleCount((c) => c + CATALOG_LOAD_MORE)}>XEM THÊM</button></div>}</> : <EmptyState text="Không tìm thấy sản phẩm phù hợp." action={<button className="button button-dark" onClick={() => { setSearch(""); setLocation("/products"); }}>Xóa bộ lọc</button>} />}</section>;
}

function variantKey(size: string, color: string) {
  return `${size} ${color}`;
}

function hasVariantMatrix(product: Product) {
  return (
    Object.keys(product.variants || {}).length > 0 &&
    (product.sizes?.length ?? 0) > 0 &&
    (product.colors?.length ?? 0) > 0
  );
}

function galleryImages(product: Product, color: string) {
  const all = [product.thumbnail, ...(product.images || []).filter((item) => item !== product.thumbnail)];
  const usesColorImages = Object.keys(product.colorImages || {}).length > 0;
  const scoped = color ? product.colorImages?.[color] : undefined;
  const filtered = scoped?.length ? all.filter((url) => scoped.includes(url)) : [];
  if (filtered.length) return filtered;
  return usesColorImages ? [product.thumbnail] : all;
}

function ProductDetail() {
  const [, params] = useRoute("/p/:slug");
  const { data: product, isLoading, isError } = useGetProduct(params?.slug || "");
  const cart = useCart();
  const [, setLocation] = useLocation();
  const [imageIndex, setImageIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  useEffect(() => {
    if (!product) return;
    let initialSize = product.sizes?.[0] || "";
    let initialColor = product.colors?.[0] || "";
    if (hasVariantMatrix(product)) {
      const inStockPair = product.sizes!
        .flatMap((s) => product.colors!.map((c) => [s, c] as const))
        .find(([s, c]) => (product.variants?.[variantKey(s, c)] ?? 0) > 0);
      if (inStockPair) [initialSize, initialColor] = inStockPair;
    }
    setSize(initialSize);
    setColor(initialColor);
    setImageIndex(0);
  }, [product]);
  useEffect(() => {
    if (!lightbox || !product) return;
    const imgs = galleryImages(product, color);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowLeft") setImageIndex((i) => (i - 1 + imgs.length) % imgs.length);
      if (e.key === "ArrowRight") setImageIndex((i) => (i + 1) % imgs.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, product, color]);
  if (isLoading) return <div className="container page-state"><Loader2 className="spin" size={28} /> Đang tải sản phẩm...</div>;
  if (isError || !product) return <div className="container page-state"><CircleAlert size={28} /> Không tìm thấy sản phẩm.</div>;
  const images = galleryImages(product, color);
  const image = images[imageIndex] || images[0];
  const prevImage = () => setImageIndex((i) => (i - 1 + images.length) % images.length);
  const nextImage = () => setImageIndex((i) => (i + 1) % images.length);
  const add = (goCheckout = false) => { cart.add(product, quantity, size || undefined, color || undefined); setLocation(goCheckout ? "/checkout" : "/cart"); };
  const usesVariants = hasVariantMatrix(product);
  const stockFor = (s: string, c: string) => product.variants?.[variantKey(s, c)];
  const sizeStockTotal = (s: string) => (product.colors || []).reduce((sum, c) => sum + (stockFor(s, c) ?? 0), 0);
  const colorStockTotal = (c: string) => (product.sizes || []).reduce((sum, s) => sum + (stockFor(s, c) ?? 0), 0);
  const disabledSizes = usesVariants ? (product.sizes || []).filter((s) => sizeStockTotal(s) <= 0) : [];
  const disabledColors = usesVariants ? (product.colors || []).filter((c) => colorStockTotal(c) <= 0) : [];
  const mutedSizes = usesVariants && color ? (product.sizes || []).filter((s) => !disabledSizes.includes(s) && (stockFor(s, color) ?? 0) <= 0) : [];
  const mutedColors = usesVariants && size ? (product.colors || []).filter((c) => !disabledColors.includes(c) && (stockFor(size, c) ?? 0) <= 0) : [];
  const currentStock = usesVariants ? (stockFor(size, color) ?? 0) : product.stock;
  const selectSize = (nextSize: string) => {
    setSize(nextSize);
    if (usesVariants && (stockFor(nextSize, color) ?? 0) <= 0) {
      const fallback = (product.colors || []).find((c) => (stockFor(nextSize, c) ?? 0) > 0);
      if (fallback) setColor(fallback);
    }
  };
  const selectColor = (nextColor: string) => {
    setColor(nextColor);
    setImageIndex(0);
    if (usesVariants && (stockFor(size, nextColor) ?? 0) <= 0) {
      const fallback = (product.sizes || []).find((s) => (stockFor(s, nextColor) ?? 0) > 0);
      if (fallback) setSize(fallback);
    }
  };
  return <section className="container detail-page"><div className="breadcrumbs"><Link href="/">Trang chủ</Link><ChevronRight size={14} /><Link href="/products">Sản phẩm</Link><ChevronRight size={14} /><Link href={`/products?category=${product.category}`}>{categories.find((c) => c.value === product.category)?.label || product.category}</Link><ChevronRight size={14} /><span>{product.name}</span></div><div className="detail-grid"><div className="gallery"><div className="gallery-main" onClick={() => setLightbox(true)}><img src={image || imageFallback} alt={product.name} />{images.length > 1 && <><button type="button" className="gallery-nav prev" onClick={(e) => { e.stopPropagation(); prevImage(); }} aria-label="Ảnh trước"><ChevronLeft size={22} /></button><button type="button" className="gallery-nav next" onClick={(e) => { e.stopPropagation(); nextImage(); }} aria-label="Ảnh sau"><ChevronRight size={22} /></button></>}<span className="gallery-zoom-hint"><ZoomIn size={15} /> Bấm để phóng to</span></div><div className="gallery-thumbs">{images.map((item, i) => <button className={imageIndex === i ? "selected" : ""} onClick={() => setImageIndex(i)} key={item}><img src={item} alt="" /></button>)}</div></div>{lightbox && <div className="lightbox-backdrop" onClick={() => setLightbox(false)}><button type="button" className="lightbox-close" onClick={() => setLightbox(false)} aria-label="Đóng"><X size={24} /></button>{images.length > 1 && <button type="button" className="lightbox-nav prev" onClick={(e) => { e.stopPropagation(); prevImage(); }} aria-label="Ảnh trước"><ChevronLeft size={30} /></button>}<img src={image || imageFallback} alt={product.name} onClick={(e) => e.stopPropagation()} />{images.length > 1 && <button type="button" className="lightbox-nav next" onClick={(e) => { e.stopPropagation(); nextImage(); }} aria-label="Ảnh sau"><ChevronRight size={30} /></button>}</div>}<div className="detail-copy"><p className="product-category">{product.category} {product.sku && ` / ${product.sku}`}</p><h1>{product.name}</h1><div className="detail-price"><b>{money(product.price)}</b>{product.compareAtPrice && <del>{money(product.compareAtPrice)}</del>}{product.compareAtPrice && <span>-{Math.round((1 - product.price / product.compareAtPrice) * 100)}%</span>}</div><p className="detail-description">{product.description || "Mũ bảo hiểm Royal chính hãng, thiết kế chắc chắn và thoải mái cho mỗi hành trình."}</p>{product.sizes?.length > 0 && <OptionPicker label="Kích thước" options={product.sizes} value={size} onChange={selectSize} disabledOptions={disabledSizes} mutedOptions={mutedSizes} />}{product.colors?.length > 0 && <OptionPicker label="Màu sắc" options={product.colors} value={color} onChange={selectColor} disabledOptions={disabledColors} mutedOptions={mutedColors} />}{usesVariants && (disabledSizes.length > 0 || disabledColors.length > 0 || mutedSizes.length > 0 || mutedColors.length > 0) && <p className="variant-stock-note">Gạch ngang: hết hàng hoàn toàn. Mờ: bấm vào sẽ tự chuyển sang lựa chọn còn hàng.</p>}{currentStock > 0 ? <><div className="buy-row"><div className="quantity"><button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button><span>{quantity}</span><button onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}>+</button></div><button className="button button-dark grow" onClick={() => add(false)}><ShoppingBag size={17} /> Thêm vào giỏ</button></div><button className="button button-accent full" onClick={() => add(true)}>Mua ngay <ArrowRight size={17} /></button></> : <div className="sold-out">Sản phẩm tạm hết hàng</div>}<div className="detail-promises"><div><Truck size={18} /><span><b>Giao hàng toàn quốc</b><small>Nhận hàng kiểm tra trước khi thanh toán</small></span></div><div><ShieldCheck size={18} /><span><b>Bảo hành chính hãng</b><small>{product.warranty || "12 tháng"}</small></span></div><div><BadgeCheck size={18} /><span><b>Đổi size trong 7 ngày</b><small>Hỗ trợ chọn lại vừa vặn hơn</small></span></div></div></div></div>{product.specs && Object.keys(product.specs).length > 0 && <div className="specs"><p className="eyebrow">THÔNG SỐ</p><h2>Chi tiết sản phẩm</h2><div className="spec-table">{Object.entries(product.specs).map(([key, value]) => <div key={key}><span>{key}</span><b>{value}</b></div>)}</div></div>}</section>;
}

function OptionPicker({ label, options, value, onChange, disabledOptions, mutedOptions }: { label: string; options: string[]; value: string; onChange: (value: string) => void; disabledOptions?: string[]; mutedOptions?: string[] }) {
  return <div className="option-picker"><div><b>{label}</b><span>{value}</span></div><div className="options">{options.map((option) => {
    const isDisabled = disabledOptions?.includes(option);
    const isMuted = !isDisabled && mutedOptions?.includes(option);
    return <button className={[value === option ? "selected" : "", isDisabled ? "disabled" : "", isMuted ? "muted" : ""].filter(Boolean).join(" ")} disabled={isDisabled} onClick={() => onChange(option)} key={option}>{option}</button>;
  })}</div></div>;
}

function CartPage({ checkout = false }: { checkout?: boolean }) {
  const cart = useCart();
  const [, setLocation] = useLocation();
  const orderMutation = useCreateOrder();
  const [form, setForm] = useState({ customerName: "", phone: "", email: "", address: "", note: "", paymentMethod: "cod" as "cod" | "bank_transfer" });
  const [submitted, setSubmitted] = useState(false);
  if (!cart.items.length && !submitted) return <div className="container page-state cart-empty"><ShoppingCart size={42} /><h1>Giỏ hàng đang trống</h1><p>Hãy chọn một chiếc mũ phù hợp cho hành trình tiếp theo.</p><Link className="button button-dark" href="/products">Mua sắm ngay <ArrowRight size={16} /></Link></div>;
  const submit = (event: FormEvent) => { event.preventDefault(); const payload: OrderInput = { ...form, items: cart.items.map((item) => ({ productId: item.product.id, quantity: item.quantity, size: item.size || null, color: item.color || null })) }; orderMutation.mutate({ data: payload }, { onSuccess: (result) => { cart.clear(); setSubmitted(true); setLocation(`/order-success/${result.orderId}${form.email ? "?emailed=1" : ""}`); } }); };
  return <section className="container cart-page"><div className="breadcrumbs"><Link href="/">Trang chủ</Link><ChevronRight size={14} /><span>{checkout ? "Đặt hàng" : "Giỏ hàng"}</span></div>{!checkout && <div className="cart-title"><div><p className="eyebrow">YOUR RIDE STARTS HERE</p><h1>Giỏ hàng</h1></div><span>{cart.count} sản phẩm</span></div>}<div className="cart-layout"><div className="cart-lines">{cart.items.map((item, index) => <div className="cart-line" key={`${item.product.id}-${index}`}><img src={item.product.thumbnail || imageFallback} alt="" /><div className="cart-line-info"><Link href={`/p/${item.product.slug}`}>{item.product.name}</Link><small>{item.size && `Size ${item.size}`} {item.color && ` · ${item.color}`}</small><b>{money(item.product.price)}</b></div><div className="quantity"><button onClick={() => cart.update(index, item.quantity - 1)}>−</button><span>{item.quantity}</span><button onClick={() => cart.update(index, item.quantity + 1)}>+</button></div><button className="remove-button" aria-label="Xóa sản phẩm" onClick={() => cart.remove(index)}><Trash2 size={17} /></button></div>)}{!checkout && <Link href="/products" className="continue-link"><ChevronLeft size={16} /> Tiếp tục mua sắm</Link>}</div><aside className="cart-summary">{!checkout ? <><div className="summary-header"><h3>Tóm tắt đơn hàng</h3><span>{cart.count} món</span></div><div className="summary-row"><span>Tạm tính</span><b>{money(cart.total)}</b></div><div className="summary-row"><span>Phí vận chuyển</span><b>Liên hệ</b></div><div className="summary-total"><span>Tổng cộng</span><b>{money(cart.total)}</b></div><button className="button button-dark full" onClick={() => setLocation("/checkout")}>Tiến hành đặt hàng <ArrowRight size={16} /></button><p className="summary-note"><ShieldCheck size={14} /> Thanh toán an toàn khi nhận hàng</p></> : <form onSubmit={submit}><div className="summary-header"><h3>Thông tin nhận hàng</h3></div><label>Họ và tên<input required minLength={2} value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} placeholder="Nguyễn Văn A" /></label><label>Số điện thoại<input required minLength={8} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0900 000 000" /></label><label>Email <span className="optional">(không bắt buộc)</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="ban@email.com" /><span className="optional">Nhập nếu muốn nhận email xác nhận đơn hàng</span></label><label>Địa chỉ nhận hàng<textarea required minLength={5} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Số nhà, đường, phường/xã, tỉnh..." /></label><label>Ghi chú đơn hàng <span className="optional">(không bắt buộc)</span><textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Ví dụ: Gọi trước khi giao" /></label><div className="payment-options"><b>Phương thức thanh toán</b><label className={form.paymentMethod === "cod" ? "payment-option selected" : "payment-option"}><input type="radio" checked={form.paymentMethod === "cod"} onChange={() => setForm({ ...form, paymentMethod: "cod" })} /> <Banknote size={17} /><span><b>Thanh toán khi nhận hàng</b><small>Kiểm tra mũ trước khi thanh toán</small></span></label><label className={form.paymentMethod === "bank_transfer" ? "payment-option selected" : "payment-option"}><input type="radio" checked={form.paymentMethod === "bank_transfer"} onChange={() => setForm({ ...form, paymentMethod: "bank_transfer" })} /> <CreditCard size={17} /><span><b>Chuyển khoản ngân hàng</b><small>Thông tin chuyển khoản gửi sau khi đặt</small></span></label></div><div className="summary-total"><span>Tổng thanh toán</span><b>{money(cart.total)}</b></div><button className="button button-accent full" disabled={orderMutation.isPending}>{orderMutation.isPending ? <Loader2 className="spin" size={16} /> : <Check size={16} />} {orderMutation.isPending ? "Đang gửi đơn..." : "Xác nhận đặt hàng"}</button>{orderMutation.isError && <p className="form-error"><CircleAlert size={15} /> Không thể tạo đơn. Vui lòng kiểm tra tồn kho và thử lại.</p>}</form>}</aside></div></section>;
}

function OrderSuccess() {
  const emailed = new URLSearchParams(useSearch()).get("emailed") === "1";
  return <div className="container page-state success-state"><div className="success-icon"><Check size={30} /></div><p className="eyebrow">ĐẶT HÀNG THÀNH CÔNG</p><h1>Cảm ơn bạn đã tin chọn Royal.</h1><p>Đơn hàng của bạn đã được ghi nhận. Chúng tôi sẽ gọi xác nhận trong thời gian sớm nhất.</p>{emailed && <p className="email-note"><MessageCircle size={15} /><span>Chúng tôi đã gửi email xác nhận đơn hàng. Nếu chưa thấy, vui lòng kiểm tra thêm mục <b>Spam/Thư rác</b> trong hộp thư.</span></p>}<div className="success-actions"><Link href="/products" className="button button-dark">Tiếp tục mua sắm</Link><a href={`tel:${SHOP_PHONE}`} className="text-link">Cần hỗ trợ? Gọi {SHOP_PHONE_DISPLAY}</a></div></div>;
}

function Policies() {
  return <section className="container policy-page"><div className="breadcrumbs"><Link href="/">Trang chủ</Link><ChevronRight size={14} /><span>Chính sách</span></div><div className="policy-hero"><p className="eyebrow">ROYAL CARE</p><h1>Mua mũ dễ dàng.<br /><em>Yên tâm dài lâu.</em></h1><p>Những điều bạn cần biết trước và sau khi sở hữu chiếc mũ Royal.</p></div><div className="policy-grid"><Policy icon={<Truck />} title="Giao hàng" id="shipping"><p>Đơn hàng được đóng gói cẩn thận và giao toàn quốc. Thời gian dự kiến 2–5 ngày làm việc tùy khu vực. Hỗ trợ kiểm tra hàng trước khi thanh toán với đơn COD.</p></Policy><Policy icon={<BadgeCheck />} title="Đổi size trong 7 ngày" id="size"><p>Nếu mũ không vừa, bạn có thể liên hệ trong vòng 7 ngày từ khi nhận hàng để được hỗ trợ đổi size. Mũ cần còn nguyên tem, chưa qua sử dụng và không có dấu hiệu trầy xước.</p><p className="policy-tip">Mẹo chọn size: dùng thước dây đo vòng đầu tại vị trí rộng nhất, ngang trên lông mày. Gửi số đo cho chúng tôi để được tư vấn.</p></Policy><Policy icon={<ShieldCheck />} title="Bảo hành chính hãng" id="warranty"><p>Sản phẩm Royal được bảo hành theo chính sách chính hãng, hỗ trợ các lỗi kỹ thuật từ nhà sản xuất. Không áp dụng cho hư hỏng do va chạm, tác động ngoại lực hoặc sử dụng sai hướng dẫn.</p></Policy><Policy icon={<CreditCard />} title="Thanh toán"><p>Thanh toán khi nhận hàng (COD) hoặc chuyển khoản ngân hàng. Chúng tôi không yêu cầu bạn cung cấp mã OTP hay thông tin thẻ qua tin nhắn.</p></Policy></div></section>;
}
function Policy({ icon, title, id, children }: { icon: React.ReactNode; title: string; id?: string; children: React.ReactNode }) { return <article className="policy-card" id={id}><div className="policy-icon">{icon}</div><h2>{title}</h2>{children}</article>; }

function AboutPage() {
  return <section className="container about-page">
    <div className="breadcrumbs"><Link href="/">Trang chủ</Link><ChevronRight size={14} /><span>Giới thiệu</span></div>
    <div className="policy-hero">
      <p className="eyebrow">CÂU CHUYỆN CỦA CHÚNG TÔI</p>
      <h1>Royal Helmet<br /><em>Quảng Trị.</em></h1>
      <p>Hơn cả một cửa hàng mũ bảo hiểm — nơi mỗi khách hàng được tư vấn thật, chọn đúng size, và an tâm suốt hành trình.</p>
    </div>

    <div className="about-row">
      <div className="about-copy">
        <p className="eyebrow">TỪ NHỮNG NGÀY ĐẦU</p>
        <h2>Bắt đầu từ tình yêu với những chuyến đi</h2>
        <p>Royal Helmet Quảng Trị có mặt tại TP. Đông Hà với mong muốn đơn giản: giúp mỗi người dân Quảng Trị và du khách sở hữu một chiếc mũ bảo hiểm vừa vặn, an toàn thật sự — chứ không chỉ để đối phó. Chúng tôi trực tiếp kiểm tra từng lô hàng, tư vấn kỹ trước khi bán, và luôn có mặt hỗ trợ sau khi khách đã mua.</p>
      </div>
      <div className="about-image"><img src="/img/shop-2.jpg" alt="Kệ trưng bày mũ bảo hiểm Royal" loading="lazy" /></div>
    </div>

    <div className="about-row reverse">
      <div className="about-copy">
        <p className="eyebrow">ĐA DẠNG LỰA CHỌN</p>
        <h2>Đủ kiểu dáng, đủ size — cho mọi thành viên trong nhà</h2>
        <p>Từ mũ 1/2 gọn nhẹ đi phố, mũ 3/4 phong cách, đến fullface bảo vệ tối đa cho những chuyến đi xa — cửa hàng có đầy đủ dòng mũ Royal chính hãng với hàng chục màu sắc, kiểu dáng khác nhau. Đặc biệt, Royal Helmet Quảng Trị còn có riêng dòng <b>mũ bảo hiểm trẻ em</b> nhiều họa tiết đáng yêu, đúng chuẩn an toàn, để các bé cũng được bảo vệ chu đáo như người lớn.</p>
      </div>
      <div className="about-image"><img src="/img/shop-1.jpg" alt="Mũ bảo hiểm trẻ em và đa dạng mẫu mã tại cửa hàng" loading="lazy" /></div>
    </div>

    <div className="about-row">
      <div className="about-copy">
        <p className="eyebrow">KHÔNG GIAN CỬA HÀNG</p>
        <h2>Ghé qua, đội thử trước khi quyết định</h2>
        <p>Hàng trăm mẫu mũ được trưng bày trực quan ngay tại cửa hàng ở {SHOP_ADDRESS}. Bạn có thể đến trực tiếp, đội thử nhiều size, nhiều kiểu dáng cho đến khi tìm được chiếc mũ vừa vặn và ưng ý nhất — hoàn toàn miễn phí, không áp lực mua hàng.</p>
      </div>
      <div className="about-image"><img src="/img/shop-4.jpg" alt="Không gian trưng bày mũ bảo hiểm Royal" loading="lazy" /></div>
    </div>

    <div className="section-heading" id="dich-vu"><div><p className="eyebrow">NGOÀI BÁN MŨ MỚI</p><h2>Dịch vụ đi kèm</h2></div></div>
    <div className="policy-grid about-services">
      <article className="policy-card"><div className="policy-icon"><Wrench size={19} /></div><h2>Thay quai mũ</h2><p>Quai cũ chùng, đứt hoặc muốn đổi kiểu — thay nhanh gọn ngay tại cửa hàng.</p></article>
      <article className="policy-card"><div className="policy-icon"><Eye size={19} /></div><h2>Thay kính mũ</h2><p>Kính trầy, mờ, ố vàng theo thời gian — thay mới để tầm nhìn luôn rõ ràng khi lái xe.</p></article>
      <article className="policy-card"><div className="policy-icon"><Wrench size={19} /></div><h2>Sửa chữa mũ bảo hiểm</h2><p>Khóa hỏng, lớp lót bong tróc, ốc vít lỏng... đội ngũ kỹ thuật hỗ trợ sửa chữa, làm mới mũ.</p></article>
      <article className="policy-card"><div className="policy-icon"><Package size={19} /></div><h2>Cho thuê đồ phượt</h2><p>Cần lều, trại, ghế, dụng cụ cắm trại cho chuyến đi ngắn ngày? Liên hệ để được tư vấn thuê với giá hợp lý.</p></article>
    </div>

    <div className="about-cta">
      <p>Còn thắc mắc về sản phẩm hay dịch vụ?</p>
      <div className="hero-actions">
        <a href={ZALO_LINK} target="_blank" rel="noopener" className="button button-accent"><MessageCircle size={16} /> Chat Zalo ngay</a>
        <a href={FACEBOOK_LINK} target="_blank" rel="noopener" className="button button-accent"><Facebook size={16} /> Chat Facebook ngay</a>
        <a href={`tel:${SHOP_PHONE}`} className="button button-accent"><Phone size={16} /> Gọi {SHOP_PHONE_DISPLAY}</a>
      </div>
    </div>
  </section>;
}
function EmptyState({ text, action }: { text: string; action?: React.ReactNode }) { return <div className="empty-state"><Package size={28} /><p>{text}</p>{action}</div>; }
function ErrorState() { return <div className="empty-state"><CircleAlert size={28} /><p>Không thể tải dữ liệu. Vui lòng thử lại.</p></div>; }
function usePager<T>(items: T[], pageSize: number, resetKey?: unknown) {
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [resetKey]);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [pageCount, page]);
  const pageItems = items.slice((page - 1) * pageSize, page * pageSize);
  return { page, setPage, pageCount, pageItems };
}
function pageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [...new Set([1, 2, total - 1, total, current - 1, current, current + 1])].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: (number | "…")[] = [];
  pages.forEach((p, i) => { if (i > 0 && p - (pages[i - 1] as number) > 1) result.push("…"); result.push(p); });
  return result;
}
function Pagination({ page, pageCount, onChange }: { page: number; pageCount: number; onChange: (page: number) => void }) {
  if (pageCount <= 1) return null;
  return <div className="pagination">
    <button type="button" disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Trang trước"><ChevronLeft size={16} /></button>
    {pageWindow(page, pageCount).map((p, i) => p === "…" ? <span className="pagination-ellipsis" key={`e${i}`}>…</span> : <button type="button" key={p} className={p === page ? "active" : ""} onClick={() => onChange(p)}>{p}</button>)}
    <button type="button" disabled={page === pageCount} onClick={() => onChange(page + 1)} aria-label="Trang sau"><ChevronRight size={16} /></button>
  </div>;
}

function AdminLogin() {
  const [, setLocation] = useLocation();
  const mutation = useAdminLogin();
  const [form, setForm] = useState({ username: "", password: "" });
  const submit = (e: FormEvent) => { e.preventDefault(); mutation.mutate({ data: form }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetAdminSessionQueryKey() }); setLocation("/admin"); } }); };
  return <div className="admin-login"><div className="login-panel"><Link href="/" className="brand"><BrandMark /><span><b>ROYAL</b><small>HELMET QUẢNG TRỊ</small></span></Link><div className="login-heading"><p className="eyebrow">KHU VỰC QUẢN TRỊ</p><h1>Chào mừng<br />quay trở lại.</h1><p>Quản lý sản phẩm và đơn hàng của Royal Helmet Quảng Trị.</p></div><form onSubmit={submit}><label>Tên đăng nhập<input autoComplete="username" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="admin" /></label><label>Mật khẩu<input type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" /></label>{mutation.isError && <p className="form-error"><CircleAlert size={15} /> Sai tên đăng nhập hoặc mật khẩu.</p>}<button className="button button-dark full" disabled={mutation.isPending}>{mutation.isPending ? <Loader2 className="spin" size={16} /> : null} Đăng nhập</button></form><Link href="/admin/forgot-password" className="text-link forgot-link">Quên mật khẩu?</Link><Link href="/" className="back-link"><ChevronLeft size={15} /> Quay về cửa hàng</Link></div><div className="login-visual"><div><p className="eyebrow">ROYAL / ADMIN</p><h2>Một cửa hàng tốt bắt đầu từ những chi tiết được chăm sóc.</h2></div></div></div>;
}

function ForgotPassword() {
  const mutation = useForgotAdminPassword();
  const submit = (e: FormEvent) => { e.preventDefault(); mutation.mutate({ data: { origin: window.location.origin } }); };
  return <div className="admin-login"><div className="login-panel"><Link href="/" className="brand"><BrandMark /><span><b>ROYAL</b><small>HELMET QUẢNG TRỊ</small></span></Link><div className="login-heading"><p className="eyebrow">QUÊN MẬT KHẨU</p><h1>Đặt lại<br />mật khẩu.</h1><p>Chúng tôi sẽ gửi liên kết đặt lại mật khẩu đến email quản trị đã đăng ký.</p></div>{mutation.isSuccess ? <p className="form-success"><Check size={15} /> Nếu tài khoản có email đăng ký, một liên kết đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư.</p> : <form onSubmit={submit}><button className="button button-dark full" disabled={mutation.isPending}>{mutation.isPending ? <Loader2 className="spin" size={16} /> : <MessageCircle size={16} />} Gửi email đặt lại mật khẩu</button></form>}<Link href="/admin/login" className="back-link"><ChevronLeft size={15} /> Quay về đăng nhập</Link></div><div className="login-visual"><div><p className="eyebrow">ROYAL / ADMIN</p><h2>Một cửa hàng tốt bắt đầu từ những chi tiết được chăm sóc.</h2></div></div></div>;
}

function ResetPassword() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const token = new URLSearchParams(search).get("token") || "";
  const mutation = useResetAdminPassword();
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [mismatch, setMismatch] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) { setMismatch(true); return; }
    setMismatch(false);
    mutation.mutate({ data: { token, newPassword: form.newPassword } }, { onSuccess: () => setLocation("/admin/login") });
  };
  if (!token) return <div className="container page-state"><CircleAlert size={28} /> Liên kết không hợp lệ.</div>;
  return <div className="admin-login"><div className="login-panel"><Link href="/" className="brand"><BrandMark /><span><b>ROYAL</b><small>HELMET QUẢNG TRỊ</small></span></Link><div className="login-heading"><p className="eyebrow">ĐẶT LẠI MẬT KHẨU</p><h1>Tạo mật khẩu<br />mới.</h1></div><form onSubmit={submit}><label>Mật khẩu mới<input type="password" required minLength={6} autoComplete="new-password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} placeholder="Tối thiểu 6 ký tự" /></label><label>Nhập lại mật khẩu mới<input type="password" required minLength={6} autoComplete="new-password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="••••••••" /></label>{mismatch && <p className="form-error"><CircleAlert size={15} /> Mật khẩu nhập lại không khớp.</p>}{mutation.isError && <p className="form-error"><CircleAlert size={15} /> Liên kết đã hết hạn hoặc không hợp lệ.</p>}<button className="button button-dark full" disabled={mutation.isPending}>{mutation.isPending ? <Loader2 className="spin" size={16} /> : <Check size={16} />} Đặt lại mật khẩu</button></form><Link href="/admin/login" className="back-link"><ChevronLeft size={15} /> Quay về đăng nhập</Link></div><div className="login-visual"><div><p className="eyebrow">ROYAL / ADMIN</p><h2>Một cửa hàng tốt bắt đầu từ những chi tiết được chăm sóc.</h2></div></div></div>;
}

function AccountSettings() {
  const mutation = useChangeAdminPassword();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [mismatch, setMismatch] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) { setMismatch(true); return; }
    setMismatch(false);
    mutation.mutate({ data: { currentPassword: form.currentPassword, newPassword: form.newPassword } }, {
      onSuccess: () => setForm({ currentPassword: "", newPassword: "", confirmPassword: "" }),
    });
  };
  return <div className="admin-page"><AdminPageHeader eyebrow="TÀI KHOẢN" title="Đổi mật khẩu" description="Cập nhật mật khẩu đăng nhập khu vực quản trị." /><div className="admin-panel"><form className="account-form" onSubmit={submit}><label>Mật khẩu hiện tại<input type="password" required autoComplete="current-password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} /></label><label>Mật khẩu mới<input type="password" required minLength={6} autoComplete="new-password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} placeholder="Tối thiểu 6 ký tự" /></label><label>Nhập lại mật khẩu mới<input type="password" required minLength={6} autoComplete="new-password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} /></label>{mismatch && <p className="form-error"><CircleAlert size={15} /> Mật khẩu nhập lại không khớp.</p>}{mutation.isError && <p className="form-error"><CircleAlert size={15} /> Mật khẩu hiện tại không đúng.</p>}{mutation.isSuccess && <p className="form-success"><Check size={15} /> Đã đổi mật khẩu thành công.</p>}<button className="button button-dark" disabled={mutation.isPending}>{mutation.isPending ? <Loader2 className="spin" size={16} /> : <Check size={16} />} Lưu mật khẩu mới</button></form></div></div>;
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useGetAdminSession();
  const [, setLocation] = useLocation();
  const logout = useAdminLogout();
  useEffect(() => { if (!isLoading && !data?.authenticated) setLocation("/admin/login"); }, [data, isLoading, setLocation]);
  if (isLoading || !data?.authenticated) return <div className="page-state"><Loader2 className="spin" size={26} /></div>;
  return <div className="admin-layout"><aside className="admin-sidebar"><Link href="/admin" className="brand admin-brand"><BrandMark /><span><b>ROYAL</b><small>BACK OFFICE</small></span></Link><p className="sidebar-label">QUẢN LÝ CỬA HÀNG</p><nav><Link href="/admin"><LayoutDashboard size={17} /> Tổng quan</Link><Link href="/admin/products"><Package size={17} /> Sản phẩm</Link><Link href="/admin/orders"><ClipboardList size={17} /> Đơn hàng</Link><Link href="/admin/account"><KeyRound size={17} /> Tài khoản</Link></nav><div className="sidebar-bottom"><Link href="/" className="sidebar-store"><ArrowRight size={16} /> Về cửa hàng</Link><button onClick={() => logout.mutate(undefined, { onSuccess: () => setLocation("/admin/login") })}><LogOut size={16} /> Đăng xuất</button></div></aside><div className="admin-content"><div className="admin-mobile-top"><Link href="/admin" className="brand"><BrandMark /><b>ROYAL</b></Link><Link href="/" className="text-link">Cửa hàng <ArrowRight size={15} /></Link></div>{children}</div></div>;
}

function Dashboard() {
  const stats = useGetAdminStats();
  const orders = useListOrders(undefined, { query: { staleTime: 20_000 } as any });
  return <div className="admin-page"><AdminPageHeader eyebrow="TỔNG QUAN" title="Chào buổi sáng." description="Đây là tình hình cửa hàng của bạn hôm nay." /><div className="stat-grid">{[{ label: "Tổng sản phẩm", value: stats.data?.productCount ?? "—", icon: Package }, { label: "Tổng đơn hàng", value: stats.data?.orderCount ?? "—", icon: ClipboardList }, { label: "Đơn mới cần xử lý", value: stats.data?.newOrderCount ?? "—", icon: CircleAlert }, { label: "Doanh thu", value: stats.data ? money(stats.data.revenue) : "—", icon: Banknote }].map(({ label, value, icon: Icon }) => <div className="stat-card" key={label}><div className="stat-icon"><Icon size={18} /></div><small>{label}</small><strong>{value}</strong></div>)}</div><div className="admin-panel"><div className="panel-heading"><div><p className="eyebrow">MỚI NHẤT</p><h2>Đơn hàng gần đây</h2></div><Link href="/admin/orders" className="text-link">Xem tất cả <ArrowRight size={15} /></Link></div>{orders.isLoading ? <ProductSkeleton /> : orders.data?.length ? <OrderTable orders={orders.data.slice(0, 6)} /> : <EmptyState text="Chưa có đơn hàng nào." />}</div></div>;
}
function AdminPageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: React.ReactNode }) { return <div className="admin-page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>; }
function ProductAdmin() {
  const query = useQueryClient();
  const products = useListAdminProducts();
  const create = useCreateProduct(); const update = useUpdateProduct(); const remove = useDeleteProduct();
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const blank: ProductInput = { name: "", category: "3/4", price: 0, compareAtPrice: null, thumbnail: "", images: [], description: "", specs: {}, sizes: [], colors: [], colorImages: {}, variants: {}, stock: 0, warranty: "Bảo hành chính hãng 12 tháng", featured: false, bestseller: false, isNew: true };
  const [form, setForm] = useState<ProductInput>(blank);
  const open = (product?: Product) => { setEditing(product || null); setForm(product ? { ...product, sku: product.sku ?? null, compareAtPrice: product.compareAtPrice ?? null } : blank); setShowForm(true); };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const sizes = form.sizes || [];
    const colors = form.colors || [];
    const validVariantKeys = new Set(sizes.flatMap((s) => colors.map((c) => variantKey(s, c))));
    const variants = Object.fromEntries(Object.entries(form.variants || {}).filter(([k]) => validVariantKeys.has(k)));
    const variantTotal = Object.values(variants).reduce((sum, n) => sum + (n || 0), 0);
    const hasMatrix = sizes.length > 0 && colors.length > 0;
    const payload = {
      ...form,
      images: form.images?.length ? form.images : [form.thumbnail],
      sizes,
      colors,
      colorImages: Object.fromEntries(Object.entries(form.colorImages || {}).filter(([c]) => colors.includes(c))),
      variants,
      stock: hasMatrix ? variantTotal : form.stock,
    };
    const done = () => { setShowForm(false); query.invalidateQueries({ queryKey: getListAdminProductsQueryKey() }); query.invalidateQueries({ queryKey: getListProductsQueryKey() }); };
    editing ? update.mutate({ id: editing.id, data: payload }, { onSuccess: done }) : create.mutate({ data: payload }, { onSuccess: done });
  };
  const deleteProduct = (product: Product) => { if (window.confirm(`Xóa "${product.name}"?`)) remove.mutate({ id: product.id }, { onSuccess: () => query.invalidateQueries({ queryKey: getListAdminProductsQueryKey() }) }); };
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockMode, setStockMode] = useState("");
  const filtered = (products.data || [])
    .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => !categoryFilter || p.category === categoryFilter)
    .filter((p) => stockMode !== "out" || p.stock === 0)
    .sort((a, b) => (stockMode === "asc" ? a.stock - b.stock : stockMode === "desc" ? b.stock - a.stock : 0));
  const pager = usePager(filtered, 10, `${search}|${categoryFilter}|${stockMode}`);
  return <div className="admin-page"><AdminPageHeader eyebrow="CATALOG" title="Sản phẩm" description={`${products.data?.length ?? 0} sản phẩm trong cửa hàng.`} action={<button className="button button-dark" onClick={() => open()}><Plus size={17} /> Thêm sản phẩm</button>} /><div className="admin-panel"><label className="admin-search"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên sản phẩm hoặc SKU..." /></label><div className="order-filter"><span>{filtered.length} / {products.data?.length ?? 0} sản phẩm</span><div className="order-filter-controls"><select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option value="">Tất cả danh mục</option>{categories.map((c) => <option value={c.value} key={c.value}>{c.label}</option>)}</select><select value={stockMode} onChange={(e) => setStockMode(e.target.value)}><option value="">Tất cả tồn kho</option><option value="out">Hết hàng</option><option value="asc">Số lượng: Thấp đến cao</option><option value="desc">Số lượng: Cao đến thấp</option></select></div></div>{products.isLoading ? <ProductSkeleton /> : filtered.length ? <><div className="admin-product-list">{pager.pageItems.map((p) => <div className="admin-product-row" key={p.id}><img src={p.thumbnail || imageFallback} alt="" /><div><b>{p.name}</b><small>{p.category} · {p.sku || "Chưa có SKU"}</small></div><span className={p.stock < 5 ? "stock-low" : "stock-ok"}>{p.stock} tồn kho</span><strong>{money(p.price)}</strong><div className="row-actions"><button onClick={() => open(p)} aria-label="Sửa"><Pencil size={16} /></button><button onClick={() => deleteProduct(p)} aria-label="Xóa"><Trash2 size={16} /></button></div></div>)}</div><Pagination page={pager.page} pageCount={pager.pageCount} onChange={pager.setPage} /></> : <EmptyState text="Không có sản phẩm phù hợp." />}</div>{showForm && <ProductForm product={form} setProduct={setForm} onSubmit={submit} onClose={() => setShowForm(false)} saving={create.isPending || update.isPending} editing={Boolean(editing)} />}</div>;
}
function ProductForm({ product, setProduct, onSubmit, onClose, saving, editing }: { product: ProductInput; setProduct: React.Dispatch<React.SetStateAction<ProductInput>>; onSubmit: (e: FormEvent) => void; onClose: () => void; saving: boolean; editing: boolean }) {
  const set = (key: keyof ProductInput, value: any) => setProduct((current) => ({ ...current, [key]: value }));
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [sizesText, setSizesText] = useState(() => product.sizes?.join(", ") || "");
  const [colorsText, setColorsText] = useState(() => product.colors?.join(", ") || "");
  const parseList = (text: string) => text.split(",").map((s) => s.trim()).filter(Boolean);
  const setSpec = (key: string, value: string) => setProduct((current) => {
    const specs = { ...(current.specs || {}) };
    if (value) specs[key] = value; else delete specs[key];
    return { ...current, specs };
  });
  const toggleImageColor = (url: string, colorName: string) => setProduct((current) => {
    const colorImages = { ...(current.colorImages || {}) };
    const existing = colorImages[colorName] || [];
    const next = existing.includes(url) ? existing.filter((u) => u !== url) : [...existing, url];
    if (next.length) colorImages[colorName] = next; else delete colorImages[colorName];
    return { ...current, colorImages };
  });
  const setVariantStock = (size: string, color: string, value: number) => setProduct((current) => {
    const variants = { ...(current.variants || {}) };
    const key = variantKey(size, color);
    if (value > 0) variants[key] = value; else delete variants[key];
    return { ...current, variants };
  });
  const hasMatrix = (product.sizes?.length ?? 0) > 0 && (product.colors?.length ?? 0) > 0;
  const variantTotal = Object.values(product.variants || {}).reduce((sum, n) => sum + (n || 0), 0);
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("images", file));
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Tải ảnh thất bại");
      }
      const data: { urls: string[] } = await res.json();
      setProduct((current) => ({
        ...current,
        images: [...(current.images || []), ...data.urls],
        thumbnail: current.thumbnail || data.urls[0] || current.thumbnail,
      }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Tải ảnh thất bại");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };
  return <div className="modal-backdrop"><div className="modal product-form"><div className="modal-heading"><div><p className="eyebrow">{editing ? "CHỈNH SỬA" : "CATALOG"}</p><h2>{editing ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}</h2></div><button onClick={onClose}><X size={20} /></button></div><form onSubmit={onSubmit}><div className="form-two"><label>Tên sản phẩm<input required minLength={2} value={product.name} onChange={(e) => set("name", e.target.value)} /></label><label>Danh mục<select value={product.category} onChange={(e) => set("category", e.target.value)}><option value="1/2">Mũ 1/2</option><option value="3/4">Mũ 3/4</option><option value="fullface">Mũ Fullface</option><option value="kids">Mũ trẻ em</option><option value="phu-kien">Phụ kiện</option></select></label><label>Giá bán (VNĐ)<input required type="number" min="0" value={product.price} onChange={(e) => set("price", Number(e.target.value))} /></label><label>Giá niêm yết<input type="number" min="0" value={product.compareAtPrice || ""} onChange={(e) => set("compareAtPrice", e.target.value ? Number(e.target.value) : null)} /></label><label>SKU<input value={product.sku || ""} onChange={(e) => set("sku", e.target.value || null)} /></label><label>Tồn kho{hasMatrix ? <input type="number" value={variantTotal} disabled title="Tự tính từ bảng Size × Màu bên dưới" /> : <input type="number" min="0" value={product.stock || 0} onChange={(e) => set("stock", Number(e.target.value))} />}</label><label>Size, phân cách bằng dấu phẩy<input value={sizesText} onChange={(e) => { setSizesText(e.target.value); set("sizes", parseList(e.target.value)); }} placeholder="M, L, XL" /></label><label>Màu sắc, phân cách bằng dấu phẩy<input value={colorsText} onChange={(e) => { setColorsText(e.target.value); set("colors", parseList(e.target.value)); }} placeholder="Đen, Trắng" /></label></div>{hasMatrix && <div className="variant-stock-field"><b>Tồn kho theo Size × Màu</b><div className="variant-stock-table"><div className="variant-stock-row variant-stock-head"><span></span>{product.colors!.map((c) => <span key={c}>{c}</span>)}</div>{product.sizes!.map((s) => <div className="variant-stock-row" key={s}><span>{s}</span>{product.colors!.map((c) => <input key={c} type="number" min="0" value={product.variants?.[variantKey(s, c)] ?? 0} onChange={(e) => setVariantStock(s, c, Number(e.target.value))} />)}</div>)}</div><p className="image-field-hint">Ô nào để 0 nghĩa là size + màu đó tạm hết hàng — khách sẽ không chọn được. Tổng tồn kho: {variantTotal}.</p></div>}<div className="image-field"><b>Ảnh sản phẩm</b><label className="upload-button">{uploading ? <Loader2 className="spin" size={15} /> : <Plus size={15} />} {uploading ? "Đang tải..." : "Tải ảnh lên từ máy"}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden disabled={uploading} onChange={handleUpload} /></label>{uploadError && <p className="form-error"><CircleAlert size={14} /> {uploadError}</p>}{(product.images?.length ?? 0) > 0 && <div className="image-thumb-strip">{product.images!.map((url, i) => <div className="image-thumb-col" key={`${url}-${i}`}><div className={url === product.thumbnail ? "image-thumb selected" : "image-thumb"}><img src={url} alt="" onClick={() => set("thumbnail", url)} /><button type="button" onClick={() => { const next = product.images!.filter((_, idx) => idx !== i); set("images", next); if (product.thumbnail === url) set("thumbnail", next[0] || ""); }}><X size={11} /></button></div>{(product.colors?.length ?? 0) > 0 && <div className="image-color-tags">{product.colors!.map((c) => <button type="button" key={c} className={product.colorImages?.[c]?.includes(url) ? "image-color-tag selected" : "image-color-tag"} onClick={() => toggleImageColor(url, c)}>{c}</button>)}</div>}</div>)}</div>}<label>Hoặc dán URL ảnh<input required value={product.thumbnail} onChange={(e) => set("thumbnail", e.target.value)} placeholder="https://..." /></label>{(product.colors?.length ?? 0) > 0 && <p className="image-field-hint">Bấm chọn màu ngay dưới mỗi ảnh (có thể chọn nhiều màu cho 1 ảnh, hoặc nhiều ảnh cho 1 màu) — không bắt buộc.</p>}</div><label>Mô tả<textarea required value={product.description} onChange={(e) => set("description", e.target.value)} /></label><div className="spec-field-group"><b>Thông số kỹ thuật</b><div className="form-two spec-fields">{SPEC_FIELDS.map((field) => <label key={field}>{field}<input value={product.specs?.[field] || ""} onChange={(e) => setSpec(field, e.target.value)} /></label>)}</div></div><div className="check-row"><label><input type="checkbox" checked={Boolean(product.featured)} onChange={(e) => set("featured", e.target.checked)} /> Nổi bật</label><label><input type="checkbox" checked={Boolean(product.bestseller)} onChange={(e) => set("bestseller", e.target.checked)} /> Bán chạy</label><label><input type="checkbox" checked={Boolean(product.isNew)} onChange={(e) => set("isNew", e.target.checked)} /> Sản phẩm mới</label></div><div className="modal-actions"><button type="button" className="button button-ghost" onClick={onClose}>Hủy</button><button className="button button-dark" disabled={saving}>{saving ? <Loader2 className="spin" size={16} /> : <Check size={16} />} Lưu sản phẩm</button></div></form></div></div>;
}
function OrderAdmin() {
  const query = useQueryClient();
  const orders = useListOrders(undefined, { query: { staleTime: 15_000 } as any });
  const update = useUpdateOrderStatus();
  const remove = useDeleteOrder();
  const [selected, setSelected] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const statuses = ["new", "confirmed", "preparing", "shipped", "delivered", "cancelled", "failed_delivery"] as const;
  const filtered = (orders.data || [])
    .filter((o) => !statusFilter || o.status === statusFilter)
    .filter((o) => !dateFrom || new Date(o.createdAt) >= new Date(dateFrom))
    .filter((o) => !dateTo || new Date(o.createdAt) < new Date(new Date(dateTo).getTime() + 86400000))
    .sort((a, b) => {
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "total-desc") return b.total - a.total;
      if (sortBy === "total-asc") return a.total - b.total;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  const pager = usePager(filtered, 10, `${statusFilter}|${sortBy}|${dateFrom}|${dateTo}`);
  const deleteOrder = (order: Order) => {
    if (!window.confirm(`Xóa đơn hàng #${order.id} của ${order.customerName}? Không thể hoàn tác.`)) return;
    remove.mutate({ id: order.id }, {
      onSuccess: () => {
        if (selected?.id === order.id) setSelected(null);
        query.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        query.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
      },
    });
  };
  return <div className="admin-page"><AdminPageHeader eyebrow="FULFILLMENT" title="Đơn hàng" description="Theo dõi và cập nhật trạng thái đơn hàng." /><div className="admin-panel"><div className="order-filter"><span>{filtered.length} / {orders.data?.length ?? 0} đơn hàng</span><div className="order-filter-controls"><label className="order-date-field">Từ ngày<input type="date" value={dateFrom} max={dateTo || undefined} onChange={(e) => setDateFrom(e.target.value)} /></label><label className="order-date-field">Đến ngày<input type="date" value={dateTo} min={dateFrom || undefined} onChange={(e) => setDateTo(e.target.value)} /></label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="">Tất cả trạng thái</option>{statuses.map((s) => <option value={s} key={s}>{statusLabel(s)}</option>)}</select><select value={sortBy} onChange={(e) => setSortBy(e.target.value)}><option value="newest">Mới nhất</option><option value="oldest">Cũ nhất</option><option value="total-desc">Tổng tiền cao đến thấp</option><option value="total-asc">Tổng tiền thấp đến cao</option></select></div></div>{orders.isLoading ? <ProductSkeleton /> : filtered.length ? <><OrderTable orders={pager.pageItems} onSelect={setSelected} onDelete={deleteOrder} /><Pagination page={pager.page} pageCount={pager.pageCount} onChange={pager.setPage} /></> : <EmptyState text="Không có đơn hàng phù hợp." />}</div>{selected && <div className="modal-backdrop"><div className="modal order-detail"><div className="modal-heading"><div><p className="eyebrow">ĐƠN HÀNG #{selected.id}</p><h2>{selected.customerName}</h2></div><button onClick={() => setSelected(null)}><X size={20} /></button></div><div className="order-meta"><span><Phone size={15} /> {selected.phone}</span><span><Truck size={15} /> {selected.address}</span><span><CreditCard size={15} /> {selected.paymentMethod === "cod" ? "Thanh toán COD" : "Chuyển khoản"}</span></div><div className="order-detail-lines">{selected.items.map((item) => <div key={`${item.productId}-${item.size}-${item.color}`}><span>{item.productName} <small>× {item.quantity} {item.size && `· ${item.size}`} {item.color && `· ${item.color}`}</small></span><b>{money(item.price * item.quantity)}</b></div>)}</div><div className="summary-total"><span>Tổng đơn</span><b>{money(selected.total)}</b></div><label>Trạng thái<select value={selected.status} onChange={(e) => update.mutate({ id: selected.id, data: { status: e.target.value as any } }, { onSuccess: (order) => { setSelected(order); query.invalidateQueries({ queryKey: getListOrdersQueryKey() }); query.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() }); } })}>{statuses.map((status) => <option value={status} key={status}>{statusLabel(status)}</option>)}</select></label><div className="modal-actions"><button type="button" className="button button-ghost" onClick={() => deleteOrder(selected)}><Trash2 size={16} /> Xóa đơn hàng</button></div></div></div>}</div>;
}
function OrderTable({ orders, onSelect, onDelete }: { orders: Order[]; onSelect?: (order: Order) => void; onDelete?: (order: Order) => void }) { return <div className="order-table"><div className="order-table-head"><span>Đơn hàng</span><span>Khách hàng</span><span>Ngày đặt</span><span>Tổng tiền</span><span>Trạng thái</span><span></span></div>{orders.map((order) => <div className="order-row" key={order.id} onClick={() => onSelect?.(order)}><span><b>#{order.id}</b><small>{order.items.length} sản phẩm</small></span><span>{order.customerName}<small>{order.phone}</small></span><span>{date(order.createdAt)}</span><strong>{money(order.total)}</strong><span className={`status status-${order.status}`}>{statusLabel(order.status)}</span><button type="button" className="order-row-delete" onClick={(e) => { e.stopPropagation(); onDelete?.(order); }} aria-label="Xóa đơn hàng"><Trash2 size={15} /></button></div>)}</div>; }
function statusLabel(status: string) { return ({ new: "Đơn mới", confirmed: "Đã xác nhận", preparing: "Đang chuẩn bị", shipped: "Đang giao", delivered: "Đã giao", cancelled: "Đã hủy", failed_delivery: "Giao thất bại" } as Record<string, string>)[status] || status; }

export default App;