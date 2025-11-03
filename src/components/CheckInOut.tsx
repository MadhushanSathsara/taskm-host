import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import dayjs from 'dayjs';

export default function CheckInOut({ internId, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const today = dayjs().format('YYYY-MM-DD');

  async function upsertAttendance(values) {
    setLoading(true);
    const { data, error } = await supabase
      .from('attendances')
      .upsert(values, { onConflict: ['intern_id','attendance_date'] })
      .select()
      .single();
    setLoading(false);
    if (error) {
      console.error(error);
      return null;
    }
    onUpdate?.(data);
    return data;
  }

  async function handleCheckIn() {
    await upsertAttendance({
      intern_id: internId,
      attendance_date: today,
      check_in: new Date().toISOString()
    });
  }

  async function handleCheckOut() {
    await upsertAttendance({
      intern_id: internId,
      attendance_date: today,
      check_out: new Date().toISOString()
    });
  }

  return (
    <div className="flex gap-3 items-center">
      <button onClick={handleCheckIn} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">Check In</button>
      <button onClick={handleCheckOut} disabled={loading} className="px-4 py-2 bg-emerald-600 text-white rounded">Check Out</button>
    </div>
  );
}
