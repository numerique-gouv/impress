# Contributing to the Project

Thank you for taking the time to contribute! Please follow these guidelines to ensure a smooth and productive workflow. 🚀🚀🚀

To get started with the project, please refer to the [README.md](https://github.com/numerique-gouv/impress/blob/main/README.md) for detailed instructions.

## Creating an Issue

When creating an issue, please provide the following details:

1.  **Title**: A concise and descriptive title for the issue.
2.  **Description**: A detailed explanation of the issue, including relevant context or screenshots if applicable.
3.  **Steps to Reproduce**: If the issue is a bug, include the steps needed to reproduce the problem.
4.  **Expected vs. Actual Behavior**: Describe what you expected to happen and what actually happened.
5.  **Labels**: Add appropriate labels to categorize the issue (e.g., bug, feature request, documentation).

## Commit Message Format

All commit messages must adhere to the following format:

`<gitmoji>(type) title description`

*   <**gitmoji**>: Use a gitmoji to represent the purpose of the commit. For example, ✨ for adding a new feature or 🔥 for removing something, see the list here: <https://gitmoji.dev/>.
*   **(type)**: Describe the type of change. Common types include `backend`, `frontend`, `CI`, `docker` etc...
*   **title**: A short, descriptive title for the change, starting with a lowercase character.
*   **description**: Include additional details about what was changed and why.

### Example Commit Message

```
✨(frontend) add user authentication logic 

Implemented login and signup features, and integrated OAuth2 for social login.
```

## Changelog Update

Please add a line to the changelog describing your development. The changelog entry should include a brief summary of the changes, this helps in tracking changes effectively and keeping everyone informed. We usually include the title of the pull request, followed by the pull request ID to finish the log entry. The changelog line should be less than 80 characters in total.

### Example Changelog Message
```
## [Unreleased]

## Added

- ✨(frontend) add AI to the project #321
```

## Pull Requests

It is nice to add information about the purpose of the pull request to help reviewers understand the context and intent of the changes. If you can, add some pictures or a small video to show the changes.

### Don't forget to: 
- check your commits
- check the linting: `make lint && make frontend-lint`
- check the tests: `make test`
- add a changelog entry

Once all the required tests have passed, you can request a review from the project maintainers.

## Code Style

Please maintain consistency in code style. Run any linting tools available to make sure the code is clean and follows the project's conventions.

## Tests

Make sure that all new features or fixes have corresponding tests. Run the test suite before pushing your changes to ensure that nothing is broken.

## Asking for Help

If you need any help while contributing, feel free to open a discussion or ask for guidance in the issue tracker. We are more than happy to assist!

Thank you for your contributions! 👍
