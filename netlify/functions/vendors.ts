import { createClient } from '@supabase/supabase-js';

const projectId = "qyazivfpnboveqfcmrby";
const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5YXppdmZwbmJvdmVxZmNtcmJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NTEyNjksImV4cCI6MjA5MDAyNzI2OX0.DTLj2bYFz7-pbScV9IhutQamBNOQiEX6fL-Jjnk4kZs";

const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);
const TABLE_NAME = 'kv_store_75fee4df';
const KEY = 'app_vendors';

export default async (req: Request) => {
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("value")
      .eq("key", KEY)
      .maybeSingle();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const vendors = data?.value || [];

    return new Response(JSON.stringify(vendors), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "POST") {
    try {
      const body = await req.json();
      const { error } = await supabase
        .from(TABLE_NAME)
        .upsert({ key: KEY, value: body });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Method Not Allowed", { status: 405 });
};
