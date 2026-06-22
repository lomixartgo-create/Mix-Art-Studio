(() => {
  const STORAGE_KEY = 'mixArtBeanBrief';
  const isOrderPage = /order\.html(?:$|[?#])/.test(window.location.pathname) || document.getElementById('orderForm');

  const questions = [
    { key: 'package', label: 'Which package sounds closest?', prompt: 'What are you looking for?', chips: ['Logo Starter - from $35', 'Creator Brand Kit - from $79', 'Art + Launch Kit - from $149+', 'Not sure yet'] },
    { key: 'name', label: 'Name', prompt: 'What is your name?' },
    { key: 'email', label: 'Email', prompt: 'What email should Patrick reply to?' },
    { key: 'business', label: 'Project name', prompt: 'What is the business, project, art, or idea called?' },
    { key: 'type', label: 'Use', prompt: 'What is it for? Example: business, gift, streamer, band, flyer, shop, social page.' },
    { key: 'colors', label: 'Colours', prompt: 'Any colours you like or want to avoid?' },
    { key: 'style', label: 'Style', prompt: 'What style feels right?', chips: ['Clean and professional', 'Fun and colorful', 'Bold and tough', 'Luxury / premium', 'Cartoon / mascot', 'Not sure yet'] },
    { key: 'details', label: 'Details', prompt: 'Tell me the idea in your own words. Rough is okay.' },
    { key: 'usage', label: 'Where used', prompt: 'Where will you use it? Website, Facebook, shirts, signs, business cards, stickers, etc.' }
  ];

  let step = 0;
  let answers = loadAnswers();
  let open = false;

  function loadAnswers() {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}') || {}; }
    catch { return {}; }
  }
  function saveAnswers() { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers)); }

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else node.setAttribute(k, v);
    });
    children.forEach(child => node.append(child));
    return node;
  }

  function buildWidget() {
    if (document.querySelector('.bean-chat-launcher')) return;
    const launcher = el('button', { class: 'bean-chat-launcher', type: 'button', 'aria-label': 'Open customer service quote helper' }, [
      el('span', { class: 'bean-chat-launcher-icon' }, [
        el('img', { src: 'assets/logos/mix-art-design-logo.png?v=chat-logo-1', alt: '' })
      ]),
      el('span', { text: 'Customer Service' })
    ]);

    const panel = el('section', { class: 'bean-chat-panel', 'aria-label': 'Customer service quote helper' });
    panel.innerHTML = `
      <div class="bean-chat-head">
        <div class="bean-chat-title">
          <div class="bean-chat-avatar" aria-hidden="true"><img src="assets/logos/mix-art-design-logo.png?v=chat-logo-1" alt=""></div>
          <div><strong>Customer Service</strong><small>Quote helper for Mix Art Design</small></div>
        </div>
        <button class="bean-chat-close" type="button" aria-label="Close customer service">×</button>
      </div>
      <div class="bean-chat-log" aria-live="polite"></div>
      <div class="bean-chat-quick"></div>
      <div class="bean-chat-actions">
        <button class="bean-action primary" type="button" data-action="fill">Fill quote form</button>
        <button class="bean-action secondary" type="button" data-action="restart">Start over</button>
      </div>
      <form class="bean-chat-form">
        <input class="bean-chat-input" autocomplete="off" placeholder="Type here...">
        <button class="bean-chat-send" type="submit">Send</button>
      </form>`;

    document.body.append(panel, launcher);

    launcher.addEventListener('click', () => togglePanel(true));
    panel.querySelector('.bean-chat-close').addEventListener('click', () => togglePanel(false));
    panel.querySelector('.bean-chat-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const input = panel.querySelector('.bean-chat-input');
      const value = input.value.trim();
      if (!value) return;
      input.value = '';
      handleAnswer(value);
    });
    panel.querySelector('[data-action="fill"]').addEventListener('click', fillOrGoToForm);
    panel.querySelector('[data-action="restart"]').addEventListener('click', restart);

    if (isOrderPage) {
      prefillForm();
      if (new URLSearchParams(location.search).get('bean') === '1') setTimeout(() => togglePanel(true), 400);
    }
  }

  function togglePanel(force) {
    open = typeof force === 'boolean' ? force : !open;
    const panel = document.querySelector('.bean-chat-panel');
    panel.classList.toggle('is-open', open);
    if (open && !panel.dataset.started) startConversation();
  }

  function startConversation() {
    const panel = document.querySelector('.bean-chat-panel');
    panel.dataset.started = 'true';
    if (Object.keys(answers).length) {
      bot('Welcome back. I still have your quote notes saved. You can keep going or fill the form.');
      step = nextMissingStep();
    } else {
      bot('Hi, I’m customer service for Mix Art Design. I can help collect your idea so Patrick can reply with a proper quote. No payment happens here.');
      step = 0;
    }
    askCurrent();
  }

  function nextMissingStep() {
    const idx = questions.findIndex(q => !answers[q.key]);
    return idx === -1 ? questions.length : idx;
  }

  function bot(text) { addMessage(text, 'bot'); }
  function user(text) { addMessage(text, 'user'); }
  function addMessage(text, who) {
    const log = document.querySelector('.bean-chat-log');
    const msg = el('div', { class: `bean-msg ${who}`, text });
    log.append(msg);
    log.scrollTop = log.scrollHeight;
  }

  function askCurrent() {
    const actions = document.querySelector('.bean-chat-actions');
    const quick = document.querySelector('.bean-chat-quick');
    quick.innerHTML = '';
    actions.classList.remove('is-visible');

    if (step >= questions.length) {
      bot('Got it. I can put this into the quote form now so you can review and send it.');
      actions.classList.add('is-visible');
      return;
    }
    const q = questions[step];
    bot(q.prompt);
    if (q.chips) {
      q.chips.forEach(chip => {
        const b = el('button', { class: 'bean-chip', type: 'button', text: chip });
        b.addEventListener('click', () => handleAnswer(chip));
        quick.append(b);
      });
    }
  }

  function handleAnswer(value) {
    const q = questions[step];
    if (!q) return;
    user(value);
    answers[q.key] = value;
    saveAnswers();
    step += 1;
    askCurrent();
  }

  function restart() {
    answers = {};
    step = 0;
    saveAnswers();
    const log = document.querySelector('.bean-chat-log');
    log.innerHTML = '';
    bot('No problem. Let’s start fresh.');
    askCurrent();
  }

  function fillOrGoToForm() {
    saveAnswers();
    if (!isOrderPage) {
      window.location.href = 'order.html?bean=1';
      return;
    }
    prefillForm();
    const form = document.getElementById('orderForm');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    bot('I filled what I can. Please review it, add anything missing, then press “Send quote request”.');
  }

  function setField(id, value) {
    const field = document.getElementById(id);
    if (field && value) {
      field.value = value;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function prefillForm() {
    if (!document.getElementById('orderForm')) return;
    answers = loadAnswers();
    setField('name', answers.name);
    setField('email', answers.email);
    setField('business', answers.business);
    setField('type', answers.type);
    setField('colors', answers.colors);
    setField('style', answers.style);
    setField('details', answers.details);
    setField('usage', answers.usage);

    if (answers.package) {
      const pkg = Array.from(document.querySelectorAll('input[name="package"]'))
        .find(input => input.value === answers.package || answers.package.includes(input.value.split(' - ')[0]));
      if (pkg) pkg.checked = true;
    }
  }

  document.addEventListener('DOMContentLoaded', buildWidget);
})();
