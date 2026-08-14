import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../../database/prisma.service';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('ProjectsService Resource Management Engine', () => {
  let service: ProjectsService;
  let prisma: PrismaService;

  const mockAdminUser = { id: 'u-admin-1', email: 'admin@anveshak.com', roles: ['ADMIN'] };
  const mockHrUser = { id: 'u-hr-1', email: 'hr@anveshak.com', roles: ['HR'] };
  const mockPmUser = { id: 'u-pm-1', email: 'pm@anveshak.com', roles: ['PM'] };
  const mockOrgUser = { id: 'u-org-1', email: 'org@industry.com', roles: ['ORG_USER'] };

  const mockPrisma = {
    project: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    projectResourceRequirement: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    employee: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    projectMember: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
    organizationUser: {
      findFirst: jest.fn(),
    },
    document: {
      findMany: jest.fn(),
    },
    projectMilestone: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    projectTask: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    projectDeliverable: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    projectMeeting: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    projectMeetingParticipant: {
      deleteMany: jest.fn(),
    },
    projectResourceLink: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrisma)),
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('Project Resource Requirements', () => {
    it('should allow ADMIN to create a project resource requirement', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'p-1', status: 'IN_PROGRESS' });
      mockPrisma.projectResourceRequirement.create.mockResolvedValue({
        id: 'req-1',
        projectId: 'p-1',
        professionalRole: 'Developer',
        requiredCount: 2,
        allocationPct: 50.0,
      });

      const res = await service.createRequirement(mockAdminUser, 'p-1', {
        professionalRole: 'Developer',
        requiredCount: 2,
        allocationPct: 50.0,
        skills: [],
        technologies: [],
        priority: 'HIGH',
      });

      expect(res.id).toBe('req-1');
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ action: 'RESOURCE_REQUIREMENT_CREATED' }),
      });
    });

    it('should reject creating requirement for COMPLETED or CANCELLED project', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'p-completed', status: 'COMPLETED' });

      await expect(
        service.createRequirement(mockAdminUser, 'p-completed', {
          professionalRole: 'Researcher',
          requiredCount: 1,
          allocationPct: 100.0,
          skills: [],
          technologies: [],
          priority: 'HIGH',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should calculate requirement fulfillment deterministically using linked requirementId', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'p-1',
        members: [
          { id: 'm-1', requirementId: 'req-A', status: 'ACTIVE' },
          { id: 'm-2', requirementId: 'req-A', status: 'ACTIVE' },
        ],
      });

      mockPrisma.projectResourceRequirement.findMany.mockResolvedValue([
        { id: 'req-A', projectId: 'p-1', professionalRole: 'Developer', requiredCount: 2 },
        { id: 'req-B', projectId: 'p-1', professionalRole: 'Developer', requiredCount: 2 },
      ]);

      const results = await service.getRequirements(mockAdminUser, 'p-1');
      expect(results).toHaveLength(2);
      expect(results.find((r) => r.id === 'req-A').isFulfilled).toBe(true);
      expect(results.find((r) => r.id === 'req-B').isFulfilled).toBe(false);
    });

    it('should reject attaching a requirement belonging to another project', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'p-1', status: 'IN_PROGRESS' });
      mockPrisma.$queryRaw.mockResolvedValue([
        { id: 'emp-1', status: 'ACTIVE', category: 'EXPERT', employment_type: 'PERMANENT', professional_role: 'Developer' },
      ]);
      mockPrisma.projectResourceRequirement.findUnique.mockResolvedValue({
        id: 'req-other',
        projectId: 'p-OTHER',
        requiredCount: 1,
      });

      await expect(
        service.assignMember(mockAdminUser, 'p-1', {
          employeeId: 'emp-1',
          requirementId: 'req-other',
          projectRole: 'Developer',
          allocationPct: 50.0,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject assigning an employee incompatible with requirement constraints', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'p-1', status: 'IN_PROGRESS' });
      mockPrisma.$queryRaw.mockResolvedValue([
        { id: 'emp-1', status: 'ACTIVE', category: 'STAFF', employment_type: 'PERMANENT', professional_role: 'Developer' },
      ]);
      mockPrisma.projectResourceRequirement.findUnique.mockResolvedValue({
        id: 'req-expert',
        projectId: 'p-1',
        category: 'EXPERT',
        requiredCount: 1,
      });
      mockPrisma.projectMember.count.mockResolvedValue(0);

      await expect(
        service.assignMember(mockAdminUser, 'p-1', {
          employeeId: 'emp-1',
          requirementId: 'req-expert',
          projectRole: 'Developer',
          allocationPct: 50.0,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Candidate Matching Engine', () => {
    it('should return ACTIVE candidates and calculate availability and match score', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'p-1' });
      mockPrisma.employee.findMany.mockResolvedValue([
        {
          id: 'emp-1',
          employeeCode: 'EMP-2026-000001',
          fullName: 'Alice Research',
          status: 'ACTIVE',
          skills: ['Thermal Coatings', 'CAD'],
          technologies: ['ANSYS', 'Python'],
          category: 'EXPERT',
          employmentType: 'PERMANENT',
          professionalRole: 'Researcher',
          projectMemberships: [{ allocationPct: 60.0 }],
        },
      ]);

      const candidates = await service.getCandidates(mockAdminUser, 'p-1', {
        skills: 'Thermal Coatings',
        technologies: 'ANSYS',
      });

      expect(candidates).toHaveLength(1);
      expect(candidates[0].currentAllocationPct).toBe(60.0);
      expect(candidates[0].availableCapacityPct).toBe(40.0);
      expect(candidates[0].matchScore).toBe(100);
    });

    it('should reject ORG_USER requesting candidate employee identities with 403 Forbidden', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'p-1' });

      await expect(service.getCandidates(mockOrgUser, 'p-1', {})).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Capacity Enforcement & Concurrency Locking', () => {
    it('should assign member under row-level transaction lock when allocation <= 100%', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'p-1', projectCode: 'PRJ-2026-000001', status: 'IN_PROGRESS' });
      mockPrisma.$queryRaw.mockResolvedValue([
        { id: 'emp-1', employee_code: 'EMP-2026-000001', status: 'ACTIVE' },
      ]);
      mockPrisma.projectMember.findFirst.mockResolvedValue(null);
      mockPrisma.projectMember.findMany.mockResolvedValue([{ allocationPct: 40.0 }]);
      mockPrisma.projectMember.create.mockResolvedValue({
        id: 'pm-1',
        projectId: 'p-1',
        employeeId: 'emp-1',
        allocationPct: 50.0,
        projectRole: 'Lead Scientist',
        employee: { id: 'emp-1', employeeCode: 'EMP-2026-000001', fullName: 'Dr. Alice', userId: 'u-alice' },
        project: { id: 'p-1', projectCode: 'PRJ-2026-000001', title: 'Thermal Shield' },
      });

      const res = await service.assignMember(mockAdminUser, 'p-1', {
        employeeId: 'emp-1',
        projectRole: 'Lead Scientist',
        allocationPct: 50.0,
      });

      expect(res.id).toBe('pm-1');
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ action: 'PROJECT_MEMBER_ASSIGNED' }),
      });
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ recipientUserId: 'u-alice', eventType: 'PROJECT_ASSIGNED' }),
      });
    });

    it('should reject assignment if total allocation exceeds 100% (e.g. 60% + 50% = 110%)', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'p-1', status: 'IN_PROGRESS' });
      mockPrisma.$queryRaw.mockResolvedValue([
        { id: 'emp-1', employee_code: 'EMP-2026-000001', status: 'ACTIVE' },
      ]);
      mockPrisma.projectMember.findFirst.mockResolvedValue(null);
      mockPrisma.projectMember.findMany.mockResolvedValue([{ allocationPct: 60.0 }]);

      await expect(
        service.assignMember(mockAdminUser, 'p-1', {
          employeeId: 'emp-1',
          projectRole: 'Lead Scientist',
          allocationPct: 50.0,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject duplicate active assignment on same project with 409 Conflict', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'p-1', status: 'IN_PROGRESS' });
      mockPrisma.$queryRaw.mockResolvedValue([
        { id: 'emp-1', employee_code: 'EMP-2026-000001', status: 'ACTIVE' },
      ]);
      mockPrisma.projectMember.findFirst.mockResolvedValue({ id: 'pm-existing', status: 'ACTIVE' });

      await expect(
        service.assignMember(mockAdminUser, 'p-1', {
          employeeId: 'emp-1',
          projectRole: 'Lead Scientist',
          allocationPct: 30.0,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Employee Release Workflow', () => {
    it('should transition member status to RELEASED and record removedAt timestamp', async () => {
      mockPrisma.projectMember.findFirst.mockResolvedValue({
        id: 'pm-1',
        projectId: 'p-1',
        employeeId: 'emp-1',
        status: 'ACTIVE',
        employee: { userId: 'u-alice' },
        project: { projectCode: 'PRJ-2026-000001' },
      });
      mockPrisma.projectMember.update.mockResolvedValue({
        id: 'pm-1',
        status: 'RELEASED',
        removedAt: new Date(),
      });

      const released = await service.releaseMember(mockAdminUser, 'p-1', 'pm-1', 'Project requirement fulfilled');
      expect(released.status).toBe('RELEASED');
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ action: 'PROJECT_MEMBER_RELEASED' }),
      });
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ eventType: 'PROJECT_RELEASED' }),
      });
    });
  });

  describe('Project Execution & Management Engine (Slice 2)', () => {

    describe('PM Scoped Access & Authorization', () => {
      it('should allow ADMIN full execution management access', async () => {
        mockPrisma.project.findUnique.mockResolvedValue({ id: 'p-1', projectCode: 'PRJ-1', status: 'IN_PROGRESS' });
        const access = await service.verifyProjectExecutionAccess(mockAdminUser, 'p-1', 'MANAGE');
        expect(access.isAdmin).toBe(true);
      });

      it('should reject HR from managing project execution', async () => {
        mockPrisma.project.findUnique.mockResolvedValue({ id: 'p-1', projectCode: 'PRJ-1', status: 'IN_PROGRESS' });
        await expect(service.verifyProjectExecutionAccess(mockHrUser, 'p-1', 'MANAGE')).rejects.toThrow(ForbiddenException);
      });

      it('should allow PM assigned to project as Project Manager', async () => {
        mockPrisma.project.findUnique.mockResolvedValue({ id: 'p-1', projectCode: 'PRJ-1', status: 'IN_PROGRESS' });
        mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp-pm-1', userId: 'u-pm-1' });
        mockPrisma.projectMember.findFirst.mockResolvedValue({
          id: 'pm-1',
          projectId: 'p-1',
          employeeId: 'emp-pm-1',
          projectRole: 'Project Manager / Lead',
          status: 'ACTIVE',
        });

        const access = await service.verifyProjectExecutionAccess(mockPmUser, 'p-1', 'MANAGE');
        expect(access.isPm).toBe(true);
      });

      it('should reject PM requesting management on an unassigned project', async () => {
        mockPrisma.project.findUnique.mockResolvedValue({ id: 'p-2', projectCode: 'PRJ-2', status: 'IN_PROGRESS' });
        mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp-pm-1', userId: 'u-pm-1' });
        mockPrisma.projectMember.findFirst.mockResolvedValue(null);

        await expect(service.verifyProjectExecutionAccess(mockPmUser, 'p-2', 'MANAGE')).rejects.toThrow(ForbiddenException);
      });
    });

    describe('Project Milestones', () => {
      it('should allow ADMIN to create milestone', async () => {
        mockPrisma.project.findUnique.mockResolvedValue({ id: 'p-1', projectCode: 'PRJ-1', status: 'IN_PROGRESS' });
        mockPrisma.projectMilestone.create.mockResolvedValue({
          id: 'm-1',
          projectId: 'p-1',
          title: 'Phase 1 Requirements',
          dueDate: new Date('2026-10-01'),
          status: 'PLANNED',
          progressPct: 0,
        });

        const milestone = await service.createMilestone(mockAdminUser, 'p-1', {
          title: 'Phase 1 Requirements',
          dueDate: '2026-10-01',
          sequence: 1,
          isClientVisible: true,
        });

        expect(milestone.id).toBe('m-1');
        expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
          data: expect.objectContaining({ action: 'MILESTONE_CREATED' }),
        });
      });

      it('should reject creating milestone on COMPLETED project', async () => {
        mockPrisma.project.findUnique.mockResolvedValue({ id: 'p-completed', projectCode: 'PRJ-C', status: 'COMPLETED' });
        await expect(
          service.createMilestone(mockAdminUser, 'p-completed', { title: 'New M', dueDate: '2026-10-01', sequence: 1, isClientVisible: true }),
        ).rejects.toThrow(BadRequestException);
      });

      it('should reject deleting milestone containing active tasks', async () => {
        mockPrisma.project.findUnique.mockResolvedValue({ id: 'p-1', projectCode: 'PRJ-1', status: 'IN_PROGRESS' });
        mockPrisma.projectMilestone.findFirst.mockResolvedValue({
          id: 'm-1',
          projectId: 'p-1',
          title: 'Phase 1',
          tasks: [{ id: 't-1' }],
          deliverables: [],
        });

        await expect(service.deleteMilestone(mockAdminUser, 'p-1', 'm-1')).rejects.toThrow(BadRequestException);
      });
    });

    describe('Project Tasks & Assignment Validation', () => {
      it('should reject task assignment to employee who is NOT an active ProjectMember', async () => {
        mockPrisma.project.findUnique.mockResolvedValue({ id: 'p-1', projectCode: 'PRJ-1', status: 'IN_PROGRESS' });
        mockPrisma.projectMember.findFirst.mockResolvedValue(null);

        await expect(
          service.createTask(mockAdminUser, 'p-1', {
            assigneeEmployeeId: 'emp-non-member',
            title: 'Design API',
            priority: 'MEDIUM',
            isClientVisible: false,
          }),
        ).rejects.toThrow(BadRequestException);
      });

      it('should allow assigning task to active ProjectMember and dispatch notification', async () => {
        mockPrisma.project.findUnique.mockResolvedValue({ id: 'p-1', projectCode: 'PRJ-1', status: 'IN_PROGRESS' });
        mockPrisma.projectMember.findFirst.mockResolvedValue({
          id: 'pmember-1',
          projectId: 'p-1',
          employeeId: 'emp-1',
          status: 'ACTIVE',
          employee: { userId: 'u-emp-1' },
        });

        mockPrisma.projectTask.create.mockResolvedValue({
          id: 't-1',
          projectId: 'p-1',
          assigneeEmployeeId: 'emp-1',
          title: 'Design API',
          status: 'TODO',
          progressPct: 0,
        });

        const task = await service.createTask(mockAdminUser, 'p-1', {
          assigneeEmployeeId: 'emp-1',
          title: 'Design API',
          priority: 'MEDIUM',
          isClientVisible: false,
        });

        expect(task.id).toBe('t-1');
        expect(mockPrisma.notification.create).toHaveBeenCalledWith({
          data: expect.objectContaining({ eventType: 'TASK_ASSIGNED', recipientUserId: 'u-emp-1' }),
        });
      });
    });

    describe('Employee Self-Service Task Progress', () => {
      it('should allow assigned employee to update progress on own task', async () => {
        mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp-1', userId: 'u-emp-1' });
        mockPrisma.projectTask.findUnique.mockResolvedValue({
          id: 't-1',
          assigneeEmployeeId: 'emp-1',
          status: 'IN_PROGRESS',
          progressPct: 30,
          project: { status: 'IN_PROGRESS' },
        });

        mockPrisma.projectTask.update.mockResolvedValue({
          id: 't-1',
          status: 'COMPLETED',
          progressPct: 100,
        });

        const updated = await service.updateEmployeeTaskProgress({ id: 'u-emp-1' }, 't-1', 'COMPLETED', 100, 5);
        expect(updated.status).toBe('COMPLETED');
        expect(updated.progressPct).toBe(100);
      });

      it('should reject employee updating another employee task', async () => {
        mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp-1', userId: 'u-emp-1' });
        mockPrisma.projectTask.findUnique.mockResolvedValue({
          id: 't-2',
          assigneeEmployeeId: 'emp-OTHER',
          project: { status: 'IN_PROGRESS' },
        });

        await expect(service.updateEmployeeTaskProgress({ id: 'u-emp-1' }, 't-2', 'IN_PROGRESS', 50)).rejects.toThrow(ForbiddenException);
      });
    });

    describe('Deliverables Review State Machine', () => {
      it('should require review notes for REJECT or REQUEST_REVISION decision', async () => {
        mockPrisma.project.findUnique.mockResolvedValue({ id: 'p-1', projectCode: 'PRJ-1', status: 'IN_PROGRESS' });
        mockPrisma.projectDeliverable.findFirst.mockResolvedValue({
          id: 'deliv-1',
          projectId: 'p-1',
          title: 'Design Specs',
          status: 'SUBMITTED',
        });

        await expect(
          service.reviewDeliverable(mockAdminUser, 'p-1', 'deliv-1', 'REJECT', ''),
        ).rejects.toThrow(BadRequestException);
      });

      it('should approve deliverable and notify submitter', async () => {
        mockPrisma.project.findUnique.mockResolvedValue({ id: 'p-1', projectCode: 'PRJ-1', status: 'IN_PROGRESS' });
        mockPrisma.projectDeliverable.findFirst.mockResolvedValue({
          id: 'deliv-1',
          projectId: 'p-1',
          title: 'Design Specs',
          status: 'SUBMITTED',
          submittedById: 'u-emp-1',
        });

        mockPrisma.projectDeliverable.update.mockResolvedValue({
          id: 'deliv-1',
          status: 'APPROVED',
          reviewedById: mockAdminUser.id,
        });

        const approved = await service.reviewDeliverable(mockAdminUser, 'p-1', 'deliv-1', 'APPROVE', 'Looks good');
        expect(approved.status).toBe('APPROVED');
        expect(mockPrisma.notification.create).toHaveBeenCalledWith({
          data: expect.objectContaining({ eventType: 'DELIVERABLE_APPROVED', recipientUserId: 'u-emp-1' }),
        });
      });
    });

    describe('Online Meetings Scheduling Workspace', () => {
      it('should schedule meeting with active project members and send notifications', async () => {
        mockPrisma.project.findUnique.mockResolvedValue({ id: 'p-1', projectCode: 'PRJ-1', status: 'IN_PROGRESS' });
        mockPrisma.projectMember.findMany.mockResolvedValue([
          { employeeId: 'emp-1', status: 'ACTIVE' },
        ]);
        mockPrisma.projectMeeting.create.mockResolvedValue({
          id: 'meet-1',
          projectId: 'p-1',
          title: 'Architecture Review',
          meetingUrl: 'https://meet.google.com/abc-def',
          status: 'SCHEDULED',
          participants: [
            { employeeId: 'emp-1', employee: { userId: 'u-emp-1' } },
          ],
        });

        const meeting = await service.createMeeting(mockAdminUser, 'p-1', {
          title: 'Architecture Review',
          meetingUrl: 'https://meet.google.com/abc-def',
          meetingProvider: 'GOOGLE_MEET',
          startDateTime: '2026-10-01T10:00:00Z',
          endDateTime: '2026-10-01T11:00:00Z',
          isClientVisible: false,
          participantEmployeeIds: ['emp-1'],
        });

        expect(meeting.id).toBe('meet-1');
        expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
          data: expect.objectContaining({ action: 'MEETING_CREATED' }),
        });
        expect(mockPrisma.notification.create).toHaveBeenCalledWith({
          data: expect.objectContaining({ eventType: 'MEETING_CREATED', recipientUserId: 'u-emp-1' }),
        });
      });

      it('should reject meeting where end time is before start time', async () => {
        mockPrisma.project.findUnique.mockResolvedValue({ id: 'p-1', projectCode: 'PRJ-1', status: 'IN_PROGRESS' });
        await expect(
          service.createMeeting(mockAdminUser, 'p-1', {
            title: 'Invalid Time Sync',
            meetingUrl: 'https://meet.google.com/abc-def',
            meetingProvider: 'GOOGLE_MEET',
            startDateTime: '2026-10-01T11:00:00Z',
            endDateTime: '2026-10-01T10:00:00Z',
            isClientVisible: false,
            participantEmployeeIds: [],
          }),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('External Resource Links Workspace', () => {
      it('should create external resource link e.g. GitHub repository', async () => {
        mockPrisma.project.findUnique.mockResolvedValue({ id: 'p-1', projectCode: 'PRJ-1', status: 'IN_PROGRESS' });
        mockPrisma.projectResourceLink.create.mockResolvedValue({
          id: 'link-1',
          projectId: 'p-1',
          title: 'GitHub Monorepo',
          url: 'https://github.com/company/repo',
          resourceType: 'GIT_REPOSITORY',
        });

        const link = await service.createResourceLink(mockAdminUser, 'p-1', {
          title: 'GitHub Monorepo',
          url: 'https://github.com/company/repo',
          resourceType: 'GIT_REPOSITORY',
          isClientVisible: false,
        });

        expect(link.id).toBe('link-1');
        expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
          data: expect.objectContaining({ action: 'PROJECT_RESOURCE_ADDED' }),
        });
      });

      it('should hide non-client-visible resource links from ORG_USER', async () => {
        mockPrisma.project.findUnique.mockResolvedValue({ id: 'p-1', projectCode: 'PRJ-1', status: 'IN_PROGRESS', organizationId: 'org-1' });
        mockPrisma.organizationUser.findFirst.mockResolvedValue({ id: 'ou-1', organizationId: 'org-1' });
        mockPrisma.projectResourceLink.findMany.mockResolvedValue([
          { id: 'l-public', isClientVisible: true },
        ]);

        const links = await service.getResourceLinks(mockOrgUser, 'p-1');
        expect(mockPrisma.projectResourceLink.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ where: expect.objectContaining({ isClientVisible: true }) }),
        );
      });
    });

    describe('Employee Workspace Self-Service Integration (Slice 4)', () => {
      const mockEmployeeUser = { id: 'u-emp-1', email: 'employee@anveshak.com', roles: ['EXPERT'] };

      it('should retrieve deliverables for assigned active projects', async () => {
        mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp-1', userId: 'u-emp-1' });
        mockPrisma.projectMember.findMany.mockResolvedValue([
          { projectId: 'p-1', status: 'ACTIVE' },
        ]);
        mockPrisma.projectDeliverable.findMany.mockResolvedValue([
          { id: 'deliv-1', projectId: 'p-1', title: 'Tech Report' },
        ]);

        const deliverables = await service.getEmployeeDeliverables(mockEmployeeUser);
        expect(deliverables.length).toBe(1);
        expect(deliverables[0].id).toBe('deliv-1');
      });

      it('should retrieve scheduled meetings for logged-in employee participant', async () => {
        mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp-1', userId: 'u-emp-1' });
        mockPrisma.projectMeeting.findMany.mockResolvedValue([
          { id: 'm-1', title: 'Weekly Sync', status: 'SCHEDULED' },
        ]);

        const meetings = await service.getEmployeeMeetings(mockEmployeeUser);
        expect(meetings.length).toBe(1);
        expect(meetings[0].id).toBe('m-1');
      });

      it('should retrieve shared resource links and technical documents for employee assigned projects', async () => {
        mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp-1', userId: 'u-emp-1' });
        mockPrisma.projectMember.findMany.mockResolvedValue([
          { projectId: 'p-1', status: 'ACTIVE' },
        ]);
        mockPrisma.projectResourceLink.findMany.mockResolvedValue([
          { id: 'link-1', title: 'GitHub Repo' },
        ]);
        mockPrisma.projectDeliverable.findMany.mockResolvedValue([]);
        mockPrisma.document.findMany.mockResolvedValue([
          { id: 'doc-1', title: 'Spec PDF' },
        ]);

        const res = await service.getEmployeeResources(mockEmployeeUser);
        expect(res.links.length).toBe(1);
        expect(res.documents.length).toBe(1);
      });
    });

    describe('Industry Client Portal Integration (Slice 5)', () => {
      const mockOrgUserAccount = { id: 'u-org-1', email: 'client@company.com', roles: ['ORG_USER'] };

      it('should retrieve Industry Dashboard multi-project metrics for authorized organization user', async () => {
        mockPrisma.organizationUser.findFirst.mockResolvedValue({
          id: 'ou-1',
          organizationId: 'org-1',
          organization: { legalName: 'Acme Research Corp' },
        });
        mockPrisma.project.findMany.mockResolvedValue([
          {
            id: 'p-1',
            projectCode: 'PRJ-1',
            title: 'AI Platform',
            status: 'IN_PROGRESS',
            milestones: [{ isClientVisible: true, progressPct: 80, status: 'IN_PROGRESS', dueDate: '2026-12-01' }],
            deliverables: [{ isClientVisible: true, status: 'APPROVED' }],
            meetings: [{ isClientVisible: true, status: 'SCHEDULED' }],
            members: [{ id: 'm-1', status: 'ACTIVE' }],
          },
        ]);
        mockPrisma.auditLog.findMany.mockResolvedValue([]);

        const dash = await service.getIndustryDashboard(mockOrgUserAccount);
        expect(dash.organizationName).toBe('Acme Research Corp');
        expect(dash.totalProjects).toBe(1);
        expect(dash.avgProgressPct).toBe(80);
      });

      it('should reject ORG_USER accessing project belonging to another organization (IDOR Protection)', async () => {
        mockPrisma.organizationUser.findFirst.mockResolvedValue({
          id: 'ou-1',
          organizationId: 'org-1',
          organization: { legalName: 'Acme Corp' },
        });
        mockPrisma.project.findUnique.mockResolvedValue({
          id: 'p-other-org',
          organizationId: 'org-OTHER-COMPETITOR',
          organization: { legalName: 'Competitor Corp' },
          milestones: [],
          deliverables: [],
          meetings: [],
          resourceLinks: [],
          members: [],
        });

        await expect(
          service.getIndustryProjectDetail(mockOrgUserAccount, 'p-other-org'),
        ).rejects.toThrow(ForbiddenException);
      });

      it('should create client meeting request with REQUESTED status and log audit trail', async () => {
        mockPrisma.organizationUser.findFirst.mockResolvedValue({
          id: 'ou-1',
          organizationId: 'org-1',
        });
        mockPrisma.project.findUnique.mockResolvedValue({
          id: 'p-1',
          organizationId: 'org-1',
        });
        mockPrisma.projectMeeting.create.mockResolvedValue({
          id: 'm-req-1',
          projectId: 'p-1',
          title: 'Quarterly Sync Request',
          status: 'REQUESTED',
        });

        const meeting = await service.requestClientMeeting(mockOrgUserAccount, 'p-1', {
          title: 'Quarterly Sync Request',
          startDateTime: '2026-10-15T10:00:00Z',
          endDateTime: '2026-10-15T11:00:00Z',
        });

        expect(meeting.status).toBe('REQUESTED');
        expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
          data: expect.objectContaining({ action: 'CLIENT_MEETING_REQUESTED' }),
        });
      });
    });

  });
});

