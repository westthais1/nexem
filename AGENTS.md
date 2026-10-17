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
- Gate the existing study workspace in the root shell on the persisted profile quiz completion before mounting study pages; keep this separate from challenge onboarding so both new and existing students answer once.
- Keep student quiz validation in a browser-safe shared schema and save its answers atomically with completion through the owner-scoped profile client.
