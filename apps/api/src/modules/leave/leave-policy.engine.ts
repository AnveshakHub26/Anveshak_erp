import { BadRequestException, ForbiddenException } from '@nestjs/common';

export interface LeavePolicyRules {
  menstrualLeaveMaxAge: number; // default 50
  casualLeaveAllocation: number; // default 12
  sickLeaveAllocation: number; // default 12
  paternityLeaveAllocation: number; // default 15
  maternityLeaveAllocation: number; // default 180
  earnedLeaveAllocation: number; // default 18
}

export const DEFAULT_LEAVE_POLICY_RULES: LeavePolicyRules = {
  menstrualLeaveMaxAge: 50,
  casualLeaveAllocation: 12,
  sickLeaveAllocation: 12,
  paternityLeaveAllocation: 15,
  maternityLeaveAllocation: 180,
  earnedLeaveAllocation: 18,
};

export interface LeaveTypePolicySpec {
  code: string;
  name: string;
  isPaid: boolean;
  annualAllocation: number;
  genderRule: 'ALL' | 'MALE_AND_OTHERS' | 'FEMALE_AND_OTHERS';
  maxAge?: number;
  isMonthly: boolean;
  monthlyLimit?: number;
  isApplicationBased: boolean;
  isProofRequired: boolean;
  proofRequirementDescription?: string;
  canCarryForward: boolean;
}

export class LeavePolicyEngine {
  /**
   * 1. Get structured Policy Specifications for all Leave Types
   */
  static getPolicySpecs(rules: LeavePolicyRules = DEFAULT_LEAVE_POLICY_RULES): LeaveTypePolicySpec[] {
    return [
      {
        code: 'EARNED',
        name: 'Earned Leave',
        isPaid: true,
        annualAllocation: rules.earnedLeaveAllocation,
        genderRule: 'ALL',
        isMonthly: false,
        isApplicationBased: false,
        isProofRequired: false,
        canCarryForward: true,
      },
      {
        code: 'CASUAL',
        name: 'Casual Leave',
        isPaid: true,
        annualAllocation: rules.casualLeaveAllocation,
        genderRule: 'ALL',
        isMonthly: false,
        isApplicationBased: false,
        isProofRequired: false,
        canCarryForward: false,
      },
      {
        code: 'SICK',
        name: 'Sick Leave',
        isPaid: true,
        annualAllocation: rules.sickLeaveAllocation,
        genderRule: 'ALL',
        isMonthly: false,
        isApplicationBased: false,
        isProofRequired: false,
        proofRequirementDescription: 'Medical proof required for durations exceeding 2 days.',
        canCarryForward: false,
      },
      {
        code: 'PATERNITY',
        name: 'Paternity Leave',
        isPaid: true,
        annualAllocation: rules.paternityLeaveAllocation,
        genderRule: 'MALE_AND_OTHERS',
        isMonthly: false,
        isApplicationBased: false,
        isProofRequired: false,
        canCarryForward: false,
      },
      {
        code: 'MATERNITY',
        name: 'Maternity Leave',
        isPaid: true,
        annualAllocation: rules.maternityLeaveAllocation,
        genderRule: 'FEMALE_AND_OTHERS',
        isMonthly: false,
        isApplicationBased: false,
        isProofRequired: true,
        proofRequirementDescription: 'Medical or hospital documentation is mandatory.',
        canCarryForward: false,
      },
      {
        code: 'STUDY',
        name: 'Study / Training Leave',
        isPaid: true,
        annualAllocation: 0,
        genderRule: 'ALL',
        isMonthly: false,
        isApplicationBased: true,
        isProofRequired: true,
        proofRequirementDescription: 'Supporting document (exam timetable, hall ticket, training invitation) is mandatory.',
        canCarryForward: false,
      },
      {
        code: 'MENSTRUAL',
        name: 'Menstrual Leave',
        isPaid: true,
        annualAllocation: 12,
        genderRule: 'FEMALE_AND_OTHERS',
        maxAge: rules.menstrualLeaveMaxAge,
        isMonthly: true,
        monthlyLimit: 1,
        isApplicationBased: false,
        isProofRequired: false,
        canCarryForward: false,
      },
      {
        code: 'UNPAID',
        name: 'Unpaid Leave (LOP)',
        isPaid: false,
        annualAllocation: 0,
        genderRule: 'ALL',
        isMonthly: false,
        isApplicationBased: true,
        isProofRequired: false,
        canCarryForward: false,
      },
    ];
  }

