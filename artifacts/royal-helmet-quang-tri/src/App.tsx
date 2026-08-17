import { FormEvent, useEffect, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight, BadgeCheck, Banknote, Check, ChevronDown, ChevronLeft, ChevronRight,
  CircleAlert, ClipboardList, CreditCard, Facebook, Filter, Heart, Instagram, LayoutDashboard,
  Loader2, LogOut, Menu, Package, Pencil, Phone, Plus, Search, ShieldCheck, ShoppingBag,
  ShoppingCart, Star, Trash2, Truck, UserRound, X,
} from "lucide-react";
import {
  useAdminLogin, useAdminLogout, useCreateOrder, useCreateProduct, useDeleteProduct,
  useGetAdminSession, useGetAdminStats, useGetProduct, useListAdminProducts, useListOrders,
  useListProducts, useUpdateOrderStatus, useUpdateProduct,
  getGetAdminSessionQueryKey, getGetAdminStatsQueryKey, getListAdminProductsQueryKey,
  getListOrdersQueryKey, getListProductsQueryKey, type Order, type OrderInput,
  type Product, type ProductInput, type ListProductsParams,
} from "@workspace/api-client-react";
import { ErrorBoundary } from "@/components/error-boundary";
import NotFound from "@/pages/not-found";
import { Route, Switch, Link, useLocation, useRoute, Router as WouterRouter } from "wouter";

const queryClient = new QueryClient();
const money = (value: number) => new Intl.NumberFormat("vi-VN").format(value) + "đ";
const date = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
const imageFallback = "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=85";
const categories = [
  { value: "fullface", label: "Mũ Fullface", image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=85" },
  { value: "3/4", label: "Mũ 3/4", image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=85" },
  { value: "1/2", label: "Mũ 1/2", image: "https://images.unsplash.com/photo-1558980664-10e7170d03c9?auto=format&fit=crop&w=800&q=85" },
];

type CartItem = { product: Product; quantity: number; size?: string; color?: string };

function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem("royal-helmet-cart") || "[]"); } catch { return []; }
  });
  useEffect(() => localStorage.setItem("royal-helmet-cart", JSON.stringify(items)), [items]);
  const add = (product: Product, quantity = 1, size?: string, color?: string) =>
    setItems((current) => {
      const index = current.findIndex((item) => item.product.id === product.id && item.size === size && item.color === color);
      if (index < 0) return [...current, { product, quantity, size, color }];
      return current.map((item, i) => i === index ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) } : item);
    });
  const update = (index: number, quantity: number) =>
    setItems((current) => current.map((item, i) => i === index ? { ...item, quantity: Math.max(1, Math.min(quantity, item.product.stock)) } : item));
  const remove = (index: number) => setItems((current) => current.filter((_, i) => i !== index));
  const clear = () => setItems([]);
  return { items, add, update, remove, clear, total: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0), count: items.reduce((sum, item) => sum + item.quantity, 0) };
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
            <Route path="/admin/login" component={AdminLogin} />
            <Route path="/admin" component={() => <AdminShell><Dashboard /></AdminShell>} />
            <Route path="/admin/products" component={() => <AdminShell><ProductAdmin /></AdminShell>} />
            <Route path="/admin/orders" component={() => <AdminShell><OrderAdmin /></AdminShell>} />
            <Route component={NotFound} />
          </Switch>
        </ErrorBoundary>
      </WouterRouter>
    </QueryClientProvider>
  );
}

function Storefront({ children }: { children: React.ReactNode }) {
  const cart = useCart();
  const [menu, setMenu] = useState(false);
  return (
    <div className="site">
      <div className="announcement"><span>Giao hàng toàn quốc</span><span>Đổi size trong 7 ngày</span><span>Bảo hành chính hãng</span></div>
      <header className="header">
        <div className="container header-inner">
          <button className="icon-button mobile-menu" onClick={() => setMenu(!menu)} aria-label="Mở menu"><Menu size={20} /></button>
          <Link href="/" className="brand"><span className="brand-mark">R</span><span><b>ROYAL</b><small>HELMET QUẢNG TRỊ</small></span></Link>
          <nav className={menu ? "nav open" : "nav"}>
            <Link href="/products">Sản phẩm</Link><Link href="/products?category=fullface">Fullface</Link><Link href="/products?category=3/4">3/4</Link><Link href="/policies">Chính sách</Link>
          </nav>
          <div className="header-actions">
            <Link href="/products" className="icon-button" aria-label="Tìm kiếm"><Search size={20} /></Link>
            <Link href="/cart" className="cart-link" aria-label="Giỏ hàng"><ShoppingCart size={21} /><span>{cart.count}</span></Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="footer">
        <div className="container footer-grid">
          <div><Link href="/" className="brand footer-brand"><span className="brand-mark">R</span><span><b>ROYAL</b><small>HELMET QUẢNG TRỊ</small></span></Link><p>Mũ bảo hiểm chính hãng Royal, chọn chuẩn size, giao tận nơi tại Quảng Trị và toàn quốc.</p><div className="socials"><a href="#" aria-label="Facebook"><Facebook size={17} /></a><a href="#" aria-label="Instagram"><Instagram size={17} /></a></div></div>
          <div><h4>Mua hàng</h4><Link href="/products">Tất cả sản phẩm</Link><Link href="/products?sort=featured">Sản phẩm nổi bật</Link><Link href="/cart">Giỏ hàng</Link></div>
          <div><h4>Hỗ trợ</h4><Link href="/policies">Giao hàng & đổi size</Link><Link href="/policies#warranty">Bảo hành</Link><Link href="/policies#size">Hướng dẫn chọn size</Link></div>
          <div><h4>Liên hệ</h4><a href="tel:0900000000"><Phone size={15} /> 0900 000 000</a><p>Quảng Trị, Việt Nam<br />Thứ 2 — Chủ nhật, 8:00 — 21:00</p></div>
        </div>
        <div className="container footer-bottom"><span>© 2026 Royal Helmet Quảng Trị</span><Link href="/admin/login">Quản trị viên</Link></div>
      </footer>
    </div>
  );
}

