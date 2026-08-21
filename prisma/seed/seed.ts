import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting AnveshakHub Enterprise Master Data Seeding...');

  // 1. Seed Official 6 Business Verticals (Master Data defined by corporate deck)
  const businessVerticals = [
    { code: 'BV-01', name: 'Research-led Projects', sortOrder: 1 },
    { code: 'BV-02', name: 'IP and Knowledge Management', sortOrder: 2 },
    { code: 'BV-03', name: 'Startup Ecosystem', sortOrder: 3 },
    { code: 'BV-04', name: 'Consulting', sortOrder: 4 },
    { code: 'BV-05', name: 'Design and Development', sortOrder: 5 },
    { code: 'BV-06', name: 'Upskilling and Workshops', sortOrder: 6 },
  ];

  for (const bv of businessVerticals) {
    await prisma.businessVertical.upsert({
      where: { code: bv.code },
      update: { name: bv.name, sortOrder: bv.sortOrder },
      create: { code: bv.code, name: bv.name, sortOrder: bv.sortOrder },
    });
  }
  console.log('✅ Seeded 6 Official Business Verticals (BV-01 to BV-06)');

  // 1b. Seed Permanent Internal Organization (AnveshakHub Enterprise)
  const primaryBv = await prisma.businessVertical.findUnique({ where: { code: 'BV-01' } });
  if (primaryBv) {
    await prisma.organization.upsert({
      where: { orgNumber: 'ORG-000000' },
      update: {
        legalName: 'AnveshakHub Enterprise',
        tradeName: 'AnveshakHub',
        status: 'APPROVED',
      },
      create: {
        orgNumber: 'ORG-000000',
        legalName: 'AnveshakHub Enterprise',
        tradeName: 'AnveshakHub',
        applicantType: 'Company',
        type: 'Enterprise',
        primaryBvId: primaryBv.id,
        status: 'APPROVED',
      },
    });
    console.log('✅ Seeded Permanent Internal Organization: AnveshakHub Enterprise (ORG-000000)');
  }

  // 2. Seed System Roles (Product Design Specification v3.0 Master Roles)
  const roles = [
    { code: 'ADMIN', name: 'Admin', description: 'Full platform-level administration across all modules, approvals, organizations, users, roles, projects and governance.' },
    { code: 'HR', name: 'HR', description: 'Employee/personnel records, employment history, compensation, availability and HR reporting.' },
    { code: 'FINANCE', name: 'Finance', description: 'Ledger, expenses, invoices, receipts, payments, financial reports and reconciliation.' },
    { code: 'SALES', name: 'Sales', description: 'Customer orders, revenue, invoices and collections.' },
    { code: 'PURCHASE', name: 'Purchase', description: 'Vendors, purchase orders, vendor invoices and vendor payments.' },
    { code: 'PM', name: 'Project Manager', description: 'Assigned project execution, milestones, tasks, team allocation, timesheets, deliverables and closure.' },
    { code: 'EXPERT', name: 'Expert', description: 'Assigned project work, tasks, deliverables, timesheets and configured reviews.' },
    { code: 'INTERN', name: 'Intern', description: 'Assigned project tasks, timesheets and deliverables; no unrestricted finance/admin.' },
    { code: 'QA', name: 'QA', description: 'Assigned deliverable QA review and approval/rejection.' },
    { code: 'LEGAL', name: 'Legal', description: 'Assigned legal records and legal gates; project closure legal sign-off.' },
    { code: 'ORG_USER', name: 'Organization User', description: 'Own organization, submitted RFPs, project information, documents, deliverable/client acceptance and own invoices/payment view.' },
  ];

  const roleMap: Record<string, string> = {};
  for (const r of roles) {
    const roleRecord = await prisma.role.upsert({
      where: { code: r.code },
      update: { name: r.name, description: r.description },
      create: { code: r.code, name: r.name, description: r.description },
    });
    roleMap[r.code] = roleRecord.id;
  }
  console.log('✅ Seeded 11 System Roles');

  // 3. Seed Base Permissions
  const basePermissions = [
    { code: 'auth:login', resource: 'auth', action: 'login' },
    { code: 'organization:create', resource: 'organization', action: 'create' },
    { code: 'organization:read', resource: 'organization', action: 'read' },
    { code: 'organization:approve', resource: 'organization', action: 'approve' },
    { code: 'project:read', resource: 'project', action: 'read' },
    { code: 'project:manage', resource: 'project', action: 'manage' },
    { code: 'hr:read', resource: 'hr', action: 'read' },
    { code: 'hr:manage', resource: 'hr', action: 'manage' },
    { code: 'finance:read', resource: 'finance', action: 'read' },
    { code: 'finance:manage', resource: 'finance', action: 'manage' },
    { code: 'sales:manage', resource: 'sales', action: 'manage' },
    { code: 'purchase:manage', resource: 'purchase', action: 'manage' },
    { code: 'audit:read', resource: 'audit', action: 'read' },
    { code: 'system:manage', resource: 'system', action: 'manage' },
  ];

  for (const p of basePermissions) {
    const permRecord = await prisma.permission.upsert({
      where: { code: p.code },
      update: { resource: p.resource, action: p.action },
      create: { code: p.code, resource: p.resource, action: p.action },
    });

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roleMap['ADMIN'],
          permissionId: permRecord.id,
        },
      },
      update: {},
      create: {
        roleId: roleMap['ADMIN'],
        permissionId: permRecord.id,
      },
    });
  }
  console.log('✅ Seeded Base Permissions & Linked to ADMIN');

  // 4. Seed Bootstrap Admin Account with Single Supabase Auth Authority
  const superAdminEmail = (process.env.BOOTSTRAP_ADMIN_EMAIL || 'anveshakhub26@gmail.com').toLowerCase();

  const superAdminUser = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {
      status: 'ACTIVE',
      mustChangePassword: false,
    },
    create: {
      email: superAdminEmail,
      mustChangePassword: false,
      status: 'ACTIVE',
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: superAdminUser.id,
        roleId: roleMap['ADMIN'],
      },
    },
    update: {},
    create: {
      userId: superAdminUser.id,
      roleId: roleMap['ADMIN'],
    },
  });

  console.log(`✅ Seeded Bootstrap Admin Account (${superAdminEmail}) mapped to single Supabase Auth identity with ADMIN role.`);

  // 5. Seed Active Leave Type Master Data Records
  const leaveTypes = [
    {
      code: 'CASUAL',
      name: 'Casual Leave',
      description: 'Casual leave for personal or short notice matters',
      isPaid: true,
      annualAllocation: 12,
      isActive: true,
    },
    {
      code: 'SICK',
      name: 'Sick Leave',
      description: 'Paid medical leave for illness or health recuperation',
      isPaid: true,
      annualAllocation: 12,
      isActive: true,
    },
    {
      code: 'ANNUAL',
      name: 'Annual Leave',
      description: 'Privilege/Annual leave accrued for extended vacations or personal time off',
      isPaid: true,
      annualAllocation: 18,
      isActive: true,
    },
    {
      code: 'MATERNITY',
      name: 'Maternity Leave',
      description: 'Paid maternity leave for female employees',
      isPaid: true,
      annualAllocation: 180,
      isActive: true,
    },
    {
      code: 'PATERNITY',
      name: 'Paternity Leave',
      description: 'Paid paternity leave for male employees',
      isPaid: true,
      annualAllocation: 15,
      isActive: true,
    },
    {
      code: 'STUDY',
      name: 'Study / Training Leave',
      description: 'Leave for professional development, certifications, or higher studies',
      isPaid: true,
      annualAllocation: 10,
      isActive: true,
    },
    {
      code: 'UNPAID',
      name: 'Unpaid Leave (LOP)',
      description: 'Unpaid leave taken when paid leave balances are exhausted',
      isPaid: false,
      annualAllocation: 0,
      isActive: true,
    },
  ];

  for (const lt of leaveTypes) {
    await prisma.leaveType.upsert({
      where: { code: lt.code },
      update: {
        name: lt.name,
        description: lt.description,
        isPaid: lt.isPaid,
        annualAllocation: lt.annualAllocation,
        isActive: lt.isActive,
      },
      create: {
        code: lt.code,
        name: lt.name,
        description: lt.description,
        isPaid: lt.isPaid,
        annualAllocation: lt.annualAllocation,
        isActive: lt.isActive,
      },
    });
  }
  console.log(`✅ Seeded ${leaveTypes.length} Active Leave Type Master Data Records`);

  console.log('🎉 Master data seeding complete. Zero fake business records created!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
