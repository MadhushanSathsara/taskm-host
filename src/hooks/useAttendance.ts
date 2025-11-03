import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import dayjs from 'dayjs';

export function useTodayAttendance(internId) {
  const [record, setRecord] = useState(null);
  const today = dayjs().format('YYYY-MM-DD');

  useEffect(() => {
    if (!internId) return;
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from('attendances')
        .select('*')
        .eq('intern_id', internId)
        .eq('attendance_date', today)
        .single();
      if (mounted) setRecord(data ?? null);
    })();
    return () => { mounted = false };
  }, [internId]);

  return { record, refresh: async () => {
    const { data } = await supabase
      .from('attendances')
      .select('*')
      .eq('intern_id', internId)
      .eq('attendance_date', today)
      .single();
    setRecord(data ?? null);
  }};
}