function Home() {
  const products = useQueryProducts({ limit: 12 });
  const featured = products.data?.filter((p) => p.featured || p.bestseller).slice(0, 4) ?? [];
  const newItems = products.data?.filter((p) => p.isNew).slice(0, 4) ?? [];
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy animate-rise"><p className="eyebrow">ROYAL HELMET / QUẢNG TRỊ</p><h1>Bảo vệ điều<br /><em>quan trọng.</em></h1><p className="hero-lead">Mũ bảo hiểm Royal chính hãng, vừa vặn với hành trình của bạn. Tư vấn thật, giao nhanh, hậu mãi rõ ràng.</p><div className="hero-actions"><Link href="/products" className="button button-dark">Khám phá sản phẩm <ArrowRight size={17} /></Link><Link href="/policies#size" className="text-link">Tìm size phù hợp <ArrowRight size={15} /></Link></div></div>
          <div className="hero-visual"><div className="hero-orb"></div><img src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=90" alt="Mũ bảo hiểm Royal" /><span className="hero-stamp">RIDE<br /><b>SAFE</b></span></div>
        </div>
      </section>
      <section className="trust-strip"><div className="container trust-items"><div><ShieldCheck size={21} /><span><b>Chính hãng 100%</b><small>Kiểm tra nguồn gốc rõ ràng</small></span></div><div><Truck size={21} /><span><b>Giao hàng toàn quốc</b><small>Đóng gói cẩn thận, thu hộ COD</small></span></div><div><BadgeCheck size={21} /><span><b>Đổi size 7 ngày</b><small>Hỗ trợ tận tình sau khi nhận</small></span></div><div><Heart size={21} /><span><b>Tư vấn có tâm</b><small>Chọn đúng ngay từ lần đầu</small></span></div></div></section>
      <section className="section container"><div className="section-heading"><div><p className="eyebrow">BỘ SƯU TẬP</p><h2>Chọn theo phong cách</h2></div><Link href="/products" className="text-link">Xem tất cả <ArrowRight size={15} /></Link></div><div className="category-grid">{categories.map((cat) => <Link key={cat.value} href={`/products?category=${cat.value}`} className="category-card"><img src={cat.image} alt={cat.label} /><div><span>{cat.label}</span><ArrowRight size={18} /></div></Link>)}</div></section>
      <ProductSection eyebrow="ĐƯỢC YÊU THÍCH" title="Những lựa chọn nổi bật" products={featured} loading={products.isLoading} />
      <section className="editorial"><div className="container editorial-grid"><div><p className="eyebrow">CHỌN MŨ ĐÚNG — ĐI XA HƠN</p><h2>Chiếc mũ tốt<br /><em>là người bạn đường.</em></h2><p>Từ những chuyến đi hàng ngày đến cung đường cuối tuần, Royal mang đến sự cân bằng giữa an toàn, thoải mái và cá tính.</p><Link href="/policies" className="button button-light">Xem chính sách hậu mãi <ArrowRight size={17} /></Link></div><div className="editorial-note"><span>01</span><p>Không chọn mũ chỉ vì đẹp.<br /><b>Hãy chọn chiếc mũ vừa với bạn.</b></p><span>02</span><p>Không chạy theo giá rẻ.<br /><b>Hãy chọn sự an tâm.</b></p></div></div></section>
      <ProductSection eyebrow="MỚI VỀ" title="Sẵn sàng cho hành trình mới" products={newItems} loading={products.isLoading} />
    </>
  );
}

