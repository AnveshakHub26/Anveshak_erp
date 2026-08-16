export interface BaseTemplateOptions {
  title: string;
  badgeText?: string;
  badgeBgColor?: string;
  badgeTextColor?: string;
  contentHtml: string;
  actionUrl?: string;
  actionText?: string;
}

export function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderBaseEmailTemplate(options: BaseTemplateOptions): string {
  const badgeBg = options.badgeBgColor || '#e6f4ea';
  const badgeColor = options.badgeTextColor || '#137333';
  const badge = options.badgeText
    ? `<div><span style="display: inline-block; background-color: ${badgeBg}; color: ${badgeColor}; font-weight: 600; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-top: 10px;">${escapeHtml(options.badgeText)}</span></div>`
    : '';

  const actionButton = options.actionUrl && options.actionText
    ? `<a href="${options.actionUrl}" style="display: block; width: 100%; text-align: center; background-color: #151c2e; color: #ffffff !important; font-weight: bold; padding: 14px 0; border-radius: 8px; text-decoration: none; margin-top: 24px; font-size: 14px;">${escapeHtml(options.actionText)}</a>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(options.title)}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { text-align: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px; }
    .logo { background: #151c2e; color: #d49b38; display: inline-block; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 18px; text-decoration: none; }
    .content { font-size: 14px; line-height: 1.6; color: #334155; }
    .footer { margin-top: 32px; font-size: 11px; text-align: center; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo">AH AnveshakHub Enterprise</div>
      ${badge}
    </div>
    <div class="content">
      ${options.contentHtml}
      ${actionButton}
    </div>
    <div class="footer">
      <p>AnveshakHub Enterprise Platform • Bridging Innovation, Enterprise & Academia</p>
      <p>This is an automated system notification. If you have questions, please contact support.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
