import { renderBaseEmailTemplate, escapeHtml } from './base.template';

export function renderAccountOnboardingTemplate(userName: string, loginUrl: string, roleName?: string) {
  const safeName = escapeHtml(userName);
  const safeRole = roleName ? escapeHtml(roleName) : '';
  const subject = `👋 Welcome to AnveshakHub Enterprise ERP, ${safeName}!`;

  const html = renderBaseEmailTemplate({
    title: 'Welcome to AnveshakHub ERP',
    badgeText: 'ACCOUNT INVITATION',
    badgeBgColor: '#e0e7ff',
    badgeTextColor: '#3730a3',
    contentHtml: `
      <h2>Welcome aboard, ${safeName}!</h2>
      <p>Your AnveshakHub Enterprise account has been initialized${safeRole ? ` with the role <strong>${safeRole}</strong>` : ''}.</p>
      <p>You can now sign in to access your modules, view assigned projects, and collaborate with your team.</p>
    `,
    actionUrl: loginUrl,
    actionText: 'Sign In to Enterprise ERP',
  });

  const text = `Welcome to AnveshakHub Enterprise ERP, ${userName}!\n\nYour account is ready. Sign in at: ${loginUrl}`;

  return { subject, html, text };
}