function useQueryProducts(params?: ListProductsParams) {
  return useListProducts(params, { query: { staleTime: 30_000 } as any });
}

function ProductSection({ eyebrow, title, products, loading }: { eyebrow: string; title: string; products: Product[]; loading: boolean }) {
  return <section className="section container"><div className="section-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div><Link href="/products" className="text-link">Xem thêm <ArrowRight size={15} /></Link></div>{loading ? <ProductSkeleton /> : products.length ? <div className="product-grid">{products.map((p) => <ProductCard key={p.id} product={p} />)}</div> : <EmptyState text="Sản phẩm đang được cập nhật." />}</section>;
}

function ProductSkeleton() { return <div className="product-grid">{[1, 2, 3, 4].map((i) => <div className="product-skeleton" key={i}><div /><span /><small /></div>)}</div>; }

function ProductCard({ product }: { product: Product }) {
  const [, setLocation] = useLocation();
  return <article className="product-card"><Link href={`/p/${product.slug}`} className="product-image"><img src={product.thumbnail || imageFallback} alt={product.name} /><div className="product-badges">{product.compareAtPrice && <span className="badge sale">Sale</span>}{product.isNew && <span className="badge">Mới</span>}</div><button className="quick-add" onClick={(e) => { e.preventDefault(); setLocation(`/p/${product.slug}`); }}><ShoppingBag size={16} /> Xem chi tiết</button></Link><div className="product-info"><p className="product-category">{product.category}</p><Link href={`/p/${product.slug}`} className="product-name">{product.name}</Link><div className="product-price"><b>{money(product.price)}</b>{product.compareAtPrice && <del>{money(product.compareAtPrice)}</del>}</div><div className="product-stock">{product.stock > 0 ? `Còn ${product.stock} sản phẩm` : "Tạm hết hàng"}</div></div></article>;
}

function Catalog() {
  const [, setLocation] = useLocation();
  const query = new URLSearchParams(window.location.search);
  const [search, setSearch] = useState(query.get("q") || "");
  const [category, setCategory] = useState(query.get("category") || "");
  const [sort, setSort] = useState(query.get("sort") || "newest");
  const result = useListProducts({ q: search || undefined, category: category || undefined, sort: sort as any, limit: 100 });
  return <section className="catalog-page container"><div className="breadcrumbs"><Link href="/">Trang chủ</Link><ChevronRight size={14} /><span>Sản phẩm</span></div><div className="catalog-heading"><div><p className="eyebrow">ROYAL COLLECTION</p><h1>Tất cả sản phẩm</h1><p>Thiết kế cho những người không đứng yên.</p></div><div className="catalog-search"><Search size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm tên sản phẩm..." /></div></div><div className="catalog-toolbar"><div className="filter-pills"><button className={!category ? "active" : ""} onClick={() => setCategory("")}>Tất cả</button>{categories.map((cat) => <button className={category === cat.value ? "active" : ""} onClick={() => setCategory(cat.value)} key={cat.value}>{cat.label}</button>)}</div><label className="sort-select"><Filter size={16} /><span>Sắp xếp</span><select value={sort} onChange={(e) => setSort(e.target.value)}><option value="newest">Mới nhất</option><option value="featured">Nổi bật</option><option value="price-asc">Giá thấp đến cao</option><option value="price-desc">Giá cao đến thấp</option></select><ChevronDown size={15} /></label></div>{result.isLoading ? <ProductSkeleton /> : result.isError ? <ErrorState /> : result.data?.length ? <div className="product-grid catalog-grid">{result.data.map((p) => <ProductCard key={p.id} product={p} />)}</div> : <EmptyState text="Không tìm thấy sản phẩm phù hợp." action={<button className="button button-dark" onClick={() => { setSearch(""); setCategory(""); setLocation("/products"); }}>Xóa bộ lọc</button>} />}</section>;
}