  /**
   * 2. Calculate employee age from Date of Birth on backend
   */
  static calculateAge(dateOfBirth: Date | string | null | undefined): number | null {
    if (!dateOfBirth) return null;
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * 3. Determine if employee is eligible for a specific leave type code
   */
  static isEligible(
    employee: { gender?: string | null; dateOfBirth?: Date | string | null },
    leaveTypeCode: string,
    rules: LeavePolicyRules = DEFAULT_LEAVE_POLICY_RULES,
  ): boolean {
    const rawGender = (employee.gender || '').trim();
    const genderLower = rawGender.toLowerCase();
    const isMale = genderLower === 'male';
    const isFemale = genderLower === 'female';

    const code = leaveTypeCode.toUpperCase();

    if (code === 'PATERNITY') {
      if (isFemale) return false;
      return true; // Eligible for Male and "Others / Prefer not to say"
    }

    if (code === 'MATERNITY') {
      if (isMale) return false;
      return true; // Eligible for Female and "Others / Prefer not to say"
    }

    if (code === 'MENSTRUAL') {
      if (isMale) return false;

      // Age check: Eligible while age <= menstrualLeaveMaxAge (50)
      const age = LeavePolicyEngine.calculateAge(employee.dateOfBirth);
      if (age !== null && age > rules.menstrualLeaveMaxAge) {
        return false;
      }
      return true; // Eligible for Female/Others under age cap
    }

    return true; // Earned, Casual, Sick, Study, Unpaid
  }

  /**
   * 4. Server-Side Policy Validation for Leave Submissions
   */
  static validateSubmission(
    employee: { gender?: string | null; dateOfBirth?: Date | string | null; fullName: string },
    leaveType: { code: string; name: string },
    dto: {
      startDate: Date;
      endDate: Date;
      totalDays: number;
      reason: string;
      documentKey?: string;
    },
    usedMenstrualThisMonth: number = 0,
    rules: LeavePolicyRules = DEFAULT_LEAVE_POLICY_RULES,
  ) {
    const code = leaveType.code.toUpperCase();

    // 1. Eligibility Check
    if (!LeavePolicyEngine.isEligible(employee, code, rules)) {
      if (code === 'MENSTRUAL') {
        const age = LeavePolicyEngine.calculateAge(employee.dateOfBirth);
        if (age !== null && age > rules.menstrualLeaveMaxAge) {
          throw new ForbiddenException(
            `Menstrual Leave is only available up to age ${rules.menstrualLeaveMaxAge} according to policy (Current age: ${age}).`,
          );
        }
        throw new ForbiddenException('You are not eligible for Menstrual Leave according to profile policy rules.');
      }
      if (code === 'PATERNITY') {
        throw new ForbiddenException('Paternity Leave is only eligible for male employees or applicable profile categories.');
      }
      if (code === 'MATERNITY') {
        throw new ForbiddenException('Maternity Leave is only eligible for female employees or applicable profile categories.');
      }
    }

    // 2. Study / Training Leave Proof Requirement Validation
    if (code === 'STUDY') {
      if (!dto.documentKey || !dto.documentKey.trim()) {
        throw new BadRequestException(
          'Supporting proof document (exam timetable, hall ticket, training invitation) is mandatory for Study / Training Leave.',
        );
      }
    }

    // 3. Maternity Leave Proof Requirement Validation
    if (code === 'MATERNITY') {
      if (!dto.documentKey || !dto.documentKey.trim()) {
        throw new BadRequestException('Supporting medical/hospital documentation is mandatory for Maternity Leave.');
      }
    }

    // 4. Menstrual Leave Strict Monthly Non-Carryover Rules
    if (code === 'MENSTRUAL') {
      // Must not exceed 1 day in a single application
      if (dto.totalDays > 1) {
        throw new BadRequestException('Menstrual Leave cannot exceed 1 day per calendar month.');
      }

      // Must stay within the same calendar month
      if (
        dto.startDate.getFullYear() !== dto.endDate.getFullYear() ||
        dto.startDate.getMonth() !== dto.endDate.getMonth()
      ) {
        throw new BadRequestException('Menstrual Leave request cannot span across multiple calendar months.');
      }

      // Check monthly cap (Max 1 day per calendar month)
      if (usedMenstrualThisMonth >= 1) {
        throw new BadRequestException(
          'Monthly Menstrual Leave limit reached (Maximum 1 day per calendar month allowed). Unused days from prior months do not carry forward.',
        );
      }
    }
  }
}
