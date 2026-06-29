// HAMBURGER
const hamburgerBtn = document.getElementById('hamburgerBtn');
const mobileMenu   = document.getElementById('mobileMenu');
hamburgerBtn.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  hamburgerBtn.classList.toggle('open', open);
  hamburgerBtn.setAttribute('aria-expanded', open);
});
document.querySelectorAll('.mobile-link').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    hamburgerBtn.classList.remove('open');
    hamburgerBtn.setAttribute('aria-expanded', false);
  });
});

// TERMINAL
const lines = [
  { text: 'whoami',                       cls: 'prompt' },
  { text: '→ Daniel Eduardo Jaimes G.',   cls: 'out'    },
  { text: '',                             cls: 'out'    },
  { text: 'cat stack.json',               cls: 'prompt' },
  { text: '{ frontend: "HTML/CSS/JS" }',  cls: 'accent' },
  { text: '{ backend:  "Python/Node" }',  cls: 'accent' },
  { text: '{ data:     "SQL" }',          cls: 'accent' },
  { text: '{ bots:     "n8n" }',          cls: 'accent' },
  { text: '',                             cls: 'out'    },
  { text: 'git log --oneline',            cls: 'prompt' },
  { text: '✔ Hackathon Metrolínea',       cls: 'out'    },
  { text: '✔ DeliveryBot con n8n',        cls: 'out'    },
  { text: '✔ Sistema préstamos vecinal',  cls: 'out'    },
];

const termBody = document.getElementById('terminalBody');
async function typeWriter() {
  for (const line of lines) {
    const el = document.createElement('div');
    if (line.cls === 'prompt') {
      const pr  = document.createElement('span'); pr.className = 't-prompt'; pr.textContent = '❯ ';
      const cmd = document.createElement('span'); cmd.className = 't-cmd';
      el.appendChild(pr); el.appendChild(cmd);
      termBody.appendChild(el);
      await typeLine(cmd, line.text);
    } else if (line.cls === 'accent') {
      el.className = 't-accent'; termBody.appendChild(el);
      await typeLine(el, line.text, 25);
    } else {
      el.className = 't-out'; el.textContent = line.text;
      termBody.appendChild(el); await delay(70);
    }
  }
  const cursor = document.createElement('span'); cursor.className = 't-cursor';
  termBody.appendChild(cursor);
}
function typeLine(el, text, speed = 45) {
  return new Promise(resolve => {
    let i = 0;
    const iv = setInterval(() => {
      el.textContent += text[i++];
      if (i >= text.length) { clearInterval(iv); resolve(); }
    }, speed);
  });
}
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
setTimeout(typeWriter, 700);

// SCROLL REVEAL + SKILL BARS
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      entry.target.querySelectorAll('.skill-bar[data-w]').forEach(bar => {
        bar.style.width = bar.dataset.w + '%';
      });
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
document.querySelectorAll('.skill-card').forEach(card => observer.observe(card));

