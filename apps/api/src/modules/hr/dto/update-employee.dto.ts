import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  IsEnum,
  MinLength,
} from 'class-validator';

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  workEmail?: string;

  @IsOptional()
  @IsString()
  personalEmail?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  professionalRole?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsEnum(['EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE'])
  category?: 'EXPERT' | 'INTERN' | 'STAFF' | 'EXECUTIVE';

  @IsOptional()
  @IsEnum(['PERMANENT', 'PROBATIONARY', 'TEMPORARY', 'CONTRACT', 'PART_TIME'])
  employmentType?: 'PERMANENT' | 'PROBATIONARY' | 'TEMPORARY' | 'CONTRACT' | 'PART_TIME';

  @IsOptional()
  @IsEnum(['ONBOARDING', 'PROBATION', 'ACTIVE', 'ON_LEAVE', 'RESIGNED', 'TERMINATED'])
  status?: 'ONBOARDING' | 'PROBATION' | 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED' | 'TERMINATED';

  @IsOptional()
  @IsString()
  joiningDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technologies?: string[];

  @IsOptional()
  @IsString()
  baseSalary?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password?: string;

  @IsOptional()
  @IsEnum(['PENDING', 'SIGNED_PHYSICAL', 'SIGNED_ELECTRONIC', 'EXPIRED'])
  ndaStatus?: 'PENDING' | 'SIGNED_PHYSICAL' | 'SIGNED_ELECTRONIC' | 'EXPIRED';

  @IsOptional()
  @IsString()
  ndaSignedAt?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
