import nodemailer from "nodemailer";
import { logger } from "./logger";

const gmailUser = process.env.GMAIL_USER;
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

const transporter =
  gmailUser && gmailAppPassword
    ? nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser, pass: gmailAppPassword },
      })
    : null;

const money = (value: number) => `${value.toLocaleString("vi-VN")}đ`;

type OrderConfirmationItem = {
  productName: string;
  price: number;
  quantity: number;
  size?: string | null;
  color?: string | null;
};

export type OrderConfirmationEmail = {
  orderId: number;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  total: number;
  paymentMethod: string;
  items: OrderConfirmationItem[];
};

export const sendOrderConfirmationEmail = async (order: OrderConfirmationEmail) => {
  if (!transporter) {
    logger.warn(
      "GMAIL_USER/GMAIL_APP_PASSWORD chưa được cấu hình, bỏ qua gửi email xác nhận đơn hàng",
    );
    return;
  }

  const itemsHtml = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;">
            ${item.productName}${item.size ? ` · Size ${item.size}` : ""}${item.color ? ` · ${item.color}` : ""}
            <br /><span style="color:#888;">Số lượng: ${item.quantity}</span>
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;">
            ${money(item.price * item.quantity)}
          </td>
        </tr>`,
    )
    .join("");

  const paymentLabel =
    order.paymentMethod === "bank_transfer" ? "Chuyển khoản ngân hàng" : "Thanh toán khi nhận hàng (COD)";

  const itemsText = order.items
    .map(
      (item) =>
        `- ${item.productName}${item.size ? ` · Size ${item.size}` : ""}${item.color ? ` · ${item.color}` : ""} x${item.quantity}: ${money(item.price * item.quantity)}`,
    )
    .join("\n");

  const text = `Xin chào ${order.customerName},

Cảm ơn bạn đã đặt hàng tại Royal Helmet Quảng Trị. Đơn hàng của bạn đã được ghi nhận, chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.

${itemsText}

Tổng cộng: ${money(order.total)}

Người nhận: ${order.customerName}
Điện thoại: ${order.phone}
Địa chỉ giao hàng: ${order.address}
Thanh toán: ${paymentLabel}

Mọi thắc mắc vui lòng liên hệ Zalo/Hotline 0858 925 982 hoặc ghé cửa hàng tại 06 Lê Lợi - Đông Hà - Quảng Trị.

Cảm ơn bạn đã tin chọn Royal Helmet Quảng Trị.`;

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;">
      <h2 style="color:#b8860b;">Royal Helmet Quảng Trị</h2>
      <p>Xin chào <b>${order.customerName}</b>,</p>
      <p>Cảm ơn bạn đã đặt hàng tại Royal Helmet Quảng Trị. Đơn hàng của bạn đã được ghi nhận, chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        ${itemsHtml}
        <tr>
          <td style="padding:10px 0;font-weight:bold;">Tổng cộng</td>
          <td style="padding:10px 0;font-weight:bold;text-align:right;">${money(order.total)}</td>
        </tr>
      </table>
      <p><b>Người nhận:</b> ${order.customerName}<br />
        <b>Điện thoại:</b> ${order.phone}<br />
        <b>Địa chỉ giao hàng:</b> ${order.address}<br />
        <b>Thanh toán:</b> ${paymentLabel}</p>
      <p style="margin-top:24px;">Mọi thắc mắc vui lòng liên hệ Zalo/Hotline <b>0858 925 982</b> hoặc ghé cửa hàng tại 06 Lê Lợi - Đông Hà - Quảng Trị.</p>
      <p style="color:#888;font-size:13px;">Cảm ơn bạn đã tin chọn Royal Helmet Quảng Trị.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Royal Helmet Quảng Trị" <${gmailUser}>`,
      to: order.email,
      subject: `Xác nhận đơn hàng - Royal Helmet Quảng Trị`,
      text,
      html,
    });
  } catch (err) {
    logger.error({ err, orderId: order.orderId }, "Gửi email xác nhận đơn hàng thất bại");
  }
};

export const sendPasswordResetEmail = async (email: string, resetUrl: string): Promise<boolean> => {
  if (!transporter) {
    logger.warn(
      "GMAIL_USER/GMAIL_APP_PASSWORD chưa được cấu hình, bỏ qua gửi email đặt lại mật khẩu",
    );
    return false;
  }

  const text = `Có yêu cầu đặt lại mật khẩu cho tài khoản quản trị của bạn.

Mở liên kết sau để đặt lại mật khẩu (hiệu lực trong 30 phút):
${resetUrl}

Nếu bạn không yêu cầu, hãy bỏ qua email này.`;

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;">
      <h2 style="color:#b8860b;">Royal Helmet Quảng Trị</h2>
      <p>Có yêu cầu đặt lại mật khẩu cho tài khoản quản trị của bạn.</p>
      <p>Mở liên kết sau để đặt lại mật khẩu: <a href="${resetUrl}">${resetUrl}</a></p>
      <p style="color:#888;font-size:13px;">Liên kết này có hiệu lực trong 30 phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Royal Helmet Quảng Trị" <${gmailUser}>`,
      to: email,
      subject: "Đặt lại mật khẩu quản trị - Royal Helmet Quảng Trị",
      text,
      html,
    });
    return true;
  } catch (err) {
    logger.error({ err }, "Gửi email đặt lại mật khẩu thất bại");
    return false;
  }
};
