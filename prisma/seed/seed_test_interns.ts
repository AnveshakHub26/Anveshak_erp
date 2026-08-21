import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding 3 Intern Employees into Database & Supabase Auth...');

  const supaUrl = process.env.SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = supaUrl && supaKey ? createClient(supaUrl, supaKey, { auth: { autoRefreshToken: false, persistSession: false } }) : null;

  const defaultPassword = 'Password@123';
  const passwordHash = await argon2.hash(defaultPassword, { type: argon2.argon2id });

  const internRole = await prisma.role.findFirst({ where: { code: 'INTERN' } });

  const internsData = [
    {
      firstName: 'Pranav',
      lastName: 'S P',
      email: 'sppranav2005@gmail.com',
      role: 'Software Development Intern',
      dept: 'Engineering',
      designation: 'Software Intern',
      skills: ['React', 'TypeScript', 'Node.js', 'Next.js', 'PostgreSQL'],
      tech: ['Full Stack', 'Web Development'],
    },
    {
      firstName: 'Ananya',
      lastName: 'Sharma',
      email: 'ananya.sharma@anveshak.com',
      role: 'UI/UX Design Intern',
      dept: 'Design',
      designation: 'UI/UX Intern',
      skills: ['Figma', 'UI/UX Design', 'Prototyping', 'CSS'],
      tech: ['Frontend', 'Design Systems'],
    },
    {
      firstName: 'Rohan',
      lastName: 'Verma',
      email: 'rohan.verma@anveshak.com',
      role: 'AI & Data Science Intern',
      dept: 'Data & AI',
      designation: 'AI/ML Intern',
      skills: ['Python', 'Machine Learning', 'Data Analysis', 'SQL'],
      tech: ['Artificial Intelligence', 'Data Engineering'],
    },
  ];

  for (let i = 0; i < internsData.length; i++) {
    const data = internsData[i];
    const emailClean = data.email.toLowerCase().trim();
    const fullName = `${data.firstName} ${data.lastName}`;
    const year = new Date().getFullYear();

    // 1. System Counter for Employee Code
    const counterKey = `EMPLOYEE_${year}`;
    const counter = await prisma.systemCounter.upsert({
      where: { name: counterKey },
      update: { nextValue: { increment: 1 } },
      create: { name: counterKey, nextValue: 1 },
    });
    const employeeCode = `EMP-${year}-${String(counter.nextValue).padStart(6, '0')}`;

    // 2. Upsert User in ERP DB
    const user = await prisma.user.upsert({
      where: { email: emailClean },
      update: {
        passwordHash,
        status: 'ACTIVE',
        mustChangePassword: false,
      },
      create: {
        email: emailClean,
        passwordHash,
        status: 'ACTIVE',
        mustChangePassword: false,
      },
    });

    // 3. Assign INTERN role
    if (internRole) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: internRole.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          roleId: internRole.id,
        },
      });
    }

    // 4. Upsert Employee record
    const emp = await prisma.employee.upsert({
      where: { workEmail: emailClean },
      update: {
        userId: user.id,
        firstName: data.firstName,
        lastName: data.lastName,
        fullName,
        professionalRole: data.role,
        department: data.dept,
        designation: data.designation,
        category: 'INTERN',
        employmentType: 'TEMPORARY',
        status: 'ACTIVE',
        skills: data.skills,
        technologies: data.tech,
      },
      create: {
        employeeCode,
        userId: user.id,
        firstName: data.firstName,
        lastName: data.lastName,
        fullName,
        workEmail: emailClean,
        professionalRole: data.role,
        department: data.dept,
        designation: data.designation,
        category: 'INTERN',
        employmentType: 'TEMPORARY',
        status: 'ACTIVE',
        joiningDate: new Date(),
        skills: data.skills,
        technologies: data.tech,
        ndaStatus: 'SIGNED_ELECTRONIC',
      },
    });

    // 5. Sync Supabase Auth Identity
    if (supabase) {
      try {
        const { data: supaUser } = await supabase.auth.admin.getUserById(user.id);
        if (supaUser?.user) {
          await supabase.auth.admin.updateUserById(user.id, {
            password: defaultPassword,
            email_confirm: true,
            user_metadata: { erp_status: 'ACTIVE', must_change_password: false },
          });
        } else {
          await supabase.auth.admin.createUser({
            id: user.id,
            email: emailClean,
            password: defaultPassword,
            email_confirm: true,
            user_metadata: { erp_status: 'ACTIVE', must_change_password: false },
          });
        }
        console.log(`✅ Supabase Auth identity synced for ${emailClean}`);
      } catch (sErr: any) {
        console.warn(`⚠️ Supabase Auth sync warning for ${emailClean}:`, sErr.message);
      }
    }

    console.log(`✅ Provisioned Intern Employee ${emp.employeeCode}: ${fullName} (${emailClean})`);
  }

  console.log('🎉 Intern employee accounts successfully provisioned!');
}

main()
  .catch((e) => {
    console.error('❌ Failed to seed intern employees:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
