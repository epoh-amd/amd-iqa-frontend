import React, { useState, useRef, useEffect } from 'react';
import nlp from 'compromise';
import './Chatbot.css';

const GUIDES = [
  {
    label: 'Dashboard',
    keys: ['dashboard', 'chart', 'build delivery', 'quality dashboard'],
    description: 'Monitor real-time build delivery chart and quality dashboard.',
    link: 'https://amdcloud.sharepoint.com/:p:/s/ServerPlatEngOps-PG_SPEO/ES9jsG27wFxGvcmqzAum_LoBEJezaO2QkrQW_U7Ulx77jA?e=0oTCdw',
    linkLabel: 'View Dashboard Guide'
  },
  {
    label: 'Start Build',
    keys: ['start build', 'new build', 'start a build', 'begin build'],
    description: 'Smart Hand Technician to start a new build entry.',
    link: 'https://amdcloud.sharepoint.com/:p:/s/ServerPlatEngOps-PG_SPEO/EYYhZyl_onJJkdOT6qvcIUgBHPfy-Im142noMoi5xzU5vg?e=28epwP',
    linkLabel: 'View Start Build Guide'
  },
  {
    label: 'Continue Build',
    keys: ['continue build', 'resume build', 'unfinished build'],
    description: 'Smart Hand Technician to resume an unfinished build entry.',
    link: 'https://amdcloud.sharepoint.com/:p:/s/ServerPlatEngOps-PG_SPEO/ESxLlFi43pVDqRzRQ1ydl5kBT1lXjledY9ZncVhu9_4Y2A?e=rgyywG',
    linkLabel: 'View Continue Build Guide'
  },
  {
    label: 'Edit Build',
    keys: ['edit build', 'modify build', 'update build', 'change build'],
    description: 'Edit the build details.',
    link: 'https://amdcloud.sharepoint.com/:p:/s/ServerPlatEngOps-PG_SPEO/EQxxWjpmGU1ImTagHNLuc6oBgd6cGvmHu7QMQzYx5jLAsg?e=RLyaxe',
    linkLabel: 'View Edit Build Guide'
  },
  {
    label: 'Build Allocation',
    keys: ['allocation', 'allocate', 'build allocation', 'delivery'],
    description: 'Allocate builds for delivery.',
    link: 'https://amdcloud.sharepoint.com/:p:/s/ServerPlatEngOps-PG_SPEO/EXXM_is9hUFMt8hijDmKUKsBMh71pwnzgrT6sqDtc28qcw?e=SEKpcl',
    linkLabel: 'View Build Allocation Guide'
  },
  {
    label: 'Search Records',
    keys: ['search', 'search records', 'find build', 'historical', 'history'],
    description: 'Find and review the Smart Hand historical build data.',
    link: 'https://amdcloud.sharepoint.com/:p:/s/ServerPlatEngOps-PG_SPEO/Eb1T5NHz1rdPloWMnLgRGMYBOH4zGjjCPxj_7JHnYCp5ew?e=hX60JS',
    linkLabel: 'View Search Records Guide'
  },
  {
    label: 'CLF',
    keys: ['clf', 'customer line fallout', 'escalation', 'customer escalation'],
    description: 'Customer Line Fallout tracking and management.',
    link: 'https://amdcloud.sharepoint.com/:p:/s/ServerPlatEngOps-PG_SPEO/EfqFDzhnaJdAjqYnUPFHlQ0Boj14KIBZGQtrGuPYhW-g8Q?e=YC71qg',
    linkLabel: 'View CLF Guide'
  },
  {
    label: 'User Role',
    keys: ['user role', 'role', 'permission', 'cat1', 'cat2', 'cat3', 'cat4'],
    description: 'Explore user roles and their permissions.',
    link: 'https://amdcloud.sharepoint.com/:p:/s/ServerPlatEngOps-PG_SPEO/EWteCI6cuKhCvT8iITSbS3gBohDC8xo-06PxHvf9fr01uQ?e=x7Hku5',
    linkLabel: 'View User Role Guide'
  },
  {
    label: 'Waiver System',
    keys: ['waiver', 'waiver system', 'waiver form', 'waiver request', 'waiver management', 'approve waiver', 'submit waiver'],
    description: 'Submit waiver requests, route for approval, and track status.',
    link: 'https://amdcloud.sharepoint.com/:p:/r/sites/ServerPlatEngOps-PG_SPEO/Shared%20Documents/SPEO-SCM/SQA/QnR/Automated%20IQA%20Dashboard/User%20Guides/Waiver%20System%20User%20Guide.pptx?d=wd2f172d4ebb44788ae3bc39e5779bcce&csf=1&web=1&e=H9kobw',
    linkLabel: 'View Waiver System Guide'
  },
  {
    label: 'FAQ',
    keys: ['faq', 'frequently asked', 'question', 'help'],
    description: 'Frequently asked questions about the system.',
    link: 'https://amdcloud.sharepoint.com/:p:/s/ServerPlatEngOps-PG_SPEO/EY6OvjBPNz9Fiu6YllwbCv8BKjsWM-PribTHgp9vDfXSnw?e=v2XaUh',
    linkLabel: 'View FAQ'
  },
  {
    label: 'User Incident Ticketing',
    keys: ['incident', 'ticket', 'ticketing', 'issue', 'report issue', 'submit issue'],
    description: 'Submit issues for tracking and resolution by the relevant team.',
    link: 'https://amdcloud-my.sharepoint.com/:x:/g/personal/epoh_amd_com/IQASuk27jSW3Qbx3ZxAMg2w7AeQdt-3jzPFx8v-3DTu3ONo',
    linkLabel: 'Open Incident Ticketing System'
  },
];

