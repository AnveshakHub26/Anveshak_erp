import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  IsEnum,
} from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  workEmail: string;

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

  @IsString()
  professionalRole: string;

  @IsString()
  department: string;

  @IsString()
  designation: string;

  @IsOptional()
  @IsEnum(['EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE'])
  category?: 'EXPERT' | 'INTERN' | 'STAFF' | 'EXECUTIVE';

  @IsOptional()
  @IsEnum(['PERMANENT', 'PROBATIONARY', 'TEMPORARY', 'CONTRACT', 'PART_TIME'])
  employmentType?: 'PERMANENT' | 'PROBATIONARY' | 'TEMPORARY' | 'CONTRACT' | 'PART_TIME';

  @IsString()
  joiningDate: string;

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
  password?: string;

  @IsOptional()
  @IsEnum(['PENDING', 'SIGNED_PHYSICAL', 'SIGNED_ELECTRONIC', 'EXPIRED'])
  ndaStatus?: 'PENDING' | 'SIGNED_PHYSICAL' | 'SIGNED_ELECTRONIC' | 'EXPIRED';
}
