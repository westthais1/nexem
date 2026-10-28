<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep `/landing?preview=true` accessible without session redirects so signed-in users can review the public presentation without logging out; normal landing visits retain onboarding redirects.
- Material achievement paths store generated subject levels and final exam questions inside the existing path JSON and owner-scoped quiz attempts inside step_status; shared browser-safe grading keeps progression and analytics consistent without changing legacy material records until explicitly regenerated.
- Subscription state is owner-readable and service-role writable in a separate entitlement table; never trust browser storage or profile metadata for paid access.
- Use SubscriptionProvider for workspace paywalls and authenticated premium question/attempt server functions for paid actions; keep all legacy full-exam entry points behind PremiumGate to prevent alternate-route bypasses.
- Tutor consultation reservations use an authenticated atomic database function with a per-user transaction lock, and only the server may finish or refund transactions; concurrent devices must share the same usage budget.
- Gate all existing study pages in the root shell on student_profiles.onboarding_completed before mounting content; the separate challenge onboarding must not bypass the student profile gate.
- Keep onboarding schemas, summary and schedule calculations browser-safe and shared; authenticated server functions validate each transition, grade diagnostics and complete onboarding only after explicit summary confirmation.
- Store resumable onboarding answers and schedules in owner-scoped student_profiles, not browser storage; mirror legacy profile fields only after confirmation so older consumers stay compatible.
- Use onboarding-derived area levels only as the daily challenge's initial estimate before any completed challenge; preserve measured progress and keep mastery achievements starting at zero.
- Keep daily challenge diagnosis in a pure browser-safe module shared by the results UI, rewards and saved consistency metric so these cannot disagree; test it without database dependencies.
- Keep the uploaded question mascot and speech bubble in a daily-challenge-only presentation component so other practice modules retain their layouts.
- Landing navigation uses a shared link list for desktop and mobile (closable mobile menu); "Como funciona" is a same-page anchor, while Entenda a TRI, Guia do ENEM, Perguntas frequentes and Nexem Pro are separate public routes (/entenda-tri, /guia-enem, /perguntas-frequentes, /nexem-pro) rendered inside PublicPageShell and whitelisted in the root session guard like /landing.
