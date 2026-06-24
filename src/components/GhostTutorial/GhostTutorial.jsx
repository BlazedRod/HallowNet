import React, { useState, useEffect } from 'react';
import './GhostTutorial.css';

let audioCtx = null;

const playBlip = (char) => {
  if (char === ' ' || char === '.' || char === ',') return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'triangle';
    const charCode = char.toLowerCase().charCodeAt(0);
    const baseFreq = 600 + (charCode % 26) * 15; 
    osc.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.05);
  } catch (e) {}
};

const TypewriterText = ({ text, onTalkStatusChange }) => {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    if (onTalkStatusChange) onTalkStatusChange(true);
    let i = 0;
    const interval = setInterval(() => {
      const nextChar = text[i];
      setDisplayed(text.slice(0, i + 1));
      
      // Play a voice blip for every 3rd character to keep it buzzy but prevent AudioContext thread nuking
      if (nextChar && i % 3 === 0) {
        playBlip(nextChar);
      }
      
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        if (onTalkStatusChange) onTalkStatusChange(false);
      }
    }, 30);
    return () => {
      clearInterval(interval);
      if (onTalkStatusChange) onTalkStatusChange(false);
    };
  }, [text, onTalkStatusChange]);
  return <span>{displayed}</span>;
};

const NativePoltergeistDemo = () => {
  const [pos, setPos] = useState({ x: window.innerWidth - 300, y: 150, opacity: 0 });
  const [ripples, setRipples] = useState([]);

  useEffect(() => {
    let timers = [];
    const runCycle = () => {
      setRipples([]);
      // Start near the play button on the right
      timers.push(setTimeout(() => setPos({ x: window.innerWidth - 300, y: 150, opacity: 1 }), 100));
      
      // Move in an arc to the far left middle
      timers.push(setTimeout(() => setPos({ x: 200, y: window.innerHeight / 2 - 100, opacity: 1 }), 800));
      // Click
      timers.push(setTimeout(() => setRipples(r => [...r, { id: Date.now(), x: 200, y: window.innerHeight / 2 - 100 }]), 1800));
      
      // Move in an arc down to bottom left
      timers.push(setTimeout(() => setPos({ x: 300, y: window.innerHeight - 200, opacity: 1 }), 2300));
      // Click
      timers.push(setTimeout(() => setRipples(r => [...r, { id: Date.now(), x: 300, y: window.innerHeight - 200 }]), 3300));
      
      // Fade out
      timers.push(setTimeout(() => setPos(p => ({ ...p, opacity: 0 })), 4000));
    };

    runCycle();
    const interval = setInterval(runCycle, 4800);
    return () => {
      timers.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      <div 
        style={{
          position: 'fixed',
          width: '32px', height: '32px',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2300ff66'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12v9l3-3 2 2 2-2 2 2 2-2 2 2 3 3v-9c0-5.52-4.48-10-10-10zm-2 9c-.83 0-1.5-.67-1.5-1.5S9.17 8 10 8s1.5.67 1.5 1.5S10.83 11 10 11zm4 0c-.83 0-1.5-.67-1.5-1.5S13.17 8 14 8s1.5.67 1.5 1.5S14.83 11 14 11z'/%3E%3C/svg%3E")`,
          pointerEvents: 'none', zIndex: 9999999, // Put it back on top just in case
          transition: 'left 1s ease-in-out, top 1s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s',
          transform: 'translate(-50%, -50%)',
          filter: 'drop-shadow(0 0 8px rgba(0,255,102,0.8))',
          top: pos.y, left: pos.x, opacity: pos.opacity
        }}
      />
      {ripples.map(r => (
        <div key={r.id} className="poltergeist-ripple" style={{ left: r.x, top: r.y, zIndex: 4 }} />
      ))}
    </>
  );
};

const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    target: null,
    placement: 'center',
    action: 'close-menus',
    title: 'Welcome to HallowNet',
    text: 'I am your phantom guide. I will show you how to navigate the darkness and harness the true power of this browser.',
    btnText: 'Begin'
  },
  {
    id: 'gargoyle-icon',
    target: '.gargoyle-btn',
    action: 'close-menus',
    title: 'Gargoyle Protection',
    text: 'The Gargoyle stands guard. It annihilates ads, trackers, and rogue pop-ups before they reach you.',
    btnText: 'View Stats'
  },
  {
    id: 'gargoyle-page',
    target: null,
    placement: 'bottom-right',
    action: 'navigate-gargoyle',
    title: 'The Gargoyle Logs',
    text: 'Here you can view exactly what the Gargoyle has blocked across all your sessions. It keeps a vigilant watch over your network traffic.',
    btnText: 'Next'
  },
  {
    id: 'poltergeist',
    target: '.poltergeist-btn',
    action: 'close-menus',
    title: 'Poltergeist Automation',
    text: 'This is the Poltergeist. It allows you to record macros to automate repetitive tasks, or set an auto-refresh and scroll to keep a tab alive in the background.',
    btnText: 'Show Me'
  },
  {
    id: 'poltergeist-record',
    target: '.poltergeist-menu .record-btn',
    action: 'open-poltergeist',
    title: 'Recording a Haunt',
    text: 'First, you click Record. The engine will silently capture every mouse movement and click you perform on the page.',
    btnText: 'Next'
  },
  {
    id: 'poltergeist-play',
    target: '.poltergeist-menu .play-btn',
    action: 'open-poltergeist',
    title: 'The Play Button',
    text: 'Next, you click Play to execute the recorded macro.',
    btnText: 'Show Demo'
  },
  {
    id: 'poltergeist-demo',
    target: '.poltergeist-menu .stop-play-btn',
    action: 'simulate-poltergeist',
    title: 'Playing the Macro',
    text: 'Watch closely! The Poltergeist will automatically execute your macro using its spooky spirit!',
    btnText: 'Next'
  },
  {
    id: 'poltergeist-loop',
    target: '.poltergeist-menu .loop-toggle',
    action: 'open-poltergeist',
    title: 'Infinite Looping',
    text: 'You can also toggle the Loop switch. The Poltergeist will repeat the recorded Haunt infinitely until you stop it.',
    btnText: 'Next'
  },
  {
    id: 'banshee',
    target: '.banshee-btn',
    action: 'close-menus',
    title: 'Banshee Audio Engine',
    text: 'This is the Banshee. It gives you absolute control over your browser audio output.',
    btnText: 'Show Me'
  },
  {
    id: 'banshee-overdrive',
    target: '.banshee-slider',
    action: 'open-banshee',
    title: 'Audio Overdrive',
    text: 'Awaken this engine to overdrive your audio. You can force volume up to 300% beyond standard browser limits.',
    btnText: 'Next'
  },
  {
    id: 'ghost-mode',
    target: '.ghost-mode-btn',
    action: 'close-menus',
    title: 'Ghost Mode',
    text: 'Click here to vanish. Ghost Mode blocks WebRTC leaks, spoofs canvas fingerprints, and prevents any traces of your presence.',
    btnText: 'Next'
  },
  {
    id: 'sidebar-btn',
    target: '.sidebar-toggle-btn',
    action: 'close-menus',
    title: 'The Sidebar Button',
    text: "Click here to summon the Sidebar. Let's open it and take a look.",
    btnText: 'Next'
  },
  {
    id: 'sidebar-view',
    target: '.sidebar',
    action: 'open-sidebar',
    title: 'The Sidebar',
    text: 'Inside the Sidebar, you can quickly access your Bookmarks, Recent History, Active Theme, and view the Weather.',
    btnText: 'Next'
  },
  {
    id: 'settings-icon',
    target: '.settings-btn',
    action: 'close-menus',
    title: 'The Settings Menu',
    text: 'Click here to open the global Settings page, where you can deeply customize your browser experience.',
    btnText: 'Show Me'
  },
  {
    id: 'settings-general',
    target: '.settings-nav-btn:nth-child(1)',
    placement: 'settings-sidebar-bottom',
    action: 'navigate-settings',
    title: 'Settings: General',
    text: 'Finally, this is the Settings page. On the General tab, you can configure your default search engines and toggle core behaviors.',
    btnText: 'Next'
  },
  {
    id: 'settings-themes',
    target: '.settings-nav-btn:nth-child(2)',
    placement: 'settings-sidebar-bottom',
    action: 'settings-tab-themes',
    title: 'Settings: Themes',
    text: 'The Themes tab lets you change the visual atmosphere of the browser.',
    btnText: 'Next'
  },
  {
    id: 'settings-theme-lab-btn',
    target: '.theme-lab-btn',
    placement: 'settings-sidebar-bottom',
    action: 'settings-tab-themes',
    title: 'The Theme Lab',
    text: "Let's take a peek into the Theme Lab.",
    btnText: 'Show Me'
  },
  {
    id: 'theme-creator-page',
    target: null,
    placement: 'bottom-right',
    action: 'navigate-theme-lab',
    title: 'Designing Themes',
    text: 'Here you can design your own custom color palettes with a live preview. When you are done, save it and it will apply instantly!',
    btnText: 'Next'
  },
  {
    id: 'settings-toolbar',
    target: '.settings-nav-btn:nth-child(3)',
    placement: 'settings-sidebar-bottom',
    action: 'navigate-settings-toolbar',
    title: 'Settings: Toolbar',
    text: 'The Toolbar tab allows you to toggle which icons are visible, keeping your interface clean.',
    btnText: 'Next'
  },
  {
    id: 'settings-hotkeys',
    target: '.settings-nav-btn:nth-child(4)',
    placement: 'settings-sidebar-bottom',
    action: 'settings-tab-hotkeys',
    title: 'Settings: Hotkeys',
    text: 'The Hotkeys tab lets you configure your Panic Button. By default, it is F12. Pressing it summons the Trapdoor.',
    btnText: 'Next'
  },
  {
    id: 'settings-crypt',
    target: '.settings-nav-btn:nth-child(5)',
    placement: 'settings-sidebar-bottom',
    action: 'settings-tab-crypt',
    title: 'Settings: The Crypt',
    text: 'And this is The Crypt—your secure, encrypted Password Vault where all your credentials are safely stored.',
    btnText: 'Next'
  },
  {
    id: 'farewell',
    target: null,
    placement: 'center',
    action: 'navigate-dashboard',
    title: 'Your Journey Begins',
    text: 'You are now ready to harness the true power of HallowNet. Have fun browsing the darkness...',
    btnText: 'Finish'
  }
];

