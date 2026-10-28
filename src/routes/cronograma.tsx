import { createFileRoute } from '@tanstack/react-router';
import { StudyCalendar } from '@/components/StudyCalendar';
export const Route=createFileRoute('/cronograma')({
 head:()=>({meta:[{title:'Cronograma de Estudos — Nexem'},{name:'description',content:'Seu calendário personalizado para o ENEM: estudos, revisões e prática que respeitam sua rotina.'},{property:'og:title',content:'Cronograma de Estudos — Nexem'},{property:'og:description',content:'Uma semana personalizada de estudo, revisão e prática no seu ritmo.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),
 component:()=> <StudyCalendar/>,
});