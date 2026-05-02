import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://ijkjttiplxdkzbfhcorl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlqa2p0dGlwbHhka3piZmhjb3JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MTk5NTcsImV4cCI6MjA5MzI5NTk1N30.QJNqF26qYtqZXW5MOiHusONOGOCyTG1jIlBoXe0lKiY"
);