function ProductDetail() {
  const [, params] = useRoute("/p/:slug");
  const { data: product, isLoading, isError } = useGetProduct(params?.slug || "");
  const cart = useCart();
  const [, setLocation] = useLocation();
  const [image, setImage] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  useEffect(() => { if (product) { setImage(product.thumbnail); setSize(product.sizes?.[0] || ""); setColor(product.colors?.[0] || ""); } }, [product]);
  if (isLoading) return <div className="container page-state"><Loader2 className="spin" size={28} /> Đang tải sản phẩm...</div>;
  if (isError || !product) return <div className="container page-state"><CircleAlert size={28} /> Không tìm thấy sản phẩm.</div>;
  const images = [product.thumbnail, ...(product.images || []).filter((item) => item !== product.thumbnail)];
  const add = (goCheckout = false) => { cart.add(product, quantity, size || undefined, color || undefined); setLocation(goCheckout ? "/checkout" : "/cart"); };
  return <section className="container detail-page"><div className="breadcrumbs"><Link href="/">Trang chủ</Link><ChevronRight size={14} /><Link href="/products">Sản phẩm</Link><ChevronRight size={14} /><span>{product.name}</span></div><div className="detail-grid"><div className="gallery"><div className="gallery-main"><img src={image || imageFallback} alt={product.name} /></div><div className="gallery-thumbs">{images.map((item) => <button className={image === item ? "selected" : ""} onClick={() => setImage(item)} key={item}><img src={item} alt="" /></button>)}</div></div><div className="detail-copy"><p className="product-category">{product.category} {product.sku && ` / ${product.sku}`}</p><h1>{product.name}</h1><div className="detail-rating"><span><Star size={15} fill="currentColor" /> 4.9</span><span>Đã kiểm tra chất lượng</span></div><div className="detail-price"><b>{money(product.price)}</b>{product.compareAtPrice && <del>{money(product.compareAtPrice)}</del>}{product.compareAtPrice && <span>-{Math.round((1 - product.price / product.compareAtPrice) * 100)}%</span>}</div><p className="detail-description">{product.description || "Mũ bảo hiểm Royal chính hãng, thiết kế chắc chắn và thoải mái cho mỗi hành trình."}</p>{product.sizes?.length > 0 && <OptionPicker label="Kích thước" options={product.sizes} value={size} onChange={setSize} />}{product.colors?.length > 0 && <OptionPicker label="Màu sắc" options={product.colors} value={color} onChange={setColor} />}{product.stock > 0 ? <><div className="buy-row"><div className="quantity"><button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button><span>{quantity}</span><button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>+</button></div><button className="button button-dark grow" onClick={() => add(false)}><ShoppingBag size={17} /> Thêm vào giỏ</button></div><button className="button button-accent full" onClick={() => add(true)}>Mua ngay <ArrowRight size={17} /></button></> : <div className="sold-out">Sản phẩm tạm hết hàng</div>}<div className="detail-promises"><div><Truck size={18} /><span><b>Giao hàng toàn quốc</b><small>Nhận hàng kiểm tra trước khi thanh toán</small></span></div><div><ShieldCheck size={18} /><span><b>Bảo hành chính hãng</b><small>{product.warranty || "12 tháng"}</small></span></div><div><BadgeCheck size={18} /><span><b>Đổi size trong 7 ngày</b><small>Hỗ trợ chọn lại vừa vặn hơn</small></span></div></div></div></div>{product.specs && Object.keys(product.specs).length > 0 && <div className="specs"><p className="eyebrow">THÔNG SỐ</p><h2>Chi tiết sản phẩm</h2><div className="spec-table">{Object.entries(product.specs).map(([key, value]) => <div key={key}><span>{key}</span><b>{value}</b></div>)}</div></div>}</section>;
}

