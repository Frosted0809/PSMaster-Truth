/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL.startsWith('http'))
  ? import.meta.env.VITE_SUPABASE_URL 
  : 'https://orrsamqyzuaummcogzcl.supabase.co';

const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY.length > 20)
  ? import.meta.env.VITE_SUPABASE_ANON_KEY
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ycnNhbXF5enVhdW1tY29nemNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NTE4ODksImV4cCI6MjA5NDQyNzg4OX0.MpBhn2DKvvA9nuEftsS4FsVaUSAFHZ9vFO_TWUC_bWs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
