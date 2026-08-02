import { computed, inject, Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase-service';
import { Session } from '@supabase/supabase-js';
import { ProfileRole } from '../models/profile.model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private supabaseservice = inject(SupabaseService);
  private router = inject(Router);

  private supabase = this.supabaseservice.client;

  private _session = signal<Session | null>(null);
  private _roles = signal<ProfileRole[]>([]);
  private _loading = signal(false);
  private _profile = signal<{ name: string; avatar_url: string | null } | null>(
    null,
  );

  private _initialized = signal(false);

  session = this._session.asReadonly();
  user = computed(() => this._session()?.user ?? null);
  roles = this._roles.asReadonly();
  isLoggedIn = computed(() => !!this._session());
  loading = this._loading.asReadonly();
  profile = this._profile.asReadonly();
  initialized = this._initialized.asReadonly();

  constructor() {
    this.init();
  }

  private async init() {
    const { data } = await this.supabase.auth.getSession();
    this._session.set(data.session);
    if (data.session) {
      await this.loadRoles(data.session.user.id);
      await this.loadProfile(data.session.user.id);
    }
    this._initialized.set(true);
    this.supabase.auth.onAuthStateChange(async (_, session) => {
      this._session.set(session);
      if (session) {
        await this.loadRoles(session.user.id);
        await this.loadProfile(session.user.id);
      } else {
        this._roles.set([]);
        this._profile.set(null);
      }
    });
  }

  private async loadRoles(userId: string) {
    const { data } = await this.supabase
      .from('profile_roles')
      .select('role')
      .eq('profile_id', userId);
    this._roles.set(data?.map((r) => r.role as ProfileRole) ?? []);
  }

  private async loadProfile(userId: string) {
    const { data } = await this.supabase
      .from('profiles')
      .select('name, avatar_url')
      .eq('id', userId)
      .single();
    this._profile.set(data ?? null);
  }

  hasRole(role: ProfileRole) {
    return this._roles().includes(role);
  }

  async signIn(email: string, password: string) {
    this._loading.set(true);
    const result = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    this._loading.set(false);
    return result;
  }

  async signUp(email: string, password: string, name: string) {
    this._loading.set(true);
    const result = await this.supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    this._loading.set(false);
    return result;
  }

  async signInWithGoogle() {
    return this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }
  async signOut() {
    await this.supabase.auth.signOut();
    this.router.navigate(['/login']);
  }

  async verifyOpt(email: string, token: string) {
    this._loading.set(true);

    const result = await this.supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    });

    this._loading.set(false);

    return result;
  }
  async updateAvatarUrl(avatarUrl: string) {
    const userId = this.user()?.id;
    if (!userId) return;

    const { error } = await this.supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);

    if (error) throw error;
    this._profile.set({
      ...this._profile(),
      name: this._profile()?.name ?? '',
      avatar_url: avatarUrl,
    });
  }
}
