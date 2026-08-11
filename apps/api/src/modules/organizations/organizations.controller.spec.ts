import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { ForbiddenException } from '@nestjs/common';

describe('OrganizationsController & Organization Data Isolation', () => {
  let controller: OrganizationsController;

  const mockOrgsService = {
    findOne: jest.fn().mockResolvedValue({ id: 'org-b-uuid', legalName: 'Organization B' }),
    findAll: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationsController],
      providers: [{ provide: OrganizationsService, useValue: mockOrgsService }],
    }).compile();

    controller = module.get<OrganizationsController>(OrganizationsController);
  });

  it('1. should allow ORG_USER to access their own assigned organization ID', async () => {
    const user = { id: 'u1', roles: ['ORG_USER'], organizationId: 'org-a-uuid' };
    mockOrgsService.findOne.mockResolvedValueOnce({ id: 'org-a-uuid', legalName: 'Organization A' });

    const result = await controller.findOne('org-a-uuid', user);
    expect(result.success).toBe(true);
    expect(result.data.id).toBe('org-a-uuid');
  });

  it('2. should throw ForbiddenException (403) when ORG_USER attempts to access another organization ID', async () => {
    const user = { id: 'u1', roles: ['ORG_USER'], organizationId: 'org-a-uuid' };

    await expect(controller.findOne('org-b-uuid', user)).rejects.toThrow(ForbiddenException);
  });

  it('3. should allow ADMIN role to access any organization ID', async () => {
    const adminUser = { id: 'u2', roles: ['ADMIN'], organizationId: 'org-a-uuid' };

    const result = await controller.findOne('org-b-uuid', adminUser);
    expect(result.success).toBe(true);
    expect(result.data.id).toBe('org-b-uuid');
  });
});
