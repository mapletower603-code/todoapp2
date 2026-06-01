import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ekisyewavcuazjfbcest.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVraXN5ZXdhdmN1YXpqZmJjZXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyODQzMTMsImV4cCI6MjA5NTg2MDMxM30.Ndn7K8HN_r5oUZM-WPzvMqjaN-_h4sq74ADIQ2AZ6BI";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
