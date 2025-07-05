import { calculateScreenTotals } from './screenTotals';

const arabicDate = (date) =>
  new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));

export function formatOrderAsArabicTxt(order) {
  const screenTotals = calculateScreenTotals(order);
  const configs = (order.order_screen_requirements || []).map(req => {
    return `• النوع: ${req.screen_type}, المساحة: ${req.sqm_required} متر, التكوين: ${req.dimensions_rows} × ${req.dimensions_columns}`;
  }).join('\n');

  const totalAmount = parseFloat(order.total_amount) || 0;
  const paid = parseFloat(order.payed ?? order.paidAmount) || 0;
  const remaining = parseFloat(order.remaining) || (totalAmount - paid);

  const locationLine = `📍 الموقع: ${order.location_name}`;
  const linkLine = order.google_maps_link || order.url ? `🔗 الرابط: ${order.google_maps_link || order.url}` : '';

  const orderIdBase = order.order_id?.replace(/_[A-Z]$/i, '') || order.order_id;
  const orderSuffix = order.order_id?.match(/_([A-Z])$/i)?.[1];

  let content = `
📦 الطلب: ${orderIdBase}${orderSuffix ? ` – ${orderSuffix}` : ''} (${order.location_name})
${locationLine}
${linkLine}

🔧 تشغيلات التركيب:
${configs}
🗓️ تاريخ التركيب: ${arabicDate(order.start_date)}
👷 الفني المسؤول: ${order.installing_assignee?.name || 'غير محدد'}

🛠️ تشغيلات الفك:
${configs}
🗓️ تاريخ الفك: ${arabicDate(order.end_date)}
👷 الفني المسؤول: ${order.disassemble_assignee?.name || 'غير محدد'}

--------------------------`.trim();

  return content;
}
