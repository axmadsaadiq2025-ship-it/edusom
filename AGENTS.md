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
- Protected-layout identity (user/profile/roles) is resolved once in `_authenticated` beforeLoad, cached in `src/lib/identity-cache.ts` (cleared on auth events), and read by `useAuth()` from route context — never re-fetch it per page.
- Shared lookups (classes/sections/years/subjects) go through `src/hooks/use-school-lookups.ts` so query keys and caching stay consistent.
- Registration forms use `src/components/forms/wizard.tsx`; student/teacher codes (STU-/EMP-NNNN) come from `nextSequentialCode` with retry on unique-constraint conflicts.
