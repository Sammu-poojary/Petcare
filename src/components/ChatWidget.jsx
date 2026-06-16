import { useState } from 'react';
import './ChatWidget.css';

function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! How can we help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [botTyping, setBotTyping] = useState(false);

  const toggleOpen = () => setOpen(v => !v);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { from: 'user', text: input.trim() };
    const msgText = input.trim();
    setInput('');
    // Improved auto-reply logic: FAQ map, service detection, and clarification prompts
    const getAutoReply = (text) => {
      const original = (text || '').trim();
      const t = original.toLowerCase();
      if (!t) return 'Thanks — a team member will reach out shortly.';

      // FAQ map: common intents -> canned answers
      const faqs = [
        { keys: ['price', 'cost', 'how much'], reply: 'You can view product prices in the Medical Shop or check specific service pages for package pricing. Which product or service are you interested in?' },
        { keys: ['book', 'booking', 'appointment', 'reserve'], reply: 'To book a service, open the service page and use the Book button. Which service would you like to book?' },
        { keys: ['doctor', 'vet', 'consult', 'consultation'], reply: 'For doctor consultations, visit the Consult a Doctor page — you can request a video call or email a doctor there.' },
        { keys: ['contact', 'phone', 'call', 'email'], reply: 'You can call us at 9632038402 or email sameeksha.mca.2024@pim.ac.in for urgent queries.' },
        { keys: ['hours', 'open', 'close', 'timing'], reply: 'Our hours vary by service — please tell us which service or location so we can provide exact timings.' },
        { keys: ['location', 'address'], reply: 'We are located at the main campus — would you like directions or a map link?' }
      ];

      for (const f of faqs) {
        if (f.keys.some(k => t.includes(k))) return f.reply;
      }

      // Service detection: try to map a service mention to a helpful prompt
      const services = {
        training: 'Pet Training',
        grooming: 'Pet Grooming',
        boarding: 'Pet Boarding',
        medical: 'Medical Shop',
        walking: 'Pet Walking',
        dogshow: 'Dog Show',
        consult: 'Consult a Doctor'
      };
      for (const key of Object.keys(services)) {
        if (t.includes(key) || t.includes(services[key].toLowerCase())) {
          return `Are you asking about our ${services[key]} service? Tell me what you need (pricing, availability, or booking) and I'll help.`;
        }
      }

      // If the user asked a question, acknowledge it specifically and ask for clarification
      if (t.endsWith('?') || original.split(' ').length > 6) {
        return `Thanks — you asked: "${original}". Could you clarify whether you mean pricing, booking, or contact details?`;
      }

      // Short message fallback: suggest examples so the bot's reply is actionable
      if (original.length < 40) {
        return `Thanks for your message: "${original}". Could you specify if you mean booking, price, or contact so we can help quickly?`;
      }

      // Final fallback referencing the user's text
      return `Thanks for the details: "${original}". A team member will respond soon — would you like help with booking, pricing, or contact information?`;
    };

    // add user message immediately
    setMessages(m => [...m, userMsg]);

    // simulate typing, then add bot reply
    setBotTyping(true);
    setTimeout(() => {
      const botReply = { from: 'bot', text: getAutoReply(msgText) };
      setMessages(m => [...m, botReply]);
      setBotTyping(false);
    }, 1000);
  };

  return (
    <div className={`chat-widget ${open ? 'open' : ''}`}>
      <button className="chat-toggle" onClick={toggleOpen} aria-label="Chat with us">
        💬
      </button>

      {open && (
        <div className="chat-window">
          <div className="chat-header">
            <strong>Chat with us</strong>
            <button className="chat-close" onClick={toggleOpen}>×</button>
          </div>

          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-message ${m.from}`}>
                {m.text}
              </div>
            ))}
            {botTyping && (
              <div className="chat-message bot typing">Typing…</div>
            )}
          </div>

          <form className="chat-input-area" onSubmit={sendMessage}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="chat-input"
            />
            <button className="chat-send" type="submit">Send</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default ChatWidget;
