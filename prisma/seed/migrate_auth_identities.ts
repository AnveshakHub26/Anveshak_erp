/**
 * AnveshakHub ERP — Supabase Auth Identity Migration Script
 *
 * Creates Supabase Auth identities for every ERP user, preserving the exact UUID.
 * Does NOT set or copy passwords — existing users must use email recovery to set
 * their Supabase Auth password before logging in.
 *
 * Safe to run multiple times: skips users that already exist in Supabase Auth.
 */
import 'dotenv/config';
import { createClient } from '../../apps/api/node_modules/@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required env: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const prisma = new PrismaClient();

  // 1. Fetch all ERP users from Supabase PostgreSQL (authoritative source)
  const erpUsers = await prisma.user.findMany({
    select: { id: true, email: true, status: true, mustChangePassword: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`\n📋 ERP users found: ${erpUsers.length}`);
  console.log('─'.repeat(70));

  const results = { created: 0, skipped: 0, failed: 0 };

  for (const user of erpUsers) {
    process.stdout.write(`  ${user.email.padEnd(40)} [${user.status}] `);

    // 2. Check if Supabase Auth identity already exists with this UUID
    const { data: existing, error: lookupErr } = await supabase.auth.admin.getUserById(user.id);
    if (lookupErr && !lookupErr.message?.includes('User not found')) {
      console.log(`LOOKUP_ERROR: ${lookupErr.message}`);
      results.failed++;
      continue;
    }

    if (existing?.user) {
      console.log(`✓ EXISTS (id=${existing.user.id.substring(0, 8)}...)`);
      results.skipped++;
      continue;
    }

    // 3. Create Supabase Auth identity with exact ERP UUID — NO password set.
    //    Users will authenticate only after using Supabase Auth email recovery
    //    to establish their credential. The ERP password_hash is NOT copied.
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      id: user.id,
      email: user.email,
      email_confirm: true,          // Mark email as verified
      user_metadata: {
        erp_status: user.status,
        must_change_password: user.mustChangePassword,
      },
    });

    if (createErr) {
      console.log(`✗ FAILED: ${createErr.message}`);
      results.failed++;
    } else {
      const uid = created?.user?.id;
      const idMatch = uid === user.id ? '✓ UUID_MATCH' : `✗ UUID_MISMATCH (got ${uid})`;
      console.log(`✓ CREATED  ${idMatch}`);
      results.created++;
    }
  }

  console.log('─'.repeat(70));
  console.log(`  Created: ${results.created}  |  Skipped (already existed): ${results.skipped}  |  Failed: ${results.failed}`);

  // 4. Verification — compare auth.users to public.users by UUID and email
  console.log('\n📊 Verification: 1-to-1 UUID/email mapping check');
  console.log('─'.repeat(70));

  const { data: authList, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 100 });
  if (listErr) {
    console.error(`Could not list Supabase Auth users: ${listErr.message}`);
  } else {
    const authUsers = authList?.users ?? [];
    console.log(`  ERP users (public.users): ${erpUsers.length}`);
    console.log(`  Supabase Auth users:      ${authUsers.length}`);

    let mismatches = 0;
    for (const erp of erpUsers) {
      const auth = authUsers.find((a: any) => a.id === erp.id);
      if (!auth) {
        console.log(`  ✗ MISSING in Auth: ${erp.email} (${erp.id})`);
        mismatches++;
      } else if (auth.email !== erp.email) {
        console.log(`  ✗ EMAIL MISMATCH: ERP=${erp.email} Auth=${auth.email}`);
        mismatches++;
      } else {
        const adminRole = erp.email === process.env.BOOTSTRAP_ADMIN_EMAIL
          ? ' [ADMIN]' : '';
        console.log(`  ✓ ${erp.email}${adminRole} — UUID match confirmed`);
      }
    }

    if (mismatches === 0) {
      console.log('\n✅ All ERP users have a verified 1-to-1 Supabase Auth identity mapping.');
    } else {
      console.log(`\n⚠️  ${mismatches} mapping issue(s) detected — review above.`);
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('\n❌ Migration failed:', e.message);
  process.exit(1);
});