const GREETING = {
  role: 'bot',
  text: 'Hi! How can I help you? Choose a topic below or type your question.',
  showButtons: true
};

// ── Replace this URL with your Power Automate HTTP trigger URL ──
const POWER_AUTOMATE_URL = '';

const SUPPORT_KEYWORDS = [
  'not found', 'error', 'deny', 'issue', 'problem', 'bug', 'broken', 'wrong',
  'fail', 'failed', 'failure', 'crash', 'cannot', "can't", 'unable',
  'missing', 'lost', 'incorrect', 'invalid', 'stuck', 'help me',
  'not working', 'doesnt work', "doesn't work", 'something wrong',
  'page not loading', 'not loading', 'blank', 'slow', 'down',
  'login issue', 'cannot login', 'cannot log in', 'access denied',
  'permission denied', 'unauthorised', 'unauthorized',
  'add user', 'new user', 'create user', 'register user',
  'how to add user', 'add account', 'new account', 'not work',
  'apply access', 'request access', 'get access', 'apply user',
  'user access', 'how to apply user', 'how to get access',
  'cant load', "can't load", 'cannot load', 'not load', 'wont load',
  'screen cant', 'page cant', 'screen not', 'page not', 'not display',
  'not showing', 'not show', 'white screen', 'black screen'
];

const isNegative = (input) => {
  // Normalise curly apostrophes
  const normalised = input.replace(/[‘’‚‛]/g, "’");
  const doc = nlp(normalised);

  // 1. Compromise negation detection
  const hasNegation = doc.sentences().json().some(s =>
    s.terms && s.terms.some(t => t.tags && (t.tags.includes("Negative") || t.tags.includes("Auxiliary")))
  );

  // 2. Explicit negative phrases (compromise may miss some)
  const lower = normalised.toLowerCase();
  const negationPhrases = [
    "can’t", "cannot", "cant", "couldn’t",
    "won’t", "wont", "wouldn’t",
    "don’t", "dont", "doesn’t", "doesnt",
    "isn’t", "isnt", "aren’t", "arent",
    "unable", "not able", "no access",
    "not working", "not loading", "not found",
    "not showing", "not display", "failed",
  ];
  const hasNegationPhrase = negationPhrases.some(p => lower.includes(p));

  return hasNegation || hasNegationPhrase;
};

const isErrorQuery = (input) => {
  const lower = input.toLowerCase().replace(/[‘’‚‛]/g, "’");
  // Check explicit support keywords
  if (SUPPORT_KEYWORDS.some(k => lower.includes(k))) return true;
  // Check NLP negation
  if (isNegative(input)) return true;
  return false;
};

// Synonyms/variations mapped to normalised terms compromise may miss
const SYNONYM_MAP = {
  'use': 'how',
  'using': 'how',
  'utilise': 'how',
  'utilize': 'how',
  'access': 'view',
  'open': 'view',
  'navigate': 'view',
  'go to': 'view',
  'get to': 'view',
  'where': 'find',
  'locate': 'find',
  'create': 'start',
  'make': 'start',
  'new': 'start',
  'update': 'edit',
  'modify': 'edit',
  'change': 'edit',
  'fix': 'edit',
  'resume': 'continue',
  'finish': 'continue',
  'incomplete': 'continue',
  'pending': 'continue',
  'role': 'permission',
  'roles': 'permission',
  'rights': 'permission',
  'cat1': 'permission',
  'cat2': 'permission',
  'cat3': 'permission',
  'cat4': 'permission',
  'admin': 'permission',
  'question': 'faq',
  'questions': 'faq',
  'issue': 'incident',
  'problem': 'incident',
  'bug': 'incident',
  'report': 'incident',
  'track': 'status',
  'tracking': 'status',
  'approve': 'approval',
  'approving': 'approval',
  'reject': 'approval',
  'submit': 'waiver',
  'submitting': 'waiver',
  'raise': 'waiver',
  'request': 'waiver',
  'chart': 'dashboard',
  'graph': 'dashboard',
  'monitor': 'dashboard',
  'overview': 'dashboard',
  'statistics': 'dashboard',
  'stats': 'dashboard',
  'history': 'search',
  'historical': 'search',
  'records': 'search',
  'find': 'search',
  'lookup': 'search',
  'delivery': 'allocation',
  'allocate': 'allocation',
  'assign': 'allocation',
};

