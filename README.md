# DevMetrics

An Interactive GitHub Profile Analyser. Enter a GitHub username and get a full breakdown of that developer'snpublic activity like repositories , languages used , contributions consistency , and a downloadable profile card.

**Live Site :** https://fahadiqbal18973.github.io/DevMetrics/

## Features

- Real-time analysis using the GitHub REST API (repos, languages, followers, account age)
- Contribution heatmap and longest-streak calculation
- Consistency score based on active days
- Downloadable profile identity card (PNG)
- Interactive terminal with commands (`help`, `clear`, `whoami`, `fetch-repos`)
- Dev Battle — compare two GitHub profiles across 5 categories
- Fully responsive, works on mobile and desktop
- No backend, no build step — pure HTML, CSS and JavaScript

## Tech stack

- HTML, CSS, JavaScript (vanilla, no frameworks)
- [GitHub REST API](https://docs.github.com/en/rest) for profile and repository data
- [github-contributions-api](https://github.com/grubersjoe/github-contributions-api) for contribution history
- [html2canvas](https://html2canvas.hertzen.com/) for generating the downloadable profile card
- Hosted on GitHub Pages

## Running locally

1. Clone the repository
   git clone
   https://github.com/fahadiqbal18973/DevMetrics.git

2. Open the folder in VS Code
3. Run `index.html` with the Live Server extension (or any static file server)

No build step, no dependencies to install.

## Notes

- Uses the unauthenticated GitHub API, which is limited to 60 requests per hour per IP.
- Contribution data comes from an unofficial API and may occasionally be unavailable; the app degrades gracefully in that case.

## Author

Built by [Fahad Iqbal]
(https://github.com/fahadiqbal18973)
