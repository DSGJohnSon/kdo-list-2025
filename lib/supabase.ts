import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export type Gift = {
  id: string;
  title: string;
  description: string;
  purchase_link: string;
  image_url?: string;
  price: number;
  categories: string[];
  created_at: string;
  updated_at: string;
};

export type User = {
  id: string;
  name: string;
  hex_key: string;
  view_only: boolean;
  created_at: string;
};

export type Interest = {
  id: string;
  gift_id: string;
  user_id: string;
  created_at: string;
};