// Levenshtein for minor typos
const levenshtein = (a, b) => {
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[a.length][b.length];
};

// Character overlap — handles scrambled/heavy typos like "dshbiardd" → "dashboard"
const charOverlap = (word, target) => {
  if (word.length < 4 || target.length < 4) return false;
  const wordChars = new Set(word.split(''));
  const matches = target.split('').filter(c => wordChars.has(c)).length;
  return matches / target.length >= 0.75;
};

const fuzzyMatch = (word, target) => {
  if (word.length < 3) return false;
  if (target.length <= 5) return levenshtein(word, target) <= 1;
  if (target.length <= 8) return levenshtein(word, target) <= 2 || charOverlap(word, target);
  return levenshtein(word, target) <= 3 || charOverlap(word, target);
};

const normalise = (text) => {
  let lower = text.toLowerCase();
  // Replace synonyms
  Object.entries(SYNONYM_MAP).forEach(([from, to]) => {
    lower = lower.replace(new RegExp(`\\b${from}\\b`, 'g'), to);
  });
  // Use compromise to extract root terms (nouns + verbs)
  const doc = nlp(lower);
  const terms = doc.terms().out('array').map(t => t.toLowerCase());
  return { lower, terms };
};

// Lower threshold version — used to suggest "did you mean?"
const findGuideLoose = (input) => {
  const { lower, terms } = normalise(input);
  const inputWords = lower.split(/\s+/).filter(Boolean);

  let bestGuide = null;
  let bestScore = 0;

  GUIDES.forEach(guide => {
    let score = 0;
    guide.keys.forEach(key => {
      const keyLower = key.toLowerCase();
      const keyWords = keyLower.split(' ');
      if (lower.includes(keyLower)) { score += 10; return; }
      keyWords.forEach(kw => {
        if (kw.length < 3) return;
        if (inputWords.some(iw => iw === kw || terms.includes(kw))) score += 4;
        else if (inputWords.some(iw => fuzzyMatch(iw, kw))) score += 3;
      });
    });
    if (score > bestScore) { bestScore = score; bestGuide = guide; }
  });

  return bestScore >= 3 ? bestGuide : null;
};

const findGuide = (input) => {
  const { lower, terms } = normalise(input);
  const inputWords = lower.split(/\s+/).filter(Boolean);

  let bestGuide = null;
  let bestScore = 0;

  GUIDES.forEach(guide => {
    let score = 0;
    guide.keys.forEach(key => {
      const keyLower = key.toLowerCase();
      const keyWords = keyLower.split(' ');

      // Exact phrase match — highest weight
      if (lower.includes(keyLower)) {
        score += 10;
        return;
      }

      // Word-by-word: exact or fuzzy match each key word against input words
      let keyScore = 0;
      keyWords.forEach(kw => {
        if (kw.length < 3) return;
        const exactHit = inputWords.some(iw => iw === kw || terms.includes(kw));
        if (exactHit) {
          keyScore += 4;
        } else {
          const fuzzyHit = inputWords.some(iw => fuzzyMatch(iw, kw));
          if (fuzzyHit) keyScore += 3;
        }
      });

      // Only count if ALL key words matched (exact or fuzzy) — prevents false positives
      if (keyScore >= keyWords.filter(w => w.length >= 3).length * 3) {
        score += keyScore;
      }
    });

    if (score > bestScore) {
      bestScore = score;
      bestGuide = guide;
    }
  });

  // Raised threshold to avoid weak false positives
  return bestScore >= 6 ? bestGuide : null;
};

// Call Power Automate for slide-level answer
const askPowerAutomate = async (question) => {
  if (!POWER_AUTOMATE_URL) return null;
  try {
    const res = await fetch(POWER_AUTOMATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
    const data = await res.json();
    if (data.found && data.slide) return data;
    return null;
  } catch {
    return null;
  }
};

const renderText = (text) => {
  // Bold **text**
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((p, i) => i % 2 === 1 ? <strong key={i}>{p}</strong> : p);
};

const BotMessage = ({ msg, onYes, onNo }) => (
  <div className="cb-msg cb-msg-bot">
    <div className={`cb-bubble cb-bubble-bot ${msg.typing ? 'cb-typing' : ''}`}>
      {msg.typing
        ? <span className="cb-dots"><span/><span/><span/></span>
        : <span>{renderText(msg.text)}</span>
      }
      {!msg.typing && msg.link && (
        <a href={msg.link} target="_blank" rel="noopener noreferrer" className="cb-guide-link">
          {msg.linkLabel}
        </a>
      )}
      {msg.suggestion && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button className="cb-qr-btn" onClick={onYes}>Yes</button>
          <button className="cb-qr-btn" onClick={onNo}>No</button>
        </div>
      )}
    </div>
  </div>
);

