import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private supabaseClient: SupabaseClient | null = null;
  private isConnected = false;

  onModuleInit() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      const errorMsg = 'Missing required Supabase environment configuration. Both SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in environment variables.';
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      this.supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      this.isConnected = true;
      this.logger.log(`Initialized Supabase Service Client (URL: ${supabaseUrl})`);
    } catch (err: any) {
      this.logger.error(`Failed to initialize Supabase Client: ${err.message}`);
      this.isConnected = false;
      throw err;
    }
  }

  getClient(): SupabaseClient | null {
    return this.supabaseClient;
  }

  get adminAuth(): any {
    return this.supabaseClient?.auth?.admin || null;
  }

  get auth(): any {
    return this.supabaseClient?.auth || null;
  }

  get storage(): any {
    return this.supabaseClient?.storage || null;
  }

  get isOperational(): boolean {
    return this.isConnected && !!this.supabaseClient;
  }

  /**
   * Authenticate user credentials directly against Supabase Auth (Single Authentication Authority)
   */
  async signInWithPassword(email: string, password: string) {
    if (!this.supabaseClient) {
      return { data: null, error: new Error('Supabase Auth Client uninitialized') };
    }
    return this.supabaseClient.auth.signInWithPassword({ email, password });
  }

  /**
   * Official Password Recovery: Send recovery email via Supabase Auth API
   */
  async resetPasswordForEmail(email: string, redirectTo?: string) {
    if (!this.supabaseClient) {
      return { data: null, error: new Error('Supabase Auth Client uninitialized') };
    }
    return this.supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || `${process.env.APP_URL || 'http://localhost:3000'}/reset-password`,
    });
  }

  /**
   * Update password in Supabase Auth via Admin Auth API
   */
  async updateUserPassword(userId: string, newPassword: string) {
    if (!this.adminAuth) {
      return { data: null, error: new Error('Supabase Admin Auth uninitialized') };
    }
    return this.adminAuth.updateUserById(userId, { password: newPassword });
  }

  /**
   * Validate Supabase JWT token and extract Supabase user identity
   */
  async getUserFromToken(token: string) {
    if (!this.supabaseClient) {
      return null;
    }
    try {
      const { data, error } = await this.supabaseClient.auth.getUser(token);
      if (error || !data?.user) {
        return null;
      }
      return data.user;
    } catch {
      return null;
    }
  }

  /**
   * Ensure an ERP user identity exists in Supabase Auth
   */
  async ensureSupabaseAuthUser(user: { id: string; email: string; password?: string; roles?: string[] }) {
    if (!this.adminAuth) {
      return null;
    }
    try {
      const { data: existing } = await this.adminAuth.getUserById(user.id);
      if (existing?.user) {
        if (user.password) {
          await this.adminAuth.updateUserById(user.id, {
            password: user.password,
            email_confirm: true,
            user_metadata: { roles: user.roles || [] },
          });
        }
        return existing.user;
      }

      const { data: created } = await this.adminAuth.createUser({
        id: user.id,
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { roles: user.roles || [] },
      });

      return created?.user || null;
    } catch (err: any) {
      this.logger.warn(`ensureSupabaseAuthUser notice: ${err.message}`);
      return null;
    }
  }
}
