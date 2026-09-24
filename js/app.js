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

function scanScreen(p) {
  showScreen(3);
  document.getElementById("scanAvatar").src = p.avatar_url;
  document.getElementById("scanTitle").textContent =
    "Profile found: @" + p.login;
  document.getElementById("scanInfo").textContent =
    (p.name || p.login) +
    " · " +
    p.followers +
    " followers · " +
    p.public_repos +
    " repos";
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