const UserMessage = ({ msg }) => (
  <div className="cb-msg cb-msg-user">
    <div className="cb-bubble cb-bubble-user">{msg.text}</div>
  </div>
);

const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [pendingSuggestion, setPendingSuggestion] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const handleQuickReply = (guide) => {
    const userMsg = { role: 'user', text: guide.label };
    const botMsg = {
      role: 'bot',
      text: guide.description,
      link: guide.link,
      linkLabel: guide.linkLabel
    };
    setMessages(prev => [...prev, userMsg, botMsg]);
  };

  const confirmSuggestion = (guide) => {
    setPendingSuggestion(null);
    const botMsg = { role: 'bot', text: guide.description, link: guide.link, linkLabel: guide.linkLabel };
    setMessages(prev => [...prev, botMsg]);
  };

  const rejectSuggestion = () => {
    setPendingSuggestion(null);
    setMessages(prev => [...prev, { role: 'bot', text: "No problem! Try rephrasing your question or pick a topic from the buttons above." }]);
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg = { role: 'user', text: trimmed };
    setMessages(prev => [...prev, userMsg, { role: 'bot', text: '...', typing: true }]);
    setInput('');
    setPendingSuggestion(null);

    // 0. Error/issue keywords — always route to support
    if (isErrorQuery(trimmed)) {
      setMessages(prev => [...prev.filter(m => !m.typing), {
        role: 'bot',
        text: 'It sounds like you\'re experiencing an issue. Please reach out to iqadashboard.support@amd.com for assistance.'
      }]);
      return;
    }

    // 1. Try Power Automate (slide-level answer)
    const paResult = await askPowerAutomate(trimmed);
    if (paResult) {
      const botMsg = {
        role: 'bot',
        text: `Please refer to slide ${paResult.slide} — ${paResult.description}`,
        link: paResult.guideUrl,
        linkLabel: 'Open Guide'
      };
      setMessages(prev => [...prev.filter(m => !m.typing), botMsg]);
      return;
    }

    // 2. Strict match
    const guide = findGuide(trimmed);
    if (guide) {
      setMessages(prev => [...prev.filter(m => !m.typing), { role: 'bot', text: guide.description, link: guide.link, linkLabel: guide.linkLabel }]);
      return;
    }

    // 3. Loose match — "Did you mean?"
    const suggestion = findGuideLoose(trimmed);
    if (suggestion) {
      setPendingSuggestion(suggestion);
      setMessages(prev => [...prev.filter(m => !m.typing), {
        role: 'bot',
        text: `Did you mean **${suggestion.label}**?`,
        suggestion: true
      }]);
      return;
    }

    // 4. No match
    setMessages(prev => [...prev.filter(m => !m.typing), { role: 'bot', text: "I don't understand. Try rephrasing your question or pick a topic from the buttons above." }]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  const handleOpen = () => {
    setOpen(true);
    setMessages([GREETING]);
    setPendingSuggestion(null);
  };

  return (
    <div className="cb-wrapper">
      {open && (
        <div className="cb-window">
          <div className="cb-header">
            <span>PDQD Assistant</span>
            <button className="cb-close" onClick={() => setOpen(false)}>×</button>
          </div>

          <div className="cb-body">
            {messages.map((msg, i) => (
              <div key={i}>
                {msg.role === 'bot'
                  ? <BotMessage msg={msg} onYes={() => confirmSuggestion(pendingSuggestion)} onNo={rejectSuggestion} />
                  : <UserMessage msg={msg} />}
                {msg.showButtons && (
                  <div className="cb-quick-replies">
                    {GUIDES.filter(g => !['CLF', 'FAQ', 'User Role'].includes(g.label)).map(g => (
                      <button key={g.label} className="cb-qr-btn" onClick={() => handleQuickReply(g)}>
                        {g.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="cb-footer">
            <input
              className="cb-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question..."
            />
            <button className="cb-send" onClick={handleSend}>Send</button>
          </div>
        </div>
      )}

      {!open && (
        <button className="cb-toggle" onClick={handleOpen} title="Chat with Assistant">
          💬
        </button>
      )}
    </div>
  );
};

export default Chatbot;
