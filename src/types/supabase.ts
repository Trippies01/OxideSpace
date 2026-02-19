// Supabase Database Types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          discriminator: string | null;
          avatar_url: string | null;
          status: string | null;
          bio: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          username?: string | null;
          discriminator?: string | null;
          avatar_url?: string | null;
          status?: string | null;
          bio?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          username?: string | null;
          discriminator?: string | null;
          avatar_url?: string | null;
          status?: string | null;
          bio?: string | null;
          updated_at?: string | null;
        };
      };
      servers: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          icon_url: string | null;
          owner_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          icon_url?: string | null;
          owner_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          icon_url?: string | null;
          owner_id?: string | null;
        };
      };
      channels: {
        Row: {
          id: string;
          created_at: string;
          server_id: string;
          name: string;
          type: string;
          category: string | null;
          position: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          server_id: string;
          name: string;
          type: string;
          category?: string | null;
          position?: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          server_id?: string;
          name?: string;
          type?: string;
          category?: string | null;
          position?: number;
        };
      };
      messages: {
        Row: {
          id: string;
          created_at: string;
          channel_id: string;
          user_id: string;
          content: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          channel_id: string;
          user_id: string;
          content: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          channel_id?: string;
          user_id?: string;
          content?: string;
        };
      };
      voice_states: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          channel_id: string;
          server_id: string | null;
          muted: boolean;
          deafened: boolean;
          video_enabled: boolean;
          screen_share_enabled: boolean;
          session_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          channel_id: string;
          server_id?: string | null;
          muted?: boolean;
          deafened?: boolean;
          video_enabled?: boolean;
          screen_share_enabled?: boolean;
          session_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          channel_id?: string;
          server_id?: string | null;
          muted?: boolean;
          deafened?: boolean;
          video_enabled?: boolean;
          screen_share_enabled?: boolean;
          session_id?: string | null;
        };
      };
      server_members: {
        Row: {
          server_id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          server_id: string;
          user_id: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          server_id?: string;
          user_id?: string;
          role?: string;
          created_at?: string;
        };
      };
      server_invites: {
        Row: {
          id: string;
          server_id: string;
          code: string;
          created_by: string;
          created_at: string;
          expires_at: string | null;
          max_uses: number | null;
          uses: number;
        };
        Insert: {
          id?: string;
          server_id: string;
          code: string;
          created_by: string;
          created_at?: string;
          expires_at?: string | null;
          max_uses?: number | null;
          uses?: number;
        };
        Update: {
          id?: string;
          server_id?: string;
          code?: string;
          created_by?: string;
          created_at?: string;
          expires_at?: string | null;
          max_uses?: number | null;
          uses?: number;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string | null;
          read: boolean;
          created_at: string;
          link_url: string | null;
          extra: unknown;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body?: string | null;
          read?: boolean;
          created_at?: string;
          link_url?: string | null;
          extra?: unknown;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          body?: string | null;
          read?: boolean;
          created_at?: string;
          link_url?: string | null;
          extra?: unknown;
        };
      };
      dm_threads: {
        Row: {
          id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
        };
      };
      dm_participants: {
        Row: {
          thread_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          thread_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          thread_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      dm_messages: {
        Row: {
          id: string;
          created_at: string;
          thread_id: string;
          user_id: string;
          content: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          thread_id: string;
          user_id: string;
          content: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          thread_id?: string;
          user_id?: string;
          content?: string;
        };
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Server = Database['public']['Tables']['servers']['Row'];
export type Channel = Database['public']['Tables']['channels']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type VoiceState = Database['public']['Tables']['voice_states']['Row'];
export type ServerMember = Database['public']['Tables']['server_members']['Row'];
export type ServerInvite = Database['public']['Tables']['server_invites']['Row'];
export type DmThread = Database['public']['Tables']['dm_threads']['Row'];
export type DmParticipant = Database['public']['Tables']['dm_participants']['Row'];
export type DmMessage = Database['public']['Tables']['dm_messages']['Row'];


