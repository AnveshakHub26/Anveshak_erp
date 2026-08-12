import { SupabaseService } from './supabase.service';

describe('SupabaseService Strict Configuration Suite', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('1. should throw a clear error on startup if SUPABASE_URL is missing', () => {
    delete process.env.SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid_service_key';

    const service = new SupabaseService();
    expect(() => service.onModuleInit()).toThrow(
      'Missing required Supabase environment configuration. Both SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in environment variables.',
    );
  });

  it('2. should throw a clear error on startup if SUPABASE_SERVICE_ROLE_KEY is missing', () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const service = new SupabaseService();
    expect(() => service.onModuleInit()).toThrow(
      'Missing required Supabase environment configuration. Both SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in environment variables.',
    );
  });

  it('3. should initialize successfully when both SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are configured', () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid_service_role_key_123';

    const service = new SupabaseService();
    expect(() => service.onModuleInit()).not.toThrow();
    expect(service.isOperational).toBe(true);
    expect(service.getClient()).not.toBeNull();
  });
});
