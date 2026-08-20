import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('🧹 Starting AnveshakHub Production ERP Database Purge & Storage Reset...');

  const adminEmail = (process.env.BOOTSTRAP_ADMIN_EMAIL || 'anveshakhub26@gmail.com').toLowerCase();
  const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD || 'Anveshak';

  // 1. Delete Execution & Project Sub-Records
  const deletedMeetingParts = await prisma.projectMeetingParticipant.deleteMany({});
  console.log(`- Deleted ${deletedMeetingParts.count} meeting participants`);

  const deletedMeetings = await prisma.projectMeeting.deleteMany({});
  console.log(`- Deleted ${deletedMeetings.count} project meetings`);

  const deletedDeliverables = await prisma.projectDeliverable.deleteMany({});
  console.log(`- Deleted ${deletedDeliverables.count} project deliverables`);

  const deletedTasks = await prisma.projectTask.deleteMany({});
  console.log(`- Deleted ${deletedTasks.count} project tasks`);

  const deletedMilestones = await prisma.projectMilestone.deleteMany({});
  console.log(`- Deleted ${deletedMilestones.count} project milestones`);

  const deletedResourceReqs = await prisma.projectResourceRequirement.deleteMany({});
  console.log(`- Deleted ${deletedResourceReqs.count} project resource requirements`);

  const deletedMembers = await prisma.projectMember.deleteMany({});
  console.log(`- Deleted ${deletedMembers.count} project members`);

  const deletedResourceLinks = await prisma.projectResourceLink.deleteMany({});
  console.log(`- Deleted ${deletedResourceLinks.count} project resource links`);

  const deletedProjects = await prisma.project.deleteMany({});
  console.log(`- Deleted ${deletedProjects.count} projects`);

  // 2. Delete Support Queries, Problem Statements & Organizations
  const deletedQueryMessages = await (prisma as any).supportQueryMessage.deleteMany({});
  console.log(`- Deleted ${deletedQueryMessages.count} support query messages`);

  const deletedSupportQueries = await (prisma as any).supportQuery.deleteMany({});
  console.log(`- Deleted ${deletedSupportQueries.count} support queries`);

  const deletedProblems = await prisma.problemStatement.deleteMany({});
  console.log(`- Deleted ${deletedProblems.count} problem statements`);

  const deletedOrgUsers = await prisma.organizationUser.deleteMany({});
  console.log(`- Deleted ${deletedOrgUsers.count} organization user assignments`);

  const deletedOrgBvs = await prisma.organizationBusinessVertical.deleteMany({});
  console.log(`- Deleted ${deletedOrgBvs.count} organization vertical assignments`);

  const deletedOrgs = await prisma.organization.deleteMany({
    where: { NOT: { orgNumber: 'ORG-000000' } },
  });
  console.log(`- Deleted ${deletedOrgs.count} external test organizations`);

  // Ensure Permanent Internal Organization (AnveshakHub Enterprise) exists & is APPROVED
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
    console.log('✅ Preserved Permanent Internal Organization: AnveshakHub Enterprise (ORG-000000)');
  }

  // 3. Delete Workshops
  const deletedWorkshops = await (prisma as any).workshop.deleteMany({});
  console.log(`- Deleted ${deletedWorkshops.count} workshops`);

  // 4. Delete HR, Attendance & Leave Records
  const deletedAttendanceBreaks = await (prisma as any).attendanceBreak.deleteMany({});
  console.log(`- Deleted ${deletedAttendanceBreaks.count} attendance breaks`);

  const deletedAttendance = await (prisma as any).attendance.deleteMany({});
  console.log(`- Deleted ${deletedAttendance.count} attendance records`);

  const deletedLeaveRequests = await (prisma as any).leaveRequest.deleteMany({});
  console.log(`- Deleted ${deletedLeaveRequests.count} leave requests`);

  const deletedLeaveBalances = await (prisma as any).leaveBalance.deleteMany({});
  console.log(`- Deleted ${deletedLeaveBalances.count} leave balances`);

  const deletedEmpHist = await prisma.employmentHistory.deleteMany({});
  console.log(`- Deleted ${deletedEmpHist.count} employment history records`);

  const deletedEmployees = await prisma.employee.deleteMany({});
  console.log(`- Deleted ${deletedEmployees.count} employees`);

  // 5. Delete Documents & Folders
  const deletedDocVersions = await prisma.documentVersion.deleteMany({});
  console.log(`- Deleted ${deletedDocVersions.count} document versions`);

  const deletedDocuments = await prisma.document.deleteMany({});
  console.log(`- Deleted ${deletedDocuments.count} documents`);

  const deletedFolders = await (prisma as any).documentFolder.deleteMany({});
  console.log(`- Deleted ${deletedFolders.count} document folders`);

  // 6. Delete Notifications & Audit Logs
  const deletedNotifications = await prisma.notification.deleteMany({});
  console.log(`- Deleted ${deletedNotifications.count} notifications`);

  const deletedAuditLogs = await prisma.auditLog.deleteMany({});
  console.log(`- Deleted ${deletedAuditLogs.count} audit logs`);

  // 7. Reset System Counters to ensure sequence codes start at 000001
  const deletedCounters = await prisma.systemCounter.deleteMany({});
  console.log(`- Reset ${deletedCounters.count} system counters (sequences will restart at 000001)`);

  // 8. Delete Non-Bootstrap Users & UserRoles
  const nonAdminUsers = await prisma.user.findMany({
    where: { NOT: { email: adminEmail } },
    select: { id: true, email: true },
  });

  const nonAdminUserIds = nonAdminUsers.map((u) => u.id);

  if (nonAdminUserIds.length > 0) {
    const deletedUserRoles = await prisma.userRole.deleteMany({
      where: { userId: { in: nonAdminUserIds } },
    });
    console.log(`- Deleted ${deletedUserRoles.count} non-admin user roles`);

    const deletedUsers = await prisma.user.deleteMany({
      where: { id: { in: nonAdminUserIds } },
    });
    console.log(`- Deleted ${deletedUsers.count} non-admin users`);
  }

  // 9. Ensure Bootstrap Admin Account exists in ERP DB & is ACTIVE
  const adminRole = await prisma.role.findUnique({ where: { code: 'ADMIN' } });
  if (!adminRole) {
    throw new Error('ADMIN role missing from database. Run npx ts-node prisma/seed/seed.ts first.');
  }

  const bootstrapUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      status: 'ACTIVE',
      mustChangePassword: false,
    },
    create: {
      email: adminEmail,
      status: 'ACTIVE',
      mustChangePassword: false,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: bootstrapUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: bootstrapUser.id,
      roleId: adminRole.id,
    },
  });

  console.log(`✅ Cleaned Database: Preserved Single Permanent Bootstrap ADMIN Account (${adminEmail}) with status = ACTIVE.`);

  // 10. Ensure Supabase Auth identity exists & credential matches BOOTSTRAP_ADMIN_PASSWORD
  const supaUrl = process.env.SUPABASE_URL;
  const supaServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supaUrl && supaServiceKey) {
    try {
      const supabase = createClient(supaUrl, supaServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: supaUser } = await supabase.auth.admin.getUserById(bootstrapUser.id);
      if (supaUser?.user) {
        await supabase.auth.admin.updateUserById(bootstrapUser.id, {
          password: adminPassword,
          email_confirm: true,
          user_metadata: { erp_status: 'ACTIVE', must_change_password: false },
        });
        console.log(`✅ Supabase Auth identity updated for bootstrap ADMIN (${adminEmail}).`);
      } else {
        await supabase.auth.admin.createUser({
          id: bootstrapUser.id,
          email: adminEmail,
          password: adminPassword,
          email_confirm: true,
          user_metadata: { erp_status: 'ACTIVE', must_change_password: false },
        });
        console.log(`✅ Supabase Auth identity created for bootstrap ADMIN (${adminEmail}).`);
      }

      // Cleanup Storage Bucket Files
      const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'anveshak-private-documents';
      const { data: files, error: listErr } = await supabase.storage.from(bucketName).list('', { limit: 1000 });
      if (!listErr && files && files.length > 0) {
        const filePaths = files.map((f: any) => f.name);
        await supabase.storage.from(bucketName).remove(filePaths);
        console.log(`✅ Cleaned ${filePaths.length} test document files from Supabase Storage bucket '${bucketName}'.`);
      } else {
        console.log(`- Storage bucket '${bucketName}' is clean (0 test files found).`);
      }
    } catch (supaErr: any) {
      console.warn(`⚠️ Supabase Auth/Storage sync warning: ${supaErr.message}`);
    }
  }

  console.log('🎉 Database conversion to clean production state complete!');
}

cleanDatabase()
  .catch((e) => {
    console.error('❌ Database cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
