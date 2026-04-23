# Session Queue and Registration

## Queue Model

Queue is a desktop enhancement layered on top of the official local UI.

- A session can be queued before registration opens.
- A queued session can later become eligible for immediate registration.
- Queue state is stored locally and restored on the next launch.

## Main States

- `Queued`: the session is being tracked but is not ready to register yet.
- `Found`: a matching race session is available and can be registered immediately.
- `Registering`: iRefinedX is performing the registration workflow.
- `Registered`: the active session matches the queued target.

## Manual Register

- When the blue queue status dot is active, clicking it triggers an immediate register attempt.
- If another session is already registered, iRefinedX first performs a withdraw, then registers the queued target.

## Automatic Register

- Automatic register starts when the queued race session reaches the configured native registration window.
- The queue state updates after native registration state changes, including withdraw and re-register scenarios.

## Behavior Design

- The top green button remains aligned with the official UI flow.
- Queue logic is handled by dedicated queue controls and queue state markers.
- Queue state does not permanently override native register and withdraw state.
