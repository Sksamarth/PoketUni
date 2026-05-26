import { supabase } from '../../src/utils/supabaseClient';

const TABLE_NAME = 'kv_store_75fee4df';
const KEY = 'app_vendors';

export async function getVendors(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('value')
      .eq('key', KEY)
      .maybeSingle();

    if (error) {
      console.error('Supabase error:', error);
      // Return empty instead of fallback to see if connection works
      return [];
    }

    return data?.value || [];
  } catch (e) {
    console.error('Fetch error:', e);
    return [];
  }
}

export async function saveVendors(vendors: any[]): Promise<void> {
  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert({ key: KEY, value: vendors });

  if (error) {
    throw new Error(error.message);
  }
}