function OptionPicker({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return <div className="option-picker"><div><b>{label}</b><span>{value}</span></div><div className="options">{options.map((option) => <button className={value === option ? "selected" : ""} onClick={() => onChange(option)} key={option}>{option}</button>)}</div></div>;
}

function CartPage({ checkout = false }: { checkout?: boolean }) {
  const cart = useCart();
  const [, setLocation] = useLocation();
  const orderMutation = useCreateOrder();
  const [form, setForm] = useState({ customerName: "", phone: "", address: "", note: "", paymentMethod: "cod" as "cod" | "bank_transfer" });
  const [submitted, setSubmitted] = useState(false);
  if (!cart.items.length && !submitted) return <div className="container page-state cart-empty"><ShoppingCart size={42} /><h1>Giỏ hàng đang trống</h1><p>Hãy chọn một chiếc mũ phù hợp cho hành trình tiếp theo.</p><Link className="button button-dark" href="/products">Mua sắm ngay <ArrowRight size={16} /></Link></div>;
  const submit = (event: FormEvent) => { event.preventDefault(); const payload: OrderInput = { ...form, items: cart.items.map((item) => ({ productId: item.product.id, quantity: item.quantity, size: item.size || null, color: item.color || null })) }; orderMutation.mutate({ data: payload }, { onSuccess: (result) => { cart.clear(); setSubmitted(true); setLocation(`/order-success/${result.orderId}`); } }); };
  return <section className="container cart-page"><div className="breadcrumbs"><Link href="/">Trang chủ</Link><ChevronRight size={14} /><span>{checkout ? "Đặt hàng" : "Giỏ hàng"}</span></div>{!checkout && <div className="cart-title"><div><p className="eyebrow">YOUR RIDE STARTS HERE</p><h1>Giỏ hàng</h1></div><span>{cart.count} sản phẩm</span></div>}<div className="cart-layout"><div className="cart-lines">{cart.items.map((item, index) => <div className="cart-line" key={`${item.product.id}-${index}`}><img src={item.product.thumbnail || imageFallback} alt="" /><div className="cart-line-info"><Link href={`/p/${item.product.slug}`}>{item.product.name}</Link><small>{item.size && `Size ${item.size}`} {item.color && ` · ${item.color}`}</small><b>{money(item.product.price)}</b></div><div className="quantity"><button onClick={() => cart.update(index, item.quantity - 1)}>−</button><span>{item.quantity}</span><button onClick={() => cart.update(index, item.quantity + 1)}>+</button></div><button className="remove-button" aria-label="Xóa sản phẩm" onClick={() => cart.remove(index)}><Trash2 size={17} /></button></div>)}{!checkout && <Link href="/products" className="continue-link"><ChevronLeft size={16} /> Tiếp tục mua sắm</Link>}</div><aside className="cart-summary">{!checkout ? <><div className="summary-header"><h3>Tóm tắt đơn hàng</h3><span>{cart.count} món</span></div><div className="summary-row"><span>Tạm tính</span><b>{money(cart.total)}</b></div><div className="summary-row"><span>Phí vận chuyển</span><b>Liên hệ</b></div><div className="summary-total"><span>Tổng cộng</span><b>{money(cart.total)}</b></div><button className="button button-dark full" onClick={() => setLocation("/checkout")}>Tiến hành đặt hàng <ArrowRight size={16} /></button><p className="summary-note"><ShieldCheck size={14} /> Thanh toán an toàn khi nhận hàng</p></> : <form onSubmit={submit}><div className="summary-header"><h3>Thông tin nhận hàng</h3></div><label>Họ và tên<input required minLength={2} value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} placeholder="Nguyễn Văn A" /></label><label>Số điện thoại<input required minLength={8} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0900 000 000" /></label><label>Địa chỉ nhận hàng<textarea required minLength={5} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Số nhà, đường, phường/xã, tỉnh..." /></label><label>Ghi chú đơn hàng <span className="optional">(không bắt buộc)</span><textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Ví dụ: Gọi trước khi giao" /></label><div className="payment-options"><b>Phương thức thanh toán</b><label className={form.paymentMethod === "cod" ? "payment-option selected" : "payment-option"}><input type="radio" checked={form.paymentMethod === "cod"} onChange={() => setForm({ ...form, paymentMethod: "cod" })} /> <Banknote size={17} /><span><b>Thanh toán khi nhận hàng</b><small>Kiểm tra mũ trước khi thanh toán</small></span></label><label className={form.paymentMethod === "bank_transfer" ? "payment-option selected" : "payment-option"}><input type="radio" checked={form.paymentMethod === "bank_transfer"} onChange={() => setForm({ ...form, paymentMethod: "bank_transfer" })} /> <CreditCard size={17} /><span><b>Chuyển khoản ngân hàng</b><small>Thông tin chuyển khoản gửi sau khi đặt</small></span></label></div><div className="summary-total"><span>Tổng thanh toán</span><b>{money(cart.total)}</b></div><button className="button button-accent full" disabled={orderMutation.isPending}>{orderMutation.isPending ? <Loader2 className="spin" size={16} /> : <Check size={16} />} {orderMutation.isPending ? "Đang gửi đơn..." : "Xác nhận đặt hàng"}</button>{orderMutation.isError && <p className="form-error"><CircleAlert size={15} /> Không thể tạo đơn. Vui lòng kiểm tra tồn kho và thử lại.</p>}</form>}</aside></div></section>;
}

function OrderSuccess() {
  const [, params] = useRoute("/order-success/:id");
  return <div className="container page-state success-state"><div className="success-icon"><Check size={30} /></div><p className="eyebrow">ĐẶT HÀNG THÀNH CÔNG</p><h1>Cảm ơn bạn đã tin chọn Royal.</h1><p>Đơn hàng <b>#{params?.id}</b> đã được ghi nhận. Chúng tôi sẽ gọi xác nhận trong thời gian sớm nhất.</p><div className="success-actions"><Link href="/products" className="button button-dark">Tiếp tục mua sắm</Link><a href="tel:0900000000" className="text-link">Cần hỗ trợ? Gọi 0900 000 000</a></div></div>;
}

function Policies() {
  return <section className="container policy-page"><div className="breadcrumbs"><Link href="/">Trang chủ</Link><ChevronRight size={14} /><span>Chính sách</span></div><div className="policy-hero"><p className="eyebrow">ROYAL CARE</p><h1>Mua mũ dễ dàng.<br /><em>Yên tâm dài lâu.</em></h1><p>Những điều bạn cần biết trước và sau khi sở hữu chiếc mũ Royal.</p></div><div className="policy-grid"><Policy icon={<Truck />} title="Giao hàng" id="shipping"><p>Đơn hàng được đóng gói cẩn thận và giao toàn quốc. Thời gian dự kiến 2–5 ngày làm việc tùy khu vực. Hỗ trợ kiểm tra hàng trước khi thanh toán với đơn COD.</p></Policy><Policy icon={<BadgeCheck />} title="Đổi size trong 7 ngày" id="size"><p>Nếu mũ không vừa, bạn có thể liên hệ trong vòng 7 ngày từ khi nhận hàng để được hỗ trợ đổi size. Mũ cần còn nguyên tem, chưa qua sử dụng và không có dấu hiệu trầy xước.</p><p className="policy-tip">Mẹo chọn size: dùng thước dây đo vòng đầu tại vị trí rộng nhất, ngang trên lông mày. Gửi số đo cho chúng tôi để được tư vấn.</p></Policy><Policy icon={<ShieldCheck />} title="Bảo hành chính hãng" id="warranty"><p>Sản phẩm Royal được bảo hành theo chính sách chính hãng, hỗ trợ các lỗi kỹ thuật từ nhà sản xuất. Không áp dụng cho hư hỏng do va chạm, tác động ngoại lực hoặc sử dụng sai hướng dẫn.</p></Policy><Policy icon={<CreditCard />} title="Thanh toán"><p>Thanh toán khi nhận hàng (COD) hoặc chuyển khoản ngân hàng. Chúng tôi không yêu cầu bạn cung cấp mã OTP hay thông tin thẻ qua tin nhắn.</p></Policy></div></section>;
}
function Policy({ icon, title, id, children }: { icon: React.ReactNode; title: string; id?: string; children: React.ReactNode }) { return <article className="policy-card" id={id}><div className="policy-icon">{icon}</div><h2>{title}</h2>{children}</article>; }
function EmptyState({ text, action }: { text: string; action?: React.ReactNode }) { return <div className="empty-state"><Package size={28} /><p>{text}</p>{action}</div>; }
function ErrorState() { return <div className="empty-state"><CircleAlert size={28} /><p>Không thể tải dữ liệu. Vui lòng thử lại.</p></div>; }

function AdminLogin() {
  const [, setLocation] = useLocation();
  const mutation = useAdminLogin();
  const [form, setForm] = useState({ username: "", password: "" });
  const submit = (e: FormEvent) => { e.preventDefault(); mutation.mutate({ data: form }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetAdminSessionQueryKey() }); setLocation("/admin"); } }); };
  return <div className="admin-login"><div className="login-panel"><Link href="/" className="brand"><span className="brand-mark">R</span><span><b>ROYAL</b><small>HELMET QUẢNG TRỊ</small></span></Link><div className="login-heading"><p className="eyebrow">KHU VỰC QUẢN TRỊ</p><h1>Chào mừng<br />quay trở lại.</h1><p>Quản lý sản phẩm và đơn hàng của Royal Helmet Quảng Trị.</p></div><form onSubmit={submit}><label>Tên đăng nhập<input autoComplete="username" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="admin" /></label><label>Mật khẩu<input type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" /></label>{mutation.isError && <p className="form-error"><CircleAlert size={15} /> Sai tên đăng nhập hoặc mật khẩu.</p>}<button className="button button-dark full" disabled={mutation.isPending}>{mutation.isPending ? <Loader2 className="spin" size={16} /> : null} Đăng nhập</button></form><Link href="/" className="back-link"><ChevronLeft size={15} /> Quay về cửa hàng</Link></div><div className="login-visual"><div><p className="eyebrow">ROYAL / ADMIN</p><h2>Một cửa hàng tốt bắt đầu từ những chi tiết được chăm sóc.</h2></div></div></div>;
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useGetAdminSession();
  const [, setLocation] = useLocation();
  const logout = useAdminLogout();
  useEffect(() => { if (!isLoading && !data?.authenticated) setLocation("/admin/login"); }, [data, isLoading, setLocation]);
  if (isLoading || !data?.authenticated) return <div className="page-state"><Loader2 className="spin" size={26} /></div>;
  return <div className="admin-layout"><aside className="admin-sidebar"><Link href="/admin" className="brand admin-brand"><span className="brand-mark">R</span><span><b>ROYAL</b><small>BACK OFFICE</small></span></Link><p className="sidebar-label">QUẢN LÝ CỬA HÀNG</p><nav><Link href="/admin"><LayoutDashboard size={17} /> Tổng quan</Link><Link href="/admin/products"><Package size={17} /> Sản phẩm</Link><Link href="/admin/orders"><ClipboardList size={17} /> Đơn hàng</Link></nav><div className="sidebar-bottom"><Link href="/" className="sidebar-store"><ArrowRight size={16} /> Về cửa hàng</Link><button onClick={() => logout.mutate(undefined, { onSuccess: () => setLocation("/admin/login") })}><LogOut size={16} /> Đăng xuất</button></div></aside><div className="admin-content"><div className="admin-mobile-top"><Link href="/admin" className="brand"><span className="brand-mark">R</span><b>ROYAL</b></Link><Link href="/" className="text-link">Cửa hàng <ArrowRight size={15} /></Link></div>{children}</div></div>;
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
  const blank: ProductInput = { name: "", category: "3/4", price: 0, compareAtPrice: null, thumbnail: "", images: [], description: "", specs: {}, sizes: [], colors: [], stock: 0, warranty: "Bảo hành chính hãng 12 tháng", featured: false, bestseller: false, isNew: true };
  const [form, setForm] = useState<ProductInput>(blank);
  const open = (product?: Product) => { setEditing(product || null); setForm(product ? { ...product, sku: product.sku ?? null, compareAtPrice: product.compareAtPrice ?? null } : blank); setShowForm(true); };
  const submit = (e: FormEvent) => { e.preventDefault(); const payload = { ...form, images: form.images?.length ? form.images : [form.thumbnail], sizes: form.sizes || [], colors: form.colors || [] }; const done = () => { setShowForm(false); query.invalidateQueries({ queryKey: getListAdminProductsQueryKey() }); query.invalidateQueries({ queryKey: getListProductsQueryKey() }); }; editing ? update.mutate({ id: editing.id, data: payload }, { onSuccess: done }) : create.mutate({ data: payload }, { onSuccess: done }); };
  const deleteProduct = (product: Product) => { if (window.confirm(`Xóa "${product.name}"?`)) remove.mutate({ id: product.id }, { onSuccess: () => query.invalidateQueries({ queryKey: getListAdminProductsQueryKey() }) }); };
  return <div className="admin-page"><AdminPageHeader eyebrow="CATALOG" title="Sản phẩm" description={`${products.data?.length ?? 0} sản phẩm trong cửa hàng.`} action={<button className="button button-dark" onClick={() => open()}><Plus size={17} /> Thêm sản phẩm</button>} /><div className="admin-panel">{products.isLoading ? <ProductSkeleton /> : <div className="admin-product-list">{products.data?.map((p) => <div className="admin-product-row" key={p.id}><img src={p.thumbnail || imageFallback} alt="" /><div><b>{p.name}</b><small>{p.category} · {p.sku || "Chưa có SKU"}</small></div><span className={p.stock < 5 ? "stock-low" : "stock-ok"}>{p.stock} tồn kho</span><strong>{money(p.price)}</strong><div className="row-actions"><button onClick={() => open(p)} aria-label="Sửa"><Pencil size={16} /></button><button onClick={() => deleteProduct(p)} aria-label="Xóa"><Trash2 size={16} /></button></div></div>)}</div>}</div>{showForm && <ProductForm product={form} setProduct={setForm} onSubmit={submit} onClose={() => setShowForm(false)} saving={create.isPending || update.isPending} editing={Boolean(editing)} />}</div>;
}
function ProductForm({ product, setProduct, onSubmit, onClose, saving, editing }: { product: ProductInput; setProduct: React.Dispatch<React.SetStateAction<ProductInput>>; onSubmit: (e: FormEvent) => void; onClose: () => void; saving: boolean; editing: boolean }) {
  const set = (key: keyof ProductInput, value: any) => setProduct((current) => ({ ...current, [key]: value }));
  return <div className="modal-backdrop"><div className="modal product-form"><div className="modal-heading"><div><p className="eyebrow">{editing ? "CHỈNH SỬA" : "CATALOG"}</p><h2>{editing ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}</h2></div><button onClick={onClose}><X size={20} /></button></div><form onSubmit={onSubmit}><div className="form-two"><label>Tên sản phẩm<input required minLength={2} value={product.name} onChange={(e) => set("name", e.target.value)} /></label><label>Danh mục<select value={product.category} onChange={(e) => set("category", e.target.value)}><option value="1/2">Mũ 1/2</option><option value="3/4">Mũ 3/4</option><option value="fullface">Mũ Fullface</option></select></label><label>Giá bán (VNĐ)<input required type="number" min="0" value={product.price} onChange={(e) => set("price", Number(e.target.value))} /></label><label>Giá niêm yết<input type="number" min="0" value={product.compareAtPrice || ""} onChange={(e) => set("compareAtPrice", e.target.value ? Number(e.target.value) : null)} /></label><label>Ảnh đại diện (URL)<input required value={product.thumbnail} onChange={(e) => set("thumbnail", e.target.value)} placeholder="https://..." /></label><label>SKU<input value={product.sku || ""} onChange={(e) => set("sku", e.target.value || null)} /></label><label>Tồn kho<input type="number" min="0" value={product.stock || 0} onChange={(e) => set("stock", Number(e.target.value))} /></label><label>Size, phân cách bằng dấu phẩy<input value={product.sizes?.join(", ") || ""} onChange={(e) => set("sizes", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} placeholder="M, L, XL" /></label><label>Màu sắc, phân cách bằng dấu phẩy<input value={product.colors?.join(", ") || ""} onChange={(e) => set("colors", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} placeholder="Đen, Trắng" /></label></div><label>Mô tả<textarea required value={product.description} onChange={(e) => set("description", e.target.value)} /></label><label>Thông số (mỗi dòng: Tên: Giá trị)<textarea value={Object.entries(product.specs || {}).map(([k, v]) => `${k}: ${v}`).join("\n")} onChange={(e) => set("specs", Object.fromEntries(e.target.value.split("\n").filter(Boolean).map((line) => { const [key, ...rest] = line.split(":"); return [key.trim(), rest.join(":").trim()]; })))} /></label><div className="check-row"><label><input type="checkbox" checked={Boolean(product.featured)} onChange={(e) => set("featured", e.target.checked)} /> Nổi bật</label><label><input type="checkbox" checked={Boolean(product.bestseller)} onChange={(e) => set("bestseller", e.target.checked)} /> Bán chạy</label><label><input type="checkbox" checked={Boolean(product.isNew)} onChange={(e) => set("isNew", e.target.checked)} /> Sản phẩm mới</label></div><div className="modal-actions"><button type="button" className="button button-ghost" onClick={onClose}>Hủy</button><button className="button button-dark" disabled={saving}>{saving ? <Loader2 className="spin" size={16} /> : <Check size={16} />} Lưu sản phẩm</button></div></form></div></div>;
}
function OrderAdmin() {
  const query = useQueryClient();
  const orders = useListOrders(undefined, { query: { staleTime: 15_000 } as any });
  const update = useUpdateOrderStatus();
  const [selected, setSelected] = useState<Order | null>(null);
  const statuses = ["new", "confirmed", "preparing", "shipped", "delivered", "cancelled"] as const;
  return <div className="admin-page"><AdminPageHeader eyebrow="FULFILLMENT" title="Đơn hàng" description="Theo dõi và cập nhật trạng thái đơn hàng." /><div className="admin-panel"><div className="order-filter"><span>{orders.data?.length ?? 0} đơn hàng</span><select onChange={(e) => { /* server filter remains available through reload */ }}><option>Tất cả trạng thái</option><option>Đơn mới</option><option>Đang giao</option></select></div>{orders.isLoading ? <ProductSkeleton /> : orders.data?.length ? <OrderTable orders={orders.data} onSelect={setSelected} /> : <EmptyState text="Chưa có đơn hàng nào." />}</div>{selected && <div className="modal-backdrop"><div className="modal order-detail"><div className="modal-heading"><div><p className="eyebrow">ĐƠN HÀNG #{selected.id}</p><h2>{selected.customerName}</h2></div><button onClick={() => setSelected(null)}><X size={20} /></button></div><div className="order-meta"><span><Phone size={15} /> {selected.phone}</span><span><Truck size={15} /> {selected.address}</span><span><CreditCard size={15} /> {selected.paymentMethod === "cod" ? "Thanh toán COD" : "Chuyển khoản"}</span></div><div className="order-detail-lines">{selected.items.map((item) => <div key={`${item.productId}-${item.size}-${item.color}`}><span>{item.productName} <small>× {item.quantity} {item.size && `· ${item.size}`} {item.color && `· ${item.color}`}</small></span><b>{money(item.price * item.quantity)}</b></div>)}</div><div className="summary-total"><span>Tổng đơn</span><b>{money(selected.total)}</b></div><label>Trạng thái<select value={selected.status} onChange={(e) => update.mutate({ id: selected.id, data: { status: e.target.value as any } }, { onSuccess: (order) => { setSelected(order); query.invalidateQueries({ queryKey: getListOrdersQueryKey() }); query.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() }); } })}>{statuses.map((status) => <option value={status} key={status}>{statusLabel(status)}</option>)}</select></label></div></div>}</div>;
}
function OrderTable({ orders, onSelect }: { orders: Order[]; onSelect?: (order: Order) => void }) { return <div className="order-table"><div className="order-table-head"><span>Đơn hàng</span><span>Khách hàng</span><span>Ngày đặt</span><span>Tổng tiền</span><span>Trạng thái</span></div>{orders.map((order) => <button className="order-row" key={order.id} onClick={() => onSelect?.(order)}><span><b>#{order.id}</b><small>{order.items.length} sản phẩm</small></span><span>{order.customerName}<small>{order.phone}</small></span><span>{date(order.createdAt)}</span><strong>{money(order.total)}</strong><span className={`status status-${order.status}`}>{statusLabel(order.status)}</span></button>)}</div>; }
function statusLabel(status: string) { return ({ new: "Đơn mới", confirmed: "Đã xác nhận", preparing: "Đang chuẩn bị", shipped: "Đang giao", delivered: "Đã giao", cancelled: "Đã hủy", failed_delivery: "Giao thất bại" } as Record<string, string>)[status] || status; }

export default App;