export default function GhostTutorial() {
  const [isVisible, setIsVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [exitPhase, setExitPhase] = useState(null);
  const [pos, setPos] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2, centered: true });
  const [spotlightRects, setSpotlightRects] = useState([]);
  const [isNarrow, setIsNarrow] = useState(false);
  const [currentGhostWidth, setCurrentGhostWidth] = useState(340);
  const [isTalking, setIsTalking] = useState(false);

  useEffect(() => {
    const hasCompleted = localStorage.getItem('hwn_tutorial_completed');
    if (!hasCompleted) {
      setTimeout(() => setIsVisible(true), 1500);
    }
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const step = TUTORIAL_STEPS[stepIndex];
    
    window.dispatchEvent(new CustomEvent('tutorial-action', { detail: { action: step.action } }));

    const updatePosition = () => {
      if (!step.target) {
        if (step.placement === 'bottom-left') {
          setPos(prev => prev.x === 220 && prev.y === window.innerHeight - 380 ? prev : { x: 220, y: window.innerHeight - 380, centered: false });
        } else if (step.placement === 'bottom-right') {
          setPos(prev => prev.x === window.innerWidth - 200 && prev.y === window.innerHeight - 400 ? prev : { x: window.innerWidth - 200, y: window.innerHeight - 400, centered: true });
        } else {
          setPos(prev => prev.x === window.innerWidth / 2 && prev.y === window.innerHeight / 2 ? prev : { x: window.innerWidth / 2, y: window.innerHeight / 2, centered: true });
        }
        setSpotlightRects(prev => prev.length === 0 ? prev : []);
        return;
      }

      let targetEl;
      if (step.id === 'settings-general') {
        targetEl = document.querySelectorAll('.settings-nav-btn')[0];
      } else if (step.id === 'settings-themes') {
        targetEl = document.querySelectorAll('.settings-nav-btn')[1];
      } else if (step.id === 'settings-toolbar') {
        targetEl = document.querySelectorAll('.settings-nav-btn')[2];
      } else if (step.id === 'settings-hotkeys') {
        targetEl = document.querySelectorAll('.settings-nav-btn')[3];
      } else if (step.id === 'settings-crypt') {
        targetEl = document.querySelectorAll('.settings-nav-btn')[4];
      } else {
        targetEl = document.querySelector(step.target);
      }

      if (!targetEl) {
        return;
      }

      const rectObj = targetEl.getBoundingClientRect();
      const rects = [];
      const createSpotlight = (r) => ({
        top: r.top - 8,
        left: r.left - 8,
        width: r.width + 16,
        height: r.height + 16
      });

      rects.push(createSpotlight(rectObj));
      
      let menuEl = null;
      if (step.target.includes('poltergeist')) menuEl = document.querySelector('.poltergeist-menu');
      else if (step.target.includes('banshee')) menuEl = document.querySelector('.banshee-menu');
      else if (step.target.includes('gargoyle')) menuEl = document.querySelector('.gargoyle-menu');

      if (menuEl && menuEl !== targetEl) {
         rects.push(createSpotlight(menuEl.getBoundingClientRect()));
      }

      setSpotlightRects(prev => JSON.stringify(prev) === JSON.stringify(rects) ? prev : rects);

      let activeGhostWidth = 340;
      let activeNarrow = false;
      const ghostEl = document.querySelector('.ghost-character-wrapper');
      const actualGhostHeight = ghostEl ? ghostEl.getBoundingClientRect().height : 380;
      const ghostHeight = actualGhostHeight;
      let ghostX = rectObj.left + rectObj.width / 2;
      const maxBottom = Math.max(...rects.map(r => r.top + r.height));
      let ghostY = maxBottom + 15;

      if (step.placement === 'bottom-right' || step.placement === 'settings-sidebar-bottom' || step.placement === 'settings-sidebar-left' || step.placement === 'right') {
        // Universal safe-zone placement for the Settings sequence or any bottom-right preference
        ghostX = window.innerWidth - 200;
        ghostY = window.innerHeight - ghostHeight - 20;
        
        // Ensure it doesn't go off the right edge on tiny screens
        if (ghostX + (activeGhostWidth / 2) > window.innerWidth - 10) {
           ghostX = window.innerWidth - (activeGhostWidth / 2) - 10;
        }
      } else if (step.target === '.sidebar') {
        ghostX = rectObj.left - (activeGhostWidth / 2) - 30;
        ghostY = window.innerHeight / 2;
      } else {
        if (ghostX + activeGhostWidth / 2 > window.innerWidth - 10) ghostX = window.innerWidth - activeGhostWidth / 2 - 10;
        else if (ghostX - activeGhostWidth / 2 < 10) ghostX = activeGhostWidth / 2 + 10;
        
        if (ghostY + ghostHeight > window.innerHeight - 10) {
          const minTop = Math.min(...rects.map(r => r.top));
          if (minTop - ghostHeight - 15 > 10) {
            // Pop above
            ghostY = minTop - ghostHeight - 15;
          } else {
            // No room above or below. Shift it to the left side of the menu!
            const minLeft = Math.min(...rects.map(r => r.left));
            ghostX = minLeft - (activeGhostWidth / 2) - 15;
            ghostY = minTop + ((maxBottom - minTop) / 2) - (ghostHeight / 2);
            
            if (ghostY < 10) ghostY = 10;
            if (ghostY + ghostHeight > window.innerHeight - 10) ghostY = window.innerHeight - ghostHeight - 10;
            if (ghostX - activeGhostWidth / 2 < 10) ghostX = activeGhostWidth / 2 + 10;
          }
        }
      }
      
      setCurrentGhostWidth(activeGhostWidth);
      setIsNarrow(activeNarrow);
      setPos(prev => prev.x === ghostX && prev.y === ghostY && !prev.centered ? prev : { x: ghostX, y: ghostY, centered: false });
    };

    const intervalId = setInterval(updatePosition, 250);
    window.addEventListener('resize', updatePosition);
    return () => { clearInterval(intervalId); window.removeEventListener('resize', updatePosition); };
  }, [stepIndex, isVisible, exitPhase]);

  const handleNext = () => {
    if (TUTORIAL_STEPS[stepIndex].action === 'simulate-poltergeist') {
      window.dispatchEvent(new CustomEvent('tutorial-action', { detail: { action: 'stop-poltergeist' } }));
    }
    if (stepIndex < TUTORIAL_STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setExitPhase('bubble');
    window.dispatchEvent(new CustomEvent('tutorial-action', { detail: { action: 'close-menus' } }));
    
    setTimeout(() => {
      setExitPhase('ghost');
      setTimeout(() => {
        setIsVisible(false);
        setExitPhase(null);
        localStorage.setItem('hwn_tutorial_completed', 'true');
      }, 800);
    }, 600);
  };

  if (!isVisible) return null;
  const currentStep = TUTORIAL_STEPS[stepIndex];

  return (
    <div className="tutorial-overlay">
      {currentStep.action === 'simulate-poltergeist' && <NativePoltergeistDemo />}

      {spotlightRects.map((rect, i) => (
        <div 
          key={i}
          className="tutorial-spotlight"
          style={{
            transform: `translate3d(${rect.left}px, ${rect.top}px, 0)`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            opacity: exitPhase ? 0 : 1,
            transition: 'opacity 0.6s ease, transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), height 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)'
          }}
        />
      ))}

      <div 
        className={`ghost-character-wrapper ${pos.centered ? 'center-screen' : ''} ${isNarrow ? 'narrow-bubble' : ''}`}
        style={{ 
          transform: `translate3d(calc(${pos.x}px - 50%), ${pos.centered ? `calc(${pos.y}px - 50%)` : `${pos.y}px`}, 0)`,
          width: `${currentGhostWidth}px`
        }}
      >
        <div className={`ghost-svg-container ${exitPhase === 'ghost' ? 'ghost-fly-away' : ''}`}>
          <svg viewBox="0 0 80 96" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M40 4C19.5 4 4 19.5 4 40V88L14 78L24 88L34 78L40 82L46 78L56 88L66 78L76 88V40C76 19.5 60.5 4 40 4Z" fill="color-mix(in srgb, var(--accent-primary) 15%, #08060a)" stroke="color-mix(in srgb, var(--accent-primary) 60%, transparent)" strokeWidth="2" />
            <circle cx="30" cy="40" r="4.5" fill="color-mix(in srgb, var(--accent-primary) 85%, transparent)" className={isTalking ? 'ghost-eye-glow-infinite' : ''} />
            <circle cx="50" cy="40" r="4.5" fill="color-mix(in srgb, var(--accent-primary) 85%, transparent)" className={isTalking ? 'ghost-eye-glow-infinite' : ''} />
          </svg>
          <div className="ghost-trail-particles">
            <div className="ghost-particle"></div>
            <div className="ghost-particle"></div>
            <div className="ghost-particle"></div>
            <div className="ghost-particle"></div>
            <div className="ghost-particle"></div>
          </div>
        </div>

        <div className={`tutorial-speech-bubble ${exitPhase === 'bubble' || exitPhase === 'ghost' ? 'bubble-fade-out' : ''}`} key={currentStep.id}>
          <div className="tutorial-speech-title">{currentStep.title}</div>
          <div className="tutorial-speech-text">
            <TypewriterText text={currentStep.text} />
          </div>
          <div className="tutorial-speech-actions">
            <button className="tutorial-btn" onClick={handleComplete}>Skip</button>
            <button className="tutorial-btn primary" onClick={handleNext}>{currentStep.btnText}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
