const { PrismaClient } = require('@prisma/client');

async function inspect() {
  const prisma = new PrismaClient();
  
  try {
    // 1. List all tables
    const tables = await prisma.$queryRaw`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' ORDER BY table_name
    `;
    console.log('\n=== TABLES (' + tables.length + ' total) ===');
    tables.forEach(t => console.log(' ', t.table_name));

    // 2. Check users - no plaintext passwords
    const usersRaw = await prisma.$queryRaw`
      SELECT id, email, password_hash, password_reset_token, status, must_change_password 
      FROM users LIMIT 5
    `;
    console.log('\n=== USERS (security check) ===');
    usersRaw.forEach(u => {
      const hashLooksHashed = u.password_hash && u.password_hash.startsWith('$argon2');
      const isHex64 = u.password_reset_token ? /^[0-9a-f]{64}$/.test(u.password_reset_token) : false;
      console.log(`  ${u.email} | argon2_hash=${hashLooksHashed} | reset_token=${u.password_reset_token ? (isHex64 ? '[SHA256-HEX-OK]' : '[UNEXPECTED_FORMAT]') : 'null'} | status=${u.status} | mustChange=${u.must_change_password}`);
    });

    // 3. Check foreign keys
    const fks = await prisma.$queryRaw`
      SELECT DISTINCT tc.table_name, ccu.table_name AS foreign_table
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name
    `;
    console.log('\n=== FOREIGN KEY RELATIONSHIPS ===');
    fks.forEach(fk => console.log(`  ${fk.table_name} -> ${fk.foreign_table}`));

    // 4. Check unique constraints
    const uniqs = await prisma.$queryRaw`
      SELECT tc.table_name, kcu.column_name 
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'UNIQUE' AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name
    `;
    console.log('\n=== UNIQUE CONSTRAINTS ===');
    uniqs.forEach(u => console.log(`  ${u.table_name}.${u.column_name}`));

    // 5. Check indexes
    const indexes = await prisma.$queryRaw`
      SELECT tablename, indexname FROM pg_indexes 
      WHERE schemaname = 'public' AND indexname NOT LIKE '%_pkey'
      ORDER BY tablename, indexname
    `;
    console.log('\n=== INDEXES (' + indexes.length + ' non-PK) ===');
    indexes.forEach(i => console.log(`  ${i.tablename}: ${i.indexname}`));

    // 6. Roles 
    const roles = await prisma.role.findMany({ select: { code: true, name: true } });
    console.log('\n=== ROLES (' + roles.length + ' total) ===');
    roles.forEach(r => console.log(`  ${r.code}: ${r.name}`));

    // 7. Business Verticals
    const bvs = await prisma.businessVertical.findMany({ select: { code: true, name: true } });
    console.log('\n=== BUSINESS VERTICALS ===');
    bvs.forEach(b => console.log(`  ${b.code}: ${b.name}`));

    // 8. Counts
    const auditCount = await prisma.auditLog.count();
    const orgCount = await prisma.organization.count();
    const notifCount = await prisma.notification.count();
    const docCount = await prisma.document.count();
    const userCount = await prisma.user.count();
    console.log(`\n=== RECORD COUNTS ===`);
    console.log(`  users=${userCount} | orgs=${orgCount} | audit_logs=${auditCount} | notifications=${notifCount} | documents=${docCount}`);

    // 9. Verify audit log does not have tokens/passwords
    const recentAudit = await prisma.auditLog.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
    console.log('\n=== AUDIT SECURITY CHECK (last 5 entries) ===');
    let auditLeak = false;
    recentAudit.forEach(log => {
      const str = JSON.stringify({ before: log.beforeJson, after: log.afterJson });
      const leak = str.toLowerCase().includes('password') || str.toLowerCase().includes('access_token') || str.toLowerCase().includes('resettoken');
      if (leak) auditLeak = true;
      console.log(`  action=${log.action} | entity=${log.entityType} | sensitiveLeakage=${leak}`);
    });
    if (!auditLeak) console.log('  ✅ No sensitive data in audit logs');

    console.log('\n✅ DATABASE INSPECTION COMPLETE\n');

  } catch(err) {
    console.error('ERROR:', err.message, err.stack);
  } finally {
    await prisma.$disconnect();
  }
}

inspect();
