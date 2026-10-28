import { createFileRoute } from '@tanstack/react-router';
import { authenticateCronRequest } from '@/integrations/supabase/cron-auth';
export const Route=createFileRoute('/api/public/jobs/study-week')({server:{handlers:{POST:async({request})=>{
 const failure=await authenticateCronRequest(request);if(failure)return failure;
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
 const {generateWeek}=await import('@/lib/study-calendar.server');
 const {monday,localDay}=await import('@/lib/study-planner');
 const {data,error}=await supabaseAdmin.from('study_plans').select('user_id');
 if(error)return Response.json({error:'Não foi possível carregar os planos.'},{status:500});
 const ids=[...new Set((data??[]).map(p=>p.user_id))];let updated=0,failed=0;
 for(const id of ids){try{await generateWeek(supabaseAdmin,id,monday(localDay()),true);updated++;}catch{failed++;}}
 return Response.json({updated,failed},{status:failed?500:200});
}}}});