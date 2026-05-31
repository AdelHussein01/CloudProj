# GitHub Actions UI Background Policy

The CI and release workflows include a UI background gate:

- `red` fails the workflow.
- `green` passes immediately.
- Any other background waits for approval through the `ui-background-approval` GitHub Environment.

The check reads `apps/web/app/globals.css` and evaluates the final `body` `background` or `background-color` declaration.

## Required GitHub Setting For Background Approval

Create a protected environment:

1. Open the repository on GitHub.
2. Go to `Settings` -> `Environments`.
3. Create an environment named `ui-background-approval`.
4. Enable `Required reviewers`.
5. Add the teacher, repository admin, or chosen reviewer.
6. Save the environment.

After this is configured, any body background other than red or green will pause the workflow until a reviewer approves it.

## Demo Examples

In `apps/web/app/globals.css`, adding this at the end of the file fails:

```css
body {
  background: red;
}
```

Adding this passes:

```css
body {
  background: green;
}
```

Adding either of these pauses for approval:

```css
body {
  background: yellow;
}
```

```css
body {
  background: pink;
}
```
