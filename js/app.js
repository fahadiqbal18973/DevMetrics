const terminal = document.getElementById("terminal");
const steps = document.querySelectorAll(".steps li");
const screens = document.querySelectorAll(".screen");
let userName = "";

function typeText(el, text, speed = 25) {
  el.textContent = "";
  return new Promise((resolve) => {
    let i = 0;
    const timer = setInterval(() => {
      el.textContent += text[i++];
      if (i >= text.length) {
        clearInterval(timer);
        resolve();
      }
    }, speed);
  });
}

async function logCommand(cmd, output) {
  const line = document.createElement("div");
  line.innerHTML = '<span class="prompt">$</span> <span class="cmd"></span>';
  terminal.appendChild(line);
  await typeText(line.querySelector(".cmd"), cmd);
  if (output) {
    const out = document.createElement("div");
    out.className = "output";
    out.textContent = output;
    terminal.appendChild(out);
  }
  terminal.scrollTop = terminal.scrollHeight;
}

function showScreen(index) {
  screens.forEach((s, i) => s.classList.toggle("active", i === index));
  steps.forEach((s, i) => {
    s.classList.toggle("active", i === index);
    s.classList.toggle("done", i < index);
  });
}

async function intro() {
  await new Promise((r) => setTimeout(r, 900));
  await typeText(
    document.getElementById("bubble"),
    "Hi, I am Fahad. Ready to analyse a GitHub profile?",
    30,
  );
  document.getElementById("startBtn").classList.add("show");
}

async function nameScreen() {
  showScreen(1);
  const input = document.getElementById("nameInput");
  await typeText(
    document.getElementById("nameBubble"),
    "First, what's your name?",
  );
  input.focus();
}

async function submitName() {
  const input = document.getElementById("nameInput");
  const error = document.getElementById("nameError");
  const value = input.value.trim();

  if (!value) {
    error.textContent = "Enter your name to continue.";
    return;
  }
  userName = value;
  error.textContent = "";
  await logCommand('set --name "' + userName + '"', "saved");
  usernameScreen();
}

let busy = false;

async function usernameScreen() {
  showScreen(2);
  const input = document.getElementById("userInput");
  await typeText(
    document.getElementById("userBubble"),
    "Nice to meet you, " +
      userName +
      ". Which GitHub username should I analyse?",
  );
  input.focus();
}

async function fetchProfile(username) {
  try {
    const res = await fetch(
      "https://api.github.com/users/" + encodeURIComponent(username),
    );
    if (res.status === 404) return { status: "notFound" };
    if (res.status === 403) return { status: "rateLimited" };
    if (!res.ok) return { status: "failed" };
    return { status: "ok", data: await res.json() };
  } catch (err) {
    return { status: "failed" };
  }
}

async function submitUsername() {
  if (busy) return;
  const input = document.getElementById("userInput");
  const error = document.getElementById("userError");
  const value = input.value.trim().replace(/^@/, "");

  if (!value) {
    error.textContent = "Enter a GitHub username.";
    return;
  }

  busy = true;
  await logCommand("fetch api.github.com/users/" + value, "request sent");
  const result = await fetchProfile(value);

  if (result.status === "notFound") {
    error.textContent =
      "Oops, couldn't find @" + value + ". Check the spelling and try again.";
    await logCommand("fetch --user " + value, "404 user not found");
  } else if (result.status === "rateLimited") {
    error.textContent =
      "GitHub's request limit is reached. Try again in a few minutes.";
    await logCommand("fetch --user " + value, "403 rate limited");
  } else if (result.status === "failed") {
    error.textContent =
      "Something went wrong. Check your internet and try again.";
    await logCommand("fetch --user " + value, "request failed");
  } else {
    const p = result.data;
    await logCommand(
      "profile found",
      p.login + " · " + p.public_repos + " public repos",
    );
    scanScreen(p);
  }
  busy = false;
}

let profile = {};
let analysis = {};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function tick(index) {
  document.querySelectorAll("#checklist li")[index].classList.add("ok");
  document.getElementById("progressBar").style.width =
    ((index + 1) / 3) * 100 + "%";
}

async function fetchRepos(username) {
  const url =
    "https://api.github.com/users/" +
    encodeURIComponent(username) +
    "/repos?per_page=100&sort=updated";
  const res = await fetch(url);
  if (!res.ok) throw new Error("repos request failed");
  return res.json();
}

function analyseRepos(repos) {
  const own = repos.filter((r) => !r.fork);

  const langCount = {};
  own.forEach((r) => {
    if (r.language) langCount[r.language] = (langCount[r.language] || 0) + 1;
  });
  const total = Object.values(langCount).reduce((a, b) => a + b, 0);

  const languages = Object.entries(langCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({
      name,
      percent: Math.round((count / total) * 100),
    }));

  const projects = [...own]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 3)
    .map((r) => ({
      name: r.name,
      stars: r.stargazers_count,
      language: r.language,
    }));

  const stars = own.reduce((sum, r) => sum + r.stargazers_count, 0);
  return { languages, projects, stars, repoCount: own.length };
}

async function scanScreen(p) {
  profile = p;
  showScreen(3);
  document
    .querySelectorAll("#checklist li")
    .forEach((li) => li.classList.remove("ok"));
  document.getElementById("progressBar").style.width = "0";
  document.getElementById("scanAvatar").src = p.avatar_url;
  document.getElementById("scanTitle").textContent = "Scanning @" + p.login;
  document.getElementById("scanInfo").textContent =
    (p.name || p.login) + " · " + p.followers + " followers";

  try {
    const repos = await fetchRepos(p.login);
    await wait(500);
    tick(0);
    await logCommand("fetch repos", repos.length + " repositories");

    analysis = analyseRepos(repos);
    await wait(500);
    tick(1);
    const names = analysis.languages.map((l) => l.name).join(", ");
    await logCommand("analyse languages", names || "no language data");

    await wait(500);
    tick(2);
    await logCommand(
      "scan complete",
      analysis.stars + " stars across " + analysis.repoCount + " repos",
    );
  } catch (err) {
    document.getElementById("scanTitle").textContent =
      "Couldn't finish the scan";
    document.getElementById("scanInfo").textContent =
      "Check your internet and try again.";
    await logCommand("scan --user " + p.login, "request failed");
  }
}
document.getElementById("startBtn").addEventListener(
  "click",
  async () => {
    await logCommand("fahad --start", "analysis started");
    nameScreen();
  },
  { once: true },
);

document.getElementById("nameBtn").addEventListener("click", submitName);
document.getElementById("nameInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") submitName();
});
document.getElementById("nameInput").addEventListener("input", () => {
  document.getElementById("nameError").textContent = "";
});

logCommand("devmetrics --init", "modules loaded");
intro();
document.getElementById("userBtn").addEventListener("click", submitUsername);
document.getElementById("userInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") submitUsername();
});
document.getElementById("userInput").addEventListener("input", () => {
  document.getElementById("userError").textContent = "";
});
