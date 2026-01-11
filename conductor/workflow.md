# Project Workflow

This document defines the development process and quality standards for the Prompt Vault project.

## Development Process
1.  **Task Selection:** Select the next task from the current track's `plan.md`.
2.  **Implementation:**
    *   Follow the project's code style guides.
    *   Ensure all new features include unit tests.
3.  **Verification:**
    *   Run the test suite to ensure all tests pass.
    *   Maintain a minimum of **80% code coverage** for all new logic.
4.  **Checkpointing:**
    *   **Commit changes after every task.**
    *   Use **Git Notes** to record a brief summary of the completed task.

## Quality Standards
*   Code must be readable and well-documented where necessary.
*   No secrets or API keys should ever be committed to the repository.
*   All PRs/merges must pass the defined test coverage threshold.
