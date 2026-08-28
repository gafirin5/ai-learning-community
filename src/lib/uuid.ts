// Pemetaan deterministik uuid → number agar state frontend (yang memakai id number)
// tetap konsisten dengan Supabase (user id = uuid). Content id (courses/threads/…)
// sudah bigint, jadi tidak perlu dipetakan.
export function uuidToNumber(uuid: string): number {
  let h = 0;
  for (let i = 0; i < uuid.length; i++) {
    h = (h * 31 + uuid.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
