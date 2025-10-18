---
description: Best practices for writing React.js code
relevant_for: Writing React.js code, working on React components, implementing React features, refactoring React code
---

# React Best Practices

This page has instructions on writing React.js in the best possible way.

# Avoid useEffect

Avoid using `useEffect` as much as possible. The `useEffect` function is
a crutch that is misapplied and overused in so many situations. When used,
it creates interfaces that are glitchy, hard to test, and full of weird
subtle behavior.

Below are some strategies for removing `useEffect`:

## Unnecessary useEffect / useState:

Here's a classic antipattern where useState/useEffect is unnecessarily
used for performance optimization / memoization.

```
const [ value, setValue ] = useState('');
useEffect(() => {
    setValue(calculateValue());
}, []);

return <div>{value}</div>
```

In many cases, it's fine to call `calculateValue` during the rendering pass,
and this pattern can simply be reduced to:

```
const value = calculateValue();
return <div>{value}</div>
```

## Loading initial data

This antipattern uses useEffect/useState to populate initial data when the
component is loading.

```
function DraftPage() {
    const { data: draft, isLoading, error } = useGetDraft(draftId);
    const [ name, setName ] = useState('');

    useEffect(() => {
        if (draft?.body_json && typeof draft.body_json === 'object') {
        const draftData = draft.body_json as any;
        if (draftData.name && !name) {
            // Set initial value for the name now that the draft has loaded.
            setName(draftData.name);
        }
        }
    }, [ draft, name ])

    if (isLoading) {
        return <div>Loading...</div>
    }

    return <div>
    <input
        name="name"
        type="text"
        value={name}
        />
    </div>
}
```

This particular antipattern had a weird bug - If the user decided to delete
the contents of the text field, then the useEffect would re-write it so that
the text value was reset to draftData.name again, which is not what the user
wanted.

The **fix** for this antipattern is to separate the rendering into two
layers of components. One layer handles the loading and the second layer is
visible once all the data is loaded.

Example fix:
```
function DraftPageForm({ draftData }) {
    // When this component renders, we are guaranteed that 'draftData' has
    // fully loaded

    const [ name, setName ] = useState(draftData.name || '');

    return <div>
    <input
        name="name"
        type="text"
        value={name}
        />
    </div>
}

function DraftPage() {
    const { data: draft, isLoading, error } = useGetDraft(draftId);

    if (isLoading) {
        return <div>Loading...</div>
    }

    // The draft is loaded.
    return <DraftPageForm
      draftData={draft}
    />
}
```
