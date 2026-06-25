'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  Terminal, 
  Cpu, 
  BarChart2, 
  BookOpen, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Play, 
  Copy, 
  ArrowRight, 
  CornerDownRight, 
  RotateCcw,
  Sparkles,
  HelpCircle,
  Code
} from 'lucide-react';

const LINGUISTIC_SAMPLES = [
  {
    id: 'huck-finn',
    title: 'Adventures of Huckleberry Finn (Published Book)',
    text: "The stars were shining, and the leaves rustled in the woods ever so awful; and I heard an owl, away off, who-whooing about somebody that was dead, and a whippowill and a dog crying about somebody that was going to die; and the wind was trying to whisper something to me, and I couldn't make out what it was, and so it made the cold shivers run all over me.",
    description: "Captures the descriptive, rhythmic prose of Huck's voice with local dialect colors and nature metaphors."
  },
  {
    id: 'letter-livy',
    title: 'Letter to Olivia Clemens (Private Correspondence)',
    text: "Dear Livy: I have worked all day and am terribly tired. I think we shall make a fortune with this new patent typewriter affair, but Rogers is doubtful and counsels caution. I am writing this in the cold room of the Munich hotel, and my hand is quite stiff. I kiss the children for me, and bid you keep warm and think of me.",
    description: "Direct, personal letters to his wife. Focuses on domestic reality, health, financial anxiety, and lacks authorial distance."
  },
  {
    id: 'mississippi',
    title: 'Life on the Mississippi (Published Memoir)',
    text: "The Mississippi is well worth reading about. It is not a commonplace river, but on the contrary is in all ways remarkable. It has a width of seventy miles at its mouth, and its discharge is equal to that of three or four of the largest rivers of Europe combined. It is a remarkable river in every sense.",
    description: "Published travelogue. Features structured syntax, educational and descriptive facts, and high authorial polish."
  },
  {
    id: 'letter-howells',
    title: 'Letter to William Dean Howells (Private Literary)',
    text: "Dear Howells: That biography is a triumph. It is as clean and crisp as a fresh lettuce leaf. You have done me a service I can never repay, and I feel like an orphan who has suddenly found a wealthy uncle. The publishing business is a devilish nuisance, but your words have put heart into me.",
    description: "Private letter to his close friend and fellow novelist. Informal, frank, metaphor-rich, and conversational."
  }
];

const HISTORICAL_SLUR_DATA = [
  { source: "Adventures of Huckleberry Finn (Mark Twain, 1885)", count: 219, type: "satire/anti-slavery narrative", description: "Used realistic antebellum Southern dialect to expose the moral bankruptcy of slaveholding society." },
  { source: "Pudd'nhead Wilson (Mark Twain, 1894)", count: 50, type: "satire/legal critique", description: "Used to critique the legal fiction of the 'one-drop' rule and artificial racial divisions." },
  { source: "Cotton is King (David Christy, 1855)", count: 452, type: "pro-slavery tract", description: "Used to build theological and economic arguments justifying slavery as a permanent social good." },
  { source: "The Negro a Beast (Charles Carroll, 1900)", count: 820, type: "scientific racist tract", description: "Used in pseudo-scientific and biological arguments to assert that Black people lack souls." },
  { source: "Minstrel Show Scripts (Circa 1880)", count: 320, type: "theatrical caricature", description: "Used to mock, caricature, and amuse white audiences at the expense of Black humanity." }
];

const SCHOLARS = [
  {
    name: "Ralph Ellison",
    role: "Novelist & Essayist",
    move: "Jim's humanity persists beneath the mask.",
    position: "The book contains a caricature (the minstrel mask), but Jim's deep humanity persists beneath it. Reading the book requires understanding how Twain subverts the mask from within.",
    teaching: "YES, taught carefully to examine how literature masks and reveals human status.",
    quote: "“Twain wrote himself into a corner... but Jim's humanity cannot be suppressed by the white boy's game.”"
  },
  {
    name: "Toni Morrison",
    role: "Nobel Laureate",
    move: "Critique the narrative architecture.",
    position: "Unflinchingly critical of how the narrative uses Jim's body and freedom to facilitate Huck's moral education. The book exposes the structural convenience of Black suffering for white consciousness.",
    teaching: "YES, but must be read with severe critical distance, never sanitized.",
    quote: "“The argument is not about censorship; it is about reading the architecture of white supremacy in the text itself.”"
  },
  {
    name: "Jocelyn Chadwick",
    role: "Scholar & Educator",
    move: "Confronting pain builds critical mindsets.",
    position: "Jim is a complex figure of resistance. Confronting the pain and the slurs in the classroom builds critical, historic consciousness in students rather than fragile avoidance.",
    teaching: "YES, boldly and actively in high schools.",
    quote: "“To lock Huck Finn away is to lock away the very mirror that shows us how we got here.”"
  },
  {
    name: "Julius Lester",
    role: "Author & Academic",
    move: "Identify the compromise in structural goals.",
    position: "Jim is instrumentalized and denied true agency to maintain the comfort of white readers. The moral structure of the novel is compromised because Jim's freedom is treated as a secondary plot device.",
    teaching: "PROBABLY NOT, as its structural flaws outweigh its satirical benefits.",
    quote: "“Twain did not respect Jim's humanity enough to let him own his own story.”"
  },
  {
    name: "David Bradley",
    role: "Novelist & Professor",
    move: "Discomfort is historically necessary.",
    position: "Power lies in the refusal to sanitize. Replacing the word with 'slave' (as in the NewSouth Edition) hides the actual crime of history. Discomfort is the point of reading it.",
    teaching: "YES, unambiguously and in original form.",
    quote: "“If you sanitize the word, you sanitize the horror that the word was created to justify.”"
  },
  {
    name: "John H. Wallace",
    role: "Educator & Activist",
    move: "Classroom harm requires boundary setting.",
    position: "The repetition of the slur causes documented, psychological harm to Black students in integrated classrooms. Removing the book from school curricula is protective, not an evasion of history.",
    teaching: "NO, remove from mandatory curricula.",
    quote: "“No child should have to sit in a public classroom and hear their humanity debased under the guise of classic literature.”"
  },
  {
    name: "Sharon Rush",
    role: "Law Professor & Expert",
    move: "Conditions determine pedagogy success.",
    position: "Classroom environment is key. Teaching the text requires extreme care, racial empathy training, and structured dialogue; otherwise, it defaults into reproducing racial trauma.",
    teaching: "CONDITIONALLY, only under expert, culturally competent teachers.",
    quote: "“The harm is not just in the pages; it is in how the pages are read aloud in a modern room.”"
  },
  {
    name: "Percival Everett",
    role: "Pulitzer Prize-Winning Author",
    move: "Provide Jim with narrative authority.",
    position: "The debate is best resolved by writing the missing narrative. In his 2024 novel 'James', Jim is given full literacy, agency, and voice, letting the character tell his own story.",
    teaching: "N/A — Offers a literary companion text to read alongside Twain.",
    quote: "“I wanted to give Jim the language he actually spoke in his head, not the caricature written on his face.”"
  }
];

export default function MLClient() {
  const [activeTab, setActiveTab] = useState('api'); // 'linguistics' | 'slurs' | 'api'
  
  // Tab 1: Linguistics state
  const [linguisticInput, setLinguisticInput] = useState(LINGUISTIC_SAMPLES[0].text);
  const [linguisticAnalysis, setLinguisticAnalysis] = useState(null);

  // Tab 2: Slur Audit state
  const [auditInput, setAuditInput] = useState("We should tell the story of the slave Jim, though the word nigger is a terrible scar in our books.");
  const [auditResult, setAuditResult] = useState(null);
  const [selectedScholar, setSelectedScholar] = useState(SCHOLARS[0]);

  // Tab 3: API Console state
  const [apiAction, setApiAction] = useState('search'); // 'search' | 'scroll'
  const [apiQuery, setApiQuery] = useState('Mississippi riverboat');
  const [apiLimit, setApiLimit] = useState(3);
  const [apiOffset, setApiOffset] = useState('');
  const [apiWithVector, setApiWithVector] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // Run initial style analysis
  useEffect(() => {
    handleLinguisticAnalyze();
  }, []);

  // Run initial audit analysis
  useEffect(() => {
    handleAuditAnalyze();
  }, []);

  // Linguistic analysis helper
  const handleLinguisticAnalyze = () => {
    const text = linguisticInput.trim();
    if (!text) return;

    const words = text.toLowerCase().match(/\b[a-z']+\b/g) || [];
    const wordCount = words.length;
    if (wordCount === 0) return;

    // 1. Self references (I, me, my, myself, we, us, our)
    const selfRefs = words.filter(w => ['i', 'me', 'my', 'myself', 'we', 'us', 'our'].includes(w)).length;
    const selfRefRatio = selfRefs / wordCount;

    // 2. Average sentence length
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.length > 0 ? wordCount / sentences.length : 0;

    // 3. Dialect markers
    const dialectWords = ['warn\'t', 'reckon', 'ain\'t', 'shucks', 'lordy', 'lawsy', 'powerful', 'catched', 'drownded', 'druther', 'creature', 'ornery', 'medium', 'humbug', 'nigger'];
    const dialectCount = words.filter(w => dialectWords.includes(w)).length;
    const dialectRatio = dialectCount / wordCount;

    // 4. Conversational punctuation (dashes, exclamations)
    const dashes = (text.match(/—|-/g) || []).length;
    const exclamations = (text.match(/!/g) || []).length;
    const punctDensity = (dashes + exclamations) / wordCount;

    // Score calculations (0 = Book, 100 = Letter)
    let score = 50; // Neutral starting point

    // Self references push toward private letter
    if (selfRefRatio > 0.05) score += 20;
    else if (selfRefRatio > 0.02) score += 10;
    else score -= 15;

    // Short sentences push toward private conversational letters
    if (avgSentenceLength < 12) score += 15;
    else if (avgSentenceLength > 20) score -= 15;

    // Dialect markers push heavily toward published books (especially RAG books)
    if (dialectRatio > 0.01) score -= 25;
    else if (dialectRatio > 0.002) score -= 10;
    else score += 10;

    // Dashes and exclamations push toward letters
    if (punctDensity > 0.02) score += 15;
    else if (punctDensity < 0.005) score -= 5;

    // Clamp score 0 to 100
    score = Math.max(0, Math.min(100, score));

    setLinguisticAnalysis({
      wordCount,
      sentencesCount: sentences.length,
      avgSentenceLength: avgSentenceLength.toFixed(1),
      selfRefPercentage: (selfRefRatio * 100).toFixed(1),
      dialectPercentage: (dialectRatio * 100).toFixed(1),
      punctScore: dashes + exclamations,
      score, // 0-100
      matchType: score > 55 ? 'Private Letters' : score < 45 ? 'Published Books' : 'Balanced / Stylized hybrid'
    });
  };

  // Slur / Pedagogy Audit analyzer
  const handleAuditAnalyze = () => {
    const text = auditInput.toLowerCase();
    
    const hasSlur = text.includes('nigger');
    const hasSanitized = text.includes('slave') || text.includes('servant');
    
    // Generate evaluations for all scholars based on the input text
    const evaluations = SCHOLARS.map(s => {
      let reaction = "";
      let alignment = "neutral"; // 'positive' | 'critical' | 'neutral'

      if (s.name === "Ralph Ellison") {
        if (hasSlur) {
          reaction = "Using the slur reflects the historical mask, but does this sentence show the active humanity and rebellion underneath? Do not let the caricature drown out the intelligence of the subject.";
          alignment = "neutral";
        } else {
          reaction = "Replacing the slur might hide the caricature, but the central focus must remain on uncovering the subversion and humanity beneath whatever forms are left.";
          alignment = "positive";
        }
      } 
      
      else if (s.name === "Toni Morrison") {
        reaction = "Analyzing this requires asking: does your text use Jim's suffering as a simple device to trigger someone else's moral growth? We must remain deeply critical of how the narrative architecture itself is constructed.";
        alignment = hasSlur ? "critical" : "neutral";
      } 
      
      else if (s.name === "Jocelyn Chadwick") {
        if (hasSlur) {
          reaction = "Confronting the word head-on is vital for historical awareness. Do not hide from this pain in your drafts — it is the mirror we need to construct critical thinking.";
          alignment = "positive";
        } else {
          reaction = "By avoiding the word, are you sanitizing the lesson? We cannot build historical stamina by looking away from the hard, painful parts of the past.";
          alignment = "critical";
        }
      } 
      
      else if (s.name === "Julius Lester") {
        if (hasSlur) {
          reaction = "Repeating these terms simply reproduces the compromised structure of the original text. It reduces agency and serves to make the narrative about racial pain rather than true equality.";
          alignment = "critical";
        } else {
          reaction = "Even without the word, check if you are still instrumentalizing the Black subject to make the surrounding narrative feel moral. The structure itself is what needs dismantling.";
          alignment = "neutral";
        }
      } 
      
      else if (s.name === "David Bradley") {
        if (hasSlur) {
          reaction = "Unflinching refusal to sanitize. You are right to keep the harshness; discomfort is the engine of truth. Changing the vocabulary hides the crime.";
          alignment = "positive";
        } else {
          reaction = "You are sanitizing the vocabulary. Replacing the term with 'slave' or similar euphemisms covers up the specific, active violence of the original era.";
          alignment = "critical";
        }
      } 
      
      else if (s.name === "John H. Wallace") {
        if (hasSlur) {
          reaction = "This language causes active harm. No modern writer should perpetuate this psychological damage in educational or artistic contexts. Cleanse the draft.";
          alignment = "critical";
        } else {
          reaction = "Correct move. Removing this abusive terminology protects the reader from unnecessary, daily psychological injury.";
          alignment = "positive";
        }
      } 
      
      else if (s.name === "Sharon Rush") {
        reaction = "The environment and care in which this is read determine its impact. Without structured, empathetic framing, repeating or even sanitizing the terms will still default into reproducing historic trauma.";
        alignment = "neutral";
      } 
      
      else if (s.name === "Percival Everett") {
        reaction = "Rather than parsing or cleaning Twain's compromises, why not shift the narrative authority entirely? Write from Jim's perspective, giving him the internal voice and agency he was historically denied.";
        alignment = "positive";
      }

      return {
        name: s.name,
        reaction,
        alignment
      };
    });

    setAuditResult(evaluations);
  };

  // Live API Console fetch runner
  const handleRunAPI = async () => {
    setApiLoading(true);
    setApiError('');
    setApiResponse(null);

    const body = {
      action: apiAction
    };

    if (apiAction === 'search') {
      body.query = apiQuery;
      body.limit = parseInt(apiLimit, 10);
      body.with_vector = apiWithVector;
    } else {
      body.limit = parseInt(apiLimit, 10);
      body.with_vector = apiWithVector;
      if (apiOffset) body.offset = apiOffset;
    }

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API returned ${response.status}: ${errText}`);
      }

      const data = await response.json();
      setApiResponse(data);
    } catch (err) {
      console.error("Playground fetch error:", err);
      setApiError(err.message || 'An error occurred during search.');
    } finally {
      setApiLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-[#15110d] text-[rgba(255,244,223,0.95)] font-sans pb-20 p-4 sm:p-8">
      {/* Page Header */}
      <header className="max-w-7xl mx-auto mb-10 border-b border-[rgba(255,244,223,0.08)] pb-6">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/" className="hover:opacity-85 transition-opacity">
            <img
              alt="Mark Twain Logo"
              width="70"
              height="25"
              className="mark-twain-solo-logo"
              src="/images/MarkTwainSoloLogo.webp"
            />
          </Link>
          <span className="text-xs uppercase tracking-widest text-[#d9a34a] font-bold">Linguistic Lab & API Desk</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#d9a34a] tracking-wide">
          Machine Learning Playground
        </h1>
        <p className="text-sm text-[rgba(255,244,223,0.6)] mt-2 leading-relaxed">
          Expose the RAG vector store, perform client-side stylistic comparisons, and examine the linguistic structures of Samuel Clemens' output.
        </p>
      </header>

      {/* Main Layout Grid */}
      <main className="max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-[rgba(255,244,223,0.08)] bg-[#1d1611]">
          <button
            onClick={() => setActiveTab('api')}
            className={`flex items-center gap-2 px-6 py-4 text-xs sm:text-sm uppercase tracking-wider font-bold transition-all border-b-2 ${
              activeTab === 'api'
                ? 'border-[#d9a34a] text-[#d9a34a] bg-black/20'
                : 'border-transparent text-[rgba(255,244,223,0.6)] hover:text-[rgba(255,244,223,0.9)]'
            }`}
          >
            <Terminal size={16} />
            Embeddings API Playground
          </button>
          <button
            onClick={() => setActiveTab('linguistics')}
            className={`flex items-center gap-2 px-6 py-4 text-xs sm:text-sm uppercase tracking-wider font-bold transition-all border-b-2 ${
              activeTab === 'linguistics'
                ? 'border-[#d9a34a] text-[#d9a34a] bg-black/20'
                : 'border-transparent text-[rgba(255,244,223,0.6)] hover:text-[rgba(255,244,223,0.9)]'
            }`}
          >
            <Cpu size={16} />
            Linguistic Style Analyzer
          </button>
          <button
            onClick={() => setActiveTab('slurs')}
            className={`flex items-center gap-2 px-6 py-4 text-xs sm:text-sm uppercase tracking-wider font-bold transition-all border-b-2 ${
              activeTab === 'slurs'
                ? 'border-[#d9a34a] text-[#d9a34a] bg-black/20'
                : 'border-transparent text-[rgba(255,244,223,0.6)] hover:text-[rgba(255,244,223,0.9)]'
            }`}
          >
            <BarChart2 size={16} />
            Huck Finn Pedagogy Lab
          </button>
        </div>

        {/* Tab Contents */}
        <div className="min-h-[60vh]">
          <AnimatePresence mode="wait">
            
            {/* ================= TAB 1: LINGUISTICS ================= */}
            {activeTab === 'linguistics' && (
              <motion.div
                key="linguistics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Left Panel: Inputs & Selection */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  <div className="bg-[#1d1611] border border-[rgba(255,244,223,0.08)] p-6">
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#d9a34a] mb-4">Sample Selection</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                      {LINGUISTIC_SAMPLES.map(sample => (
                        <button
                          key={sample.id}
                          onClick={() => {
                            setLinguisticInput(sample.text);
                            setTimeout(handleLinguisticAnalyze, 50);
                          }}
                          className={`text-left p-4 border text-sm leading-relaxed transition-all ${
                            linguisticInput === sample.text
                              ? 'border-[#d9a34a] bg-[#d9a34a]/5'
                              : 'border-[rgba(255,244,223,0.08)] bg-black/20 hover:border-amber-500/30'
                          }`}
                        >
                          <span className="font-bold block text-[#d9a34a] mb-1">{sample.title}</span>
                          <span className="opacity-70 line-clamp-2">{sample.description}</span>
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs sm:text-sm uppercase tracking-wider text-[rgba(255,244,223,0.6)] font-bold">
                        Analyze Custom Text
                      </label>
                      <textarea
                        value={linguisticInput}
                        onChange={(e) => setLinguisticInput(e.target.value)}
                        placeholder="Paste Twain passages or write your own to test tone alignment..."
                        className="w-full h-40 bg-black/40 border border-[rgba(255,244,223,0.08)] p-4 text-sm font-mono focus:border-[#d9a34a] focus:outline-none text-[rgba(255,244,223,0.9)]"
                      />
                    </div>

                    <div className="flex justify-between items-center mt-4">
                      <button
                        onClick={() => setLinguisticInput('')}
                        className="flex items-center gap-1.5 text-xs sm:text-sm uppercase tracking-wider border border-[rgba(255,244,223,0.15)] px-4 py-2.5 bg-black/10 hover:border-[#d9a34a]/50 text-[rgba(255,244,223,0.7)]"
                      >
                        <RotateCcw size={12} />
                        Clear Input
                      </button>
                      <button
                        onClick={handleLinguisticAnalyze}
                        className="flex items-center gap-2 text-xs sm:text-sm uppercase tracking-wider px-6 py-3 bg-[#d9a34a] text-black font-bold hover:opacity-90"
                      >
                        <Play size={12} fill="black" />
                        Run Style Audit
                      </button>
                    </div>
                  </div>

                  {/* Recommendation Box */}
                  {linguisticAnalysis && (
                    <div className="bg-[#1d1611]/60 border-l-4 border-[#d9a34a] p-5">
                      <h3 className="font-serif text-[#d9a34a] text-base font-bold uppercase tracking-wider mb-2">
                        Tone Recommendation for the Next Book
                      </h3>
                      <p className="text-sm leading-relaxed opacity-85">
                        {linguisticAnalysis.score > 55 ? (
                          <>
                            <strong>Private Samuel Clemens Tone Detected.</strong> Samuel's letters are highly self-reflective, conversational, and direct. Writing the next book in this tone will construct a deeply intimate, raw, and biographical narrative. However, historical readers might miss the grand caricature and structural satirical devices. <em>Recommendation: Use this tone strictly for personal diaries, introspective monologues, or letters.</em>
                          </>
                        ) : (
                          <>
                            <strong>Public Authorial Tone Detected.</strong> Twain's published books employ rich descriptive architectures, regional dialect, and low direct self-references (except through stylized personas). Writing the next book in this tone preserves his canonical literary style. <em>Recommendation: Write the next book in this tone to maintain the classic, public-facing Mark Twain voice.</em>
                          </>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Panel: Analysis Gauge & Metrics */}
                <div className="bg-[#1d1611] border border-[rgba(255,244,223,0.08)] p-6 flex flex-col gap-6">
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#d9a34a] border-b border-[rgba(255,244,223,0.08)] pb-3">
                    Style Match Metrics
                  </h2>

                  {linguisticAnalysis ? (
                    <div className="flex flex-col gap-6">
                      {/* Gauge representation */}
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center text-xs uppercase font-bold tracking-widest text-[rgba(255,244,223,0.6)]">
                          <span>Book (Public)</span>
                          <span>Letter (Private)</span>
                        </div>
                        
                        {/* Custom Bar Chart */}
                        <div className="h-6 w-full bg-black/60 border border-[rgba(255,244,223,0.08)] relative overflow-hidden flex">
                          {/* Anchor Pointer marker */}
                          <div 
                            className="absolute top-0 bottom-0 w-1 bg-[#d9a34a] z-10 transition-all duration-500 shadow-lg"
                            style={{ left: `${linguisticAnalysis.score}%` }}
                          />
                          <div 
                            className="h-full bg-amber-500/10 transition-all duration-500" 
                            style={{ width: `${linguisticAnalysis.score}%` }}
                          />
                        </div>

                        <div className="flex justify-between text-xs sm:text-sm font-bold text-[#d9a34a] mt-1 select-none">
                          <span>{(100 - linguisticAnalysis.score).toFixed(0)}% Author</span>
                          <span>{linguisticAnalysis.score.toFixed(0)}% Private Sam</span>
                        </div>
                      </div>

                      {/* Result Box */}
                      <div className="p-3 bg-black/40 border border-[rgba(255,244,223,0.05)] text-center rounded">
                        <span className="text-xs uppercase tracking-wider opacity-60 block mb-1">Classifier Output</span>
                        <span className="text-base sm:text-lg font-bold text-[#d9a34a] font-serif">{linguisticAnalysis.matchType}</span>
                      </div>

                      {/* Stat Rows */}
                      <div className="flex flex-col gap-4 text-xs sm:text-sm">
                        <div className="flex justify-between items-center border-b border-black/35 pb-2">
                          <span className="opacity-70">Word Count</span>
                          <span className="font-bold text-[#fff4df]">{linguisticAnalysis.wordCount}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-black/35 pb-2">
                          <span className="opacity-70">Sentences Count</span>
                          <span className="font-bold text-[#fff4df]">{linguisticAnalysis.sentencesCount}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-black/35 pb-2">
                          <span className="opacity-70">Avg. Sentence Length</span>
                          <span className="font-bold text-[#fff4df]">{linguisticAnalysis.avgSentenceLength} words</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-black/35 pb-2">
                          <span className="opacity-70">Self-Reference Index</span>
                          <span className="font-bold text-[#fff4df]">{linguisticAnalysis.selfRefPercentage}%</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-black/35 pb-2">
                          <span className="opacity-70">Dialect Density</span>
                          <span className="font-bold text-[#fff4df]">{linguisticAnalysis.dialectPercentage}%</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-black/35 pb-2">
                          <span className="opacity-70">Punctuation Marks (! or —)</span>
                          <span className="font-bold text-[#fff4df]">{linguisticAnalysis.punctScore}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 opacity-50 text-xs sm:text-sm">
                      Run the audit to compute metrics...
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ================= TAB 2: SLUR DEBATE ================= */}
            {activeTab === 'slurs' && (
              <motion.div
                key="slurs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-8"
              >
                {/* Upper Section: Quantitative Slur Chart */}
                <div className="bg-[#1d1611] border border-[rgba(255,244,223,0.08)] p-6">
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#d9a34a] mb-2">Quantitative Analysis: Slur Frequencies</h2>
                  <p className="text-sm opacity-60 mb-6 leading-relaxed">
                    A comparison of offensive terms (slurs) in Twain's texts vs. 19th-century racist tracts and theatrical minstrel scripts.
                  </p>

                  <div className="flex flex-col gap-6">
                    {HISTORICAL_SLUR_DATA.map((data, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                        <div className="w-full sm:w-1/3 flex flex-col">
                          <span className="text-xs sm:text-sm font-bold text-[#fff4df]">{data.source}</span>
                          <span className="text-xs text-[#d9a34a] font-bold uppercase mt-0.5 tracking-wider">{data.type}</span>
                        </div>

                        {/* Histogram Bar */}
                        <div className="flex-1 flex items-center gap-4">
                          <div className="flex-1 bg-black/50 border border-[rgba(255,244,223,0.08)] h-4 relative overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-1000 ${
                                data.source.includes("Mark Twain") 
                                  ? 'bg-[#d9a34a]/30 border-r border-[#d9a34a]' 
                                  : 'bg-red-500/20 border-r border-red-500'
                              }`}
                              style={{ width: `${(data.count / 850) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs sm:text-sm font-bold font-mono min-w-[70px]">
                            {data.count} times
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 p-4 bg-black/40 border border-[rgba(255,244,223,0.05)] border-l-4 border-[#d9a34a] text-sm leading-relaxed text-[rgba(255,244,223,0.8)]">
                    <h3 className="font-bold text-[#d9a34a] uppercase mb-1">Qualitative Distinctions: Satirical Subversion vs. Dehumanization</h3>
                    <p className="mb-2">
                      <strong>Pro-slavery / Scientific Racist Tracts</strong> utilized slurs dogmatically as literal, biological descriptors to build arguments that Black people lacked souls or moral capacity, justifying chattel slavery.
                    </p>
                    <p className="mb-2">
                      <strong>Mark Twain</strong> used the slur realistically to capture the authentic, compromised language of the pre-Civil War South. In <em>Huckleberry Finn</em>, the moral center of the book is Huck's crisis where he decides to 'go to hell' rather than betray Jim. The use of the slur acts as a satirical mirror, showing that society's 'moral' laws and language were corrupt.
                    </p>
                    <p>
                      <strong>Minstrel Shows</strong> repeated the terms purely for cheap caricature, mocking Black speech patterns and humanity for the amusement of white theatrical audiences.
                    </p>
                  </div>
                </div>

                {/* Lower Section: Scholarly Audit Playground */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Input text */}
                  <div className="lg:col-span-2 bg-[#1d1611] border border-[rgba(255,244,223,0.08)] p-6 flex flex-col gap-6">
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#d9a34a] border-b border-[rgba(255,244,223,0.08)] pb-3">
                      Scholarly Critique Audit
                    </h2>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs sm:text-sm uppercase tracking-wider text-[rgba(255,244,223,0.6)] font-bold">
                        Drafted Text / Lyric to Audit
                      </label>
                      <textarea
                        value={auditInput}
                        onChange={(e) => setAuditInput(e.target.value)}
                        placeholder="Type standard or sanitized lyrics to see how the scholars evaluate it..."
                        className="w-full h-32 bg-black/40 border border-[rgba(255,244,223,0.08)] p-4 text-sm font-mono focus:border-[#d9a34a] focus:outline-none text-[rgba(255,244,223,0.9)]"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={handleAuditAnalyze}
                        className="flex items-center gap-2 text-xs sm:text-sm uppercase tracking-wider px-6 py-3 bg-[#d9a34a] text-black font-bold hover:opacity-90"
                      >
                        <Play size={12} fill="black" />
                        Run Bias & Scholarly Audit
                      </button>
                    </div>

                    {/* Results table */}
                    {auditResult && (
                      <div className="flex flex-col gap-4 mt-2">
                        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider opacity-60">Scholarly Evaluations</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {auditResult.map((res, idx) => {
                            const badgeColor = 
                              res.alignment === 'positive' ? 'border-green-500/30 text-green-400 bg-green-500/5' :
                              res.alignment === 'critical' ? 'border-red-500/30 text-red-400 bg-red-500/5' :
                              'border-[rgba(255,244,223,0.15)] text-[rgba(255,244,223,0.7)] bg-white/5';
                            
                            return (
                              <div key={idx} className="p-4 bg-black/20 border border-[rgba(255,244,223,0.05)] flex flex-col gap-2 rounded">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs sm:text-sm font-bold text-[#d9a34a]">{res.name}</span>
                                  <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${badgeColor}`}>
                                    {res.alignment}
                                  </span>
                                </div>
                                <p className="text-xs sm:text-sm leading-relaxed opacity-75">{res.reaction}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Scholar Profiles */}
                  <div className="bg-[#1d1611] border border-[rgba(255,244,223,0.08)] p-6 flex flex-col gap-4">
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#d9a34a] border-b border-[rgba(255,244,223,0.08)] pb-3">
                      Scholarly Perspectives
                    </h2>

                    <div className="flex flex-col gap-2 max-h-[30vh] overflow-y-auto pr-1 custom-scrollbar">
                      {SCHOLARS.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedScholar(s)}
                          className={`text-left p-2.5 border text-xs sm:text-sm transition-all flex items-center justify-between ${
                            selectedScholar.name === s.name
                              ? 'border-[#d9a34a] bg-[#d9a34a]/5 text-[#d9a34a] font-bold'
                              : 'border-[rgba(255,244,223,0.08)] bg-black/20 text-[rgba(255,244,223,0.7)] hover:border-amber-500/30'
                          }`}
                        >
                          <span>{s.name}</span>
                          <span className="text-[11px] opacity-65 font-normal">{s.role}</span>
                        </button>
                      ))}
                    </div>

                    {selectedScholar && (
                      <div className="mt-4 border-t border-[rgba(255,244,223,0.08)] pt-4 flex flex-col gap-3 text-xs leading-relaxed">
                        <div className="flex flex-col">
                          <span className="text-xs uppercase opacity-55">Scholar & Core Thesis</span>
                          <span className="font-bold text-[#d9a34a] text-base mt-0.5">{selectedScholar.name}</span>
                          <span className="italic text-xs sm:text-sm opacity-75">{selectedScholar.role}</span>
                        </div>

                        <div className="p-3 bg-black/35 border border-[rgba(255,244,223,0.05)] rounded">
                          <span className="text-xs uppercase font-bold text-[#d9a34a] block mb-1">Core Position</span>
                          <p className="text-xs sm:text-sm">{selectedScholar.position}</p>
                        </div>

                        <div className="flex justify-between items-center text-xs sm:text-sm border-b border-black/30 pb-2">
                          <span className="opacity-60">On Classroom Teaching</span>
                          <span className="font-bold text-[#fff4df]">{selectedScholar.teaching}</span>
                        </div>

                        <div className="flex justify-between items-center text-xs sm:text-sm border-b border-black/30 pb-2">
                          <span className="opacity-60">Pedagogical Move</span>
                          <span className="font-bold text-[#fff4df]">{selectedScholar.move}</span>
                        </div>

                        <div className="italic text-xs sm:text-sm text-[#d9a34a]/90 mt-1 select-none">
                          {selectedScholar.quote}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ================= TAB 3: API PLAYGROUND ================= */}
            {activeTab === 'api' && (
              <motion.div
                key="api"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Left Column: API Console Inputs (5 cols) */}
                <div className="lg:col-span-5 bg-[#1d1611] border border-[rgba(255,244,223,0.08)] p-6 flex flex-col gap-6">
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#d9a34a] border-b border-[rgba(255,244,223,0.08)] pb-3">
                    API Console
                  </h2>

                  {/* Action Selection */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-wider text-[rgba(255,244,223,0.6)] font-bold">
                      Endpoint Action
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setApiAction('search')}
                        className={`py-2 text-xs sm:text-sm font-bold border transition-all ${
                          apiAction === 'search'
                            ? 'border-[#d9a34a] bg-[#d9a34a]/10 text-[#d9a34a]'
                            : 'border-[rgba(255,244,223,0.08)] bg-black/20 text-[rgba(255,244,223,0.6)]'
                        }`}
                      >
                        Similarity Search
                      </button>
                      <button
                        onClick={() => setApiAction('scroll')}
                        className={`py-2 text-xs sm:text-sm font-bold border transition-all ${
                          apiAction === 'scroll'
                            ? 'border-[#d9a34a] bg-[#d9a34a]/10 text-[#d9a34a]'
                            : 'border-[rgba(255,244,223,0.08)] bg-black/20 text-[rgba(255,244,223,0.6)]'
                        }`}
                      >
                        Paginate (Scroll)
                      </button>
                    </div>
                  </div>

                  {/* Conditional inputs */}
                  {apiAction === 'search' ? (
                    <div className="flex flex-col gap-2">
                      <label className="text-xs uppercase tracking-wider text-[rgba(255,244,223,0.6)] font-bold">
                        Query String
                      </label>
                      <input
                        type="text"
                        value={apiQuery}
                        onChange={(e) => setApiQuery(e.target.value)}
                        placeholder="e.g. Mississippi riverboat..."
                        className="bg-black/40 border border-[rgba(255,244,223,0.08)] p-2.5 text-xs sm:text-sm font-mono text-[rgba(255,244,223,0.9)] focus:border-[#d9a34a] focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <label className="text-xs uppercase tracking-wider text-[rgba(255,244,223,0.6)] font-bold">
                        Page Offset (Token ID)
                      </label>
                      <input
                        type="text"
                        value={apiOffset}
                        onChange={(e) => setApiOffset(e.target.value)}
                        placeholder="Leave empty for page 1..."
                        className="bg-black/40 border border-[rgba(255,244,223,0.08)] p-2.5 text-xs sm:text-sm font-mono text-[rgba(255,244,223,0.9)] focus:border-[#d9a34a] focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Limit input */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-wider text-[rgba(255,244,223,0.6)] font-bold">
                      Result Count Limit
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={apiLimit}
                      onChange={(e) => setApiLimit(e.target.value)}
                      className="bg-black/40 border border-[rgba(255,244,223,0.08)] p-2.5 text-xs sm:text-sm font-mono text-[rgba(255,244,223,0.9)] focus:border-[#d9a34a] focus:outline-none"
                    />
                  </div>

                  {/* With Vector checkbox */}
                  <div className="flex items-center gap-2 py-1 select-none">
                    <input
                      type="checkbox"
                      id="api-with-vector-checkbox"
                      checked={apiWithVector}
                      onChange={(e) => setApiWithVector(e.target.checked)}
                      className="accent-[#d9a34a] cursor-pointer"
                    />
                    <label htmlFor="api-with-vector-checkbox" className="text-xs sm:text-sm opacity-75 cursor-pointer">
                      Return raw 1024-dimension float vectors
                    </label>
                  </div>

                  {/* Execute Button */}
                  <button
                    onClick={handleRunAPI}
                    disabled={apiLoading}
                    className="flex items-center justify-center gap-2 text-xs sm:text-sm uppercase tracking-wider py-3 bg-[#d9a34a] text-black font-bold hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  >
                    {apiLoading ? 'Executing request...' : 'Execute API Request'}
                    {!apiLoading && <Play size={12} fill="black" />}
                  </button>
                </div>

                {/* Right Column: Console output + Code snippets (7 cols) */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  
                  {/* Console screen */}
                  <div className="bg-[#0f0b08] border border-[rgba(255,244,223,0.08)] p-5 flex flex-col gap-4 flex-1">
                    <div className="flex justify-between items-center border-b border-[rgba(255,244,223,0.08)] pb-2 text-xs uppercase tracking-wider text-[rgba(255,244,223,0.5)]">
                      <span>Live Response Output</span>
                      <span>POST /api/research</span>
                    </div>

                    {apiLoading && (
                      <div className="flex flex-col items-center justify-center py-20 gap-3 text-xs sm:text-sm opacity-65">
                        <div className="h-6 w-6 border-2 border-[#d9a34a] border-t-transparent rounded-full animate-spin" />
                        Querying Qdrant index...
                      </div>
                    )}

                    {apiError && (
                      <div className="text-red-400 bg-red-900/10 border border-red-500/20 p-4 text-xs sm:text-sm flex flex-col gap-2 rounded">
                        <div className="flex items-center gap-2 font-bold uppercase">
                          <AlertTriangle size={14} />
                          Query Execution Failed
                        </div>
                        <p className="leading-relaxed">{apiError}</p>
                        <p className="opacity-60 text-[11px] border-t border-red-500/10 pt-2 mt-1">
                          Make sure your local Next.js dev server is running and configured with `QDRANT_URL` and `QDRANT_API_KEY` in `.env.local`.
                        </p>
                      </div>
                    )}

                    {!apiLoading && !apiError && !apiResponse && (
                      <div className="flex flex-col items-center justify-center py-20 text-xs sm:text-sm opacity-40 text-center">
                        <Terminal size={24} className="mb-2" />
                        Execute an API request on the left panel to fetch live Qdrant embeddings context.
                      </div>
                    )}

                    {!apiLoading && !apiError && apiResponse && (
                      <div className="flex flex-col gap-4">
                        {/* Compact points view */}
                        {apiResponse.results && (
                          <div className="flex flex-col gap-2">
                            <span className="text-xs uppercase tracking-wider text-[#d9a34a] font-bold">Similarity Search Results ({apiResponse.results.length})</span>
                            <div className="flex flex-col gap-2 max-h-[30vh] overflow-y-auto pr-1 custom-scrollbar text-xs">
                              {apiResponse.results.map((res, idx) => (
                                <div key={idx} className="bg-white/5 border border-white/5 p-3 rounded flex flex-col gap-1.5">
                                  <div className="flex justify-between items-center text-xs border-b border-white/5 pb-1">
                                    <span className="text-[#d9a34a] font-bold">{res.payload?.filename || 'Unknown'} (idx: {res.payload?.chunk_index})</span>
                                    <span className="font-bold opacity-60">Score: {res.score?.toFixed(4)}</span>
                                  </div>
                                  <p className="line-clamp-3 text-xs sm:text-sm leading-relaxed opacity-85">{res.payload?.text}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {apiResponse.points && (
                          <div className="flex flex-col gap-2">
                            <span className="text-xs uppercase tracking-wider text-[#d9a34a] font-bold">Scrolled Points ({apiResponse.points.length})</span>
                            {apiResponse.next_page_offset && (
                              <span className="text-[11px] opacity-65 font-mono">Next Page Token: {apiResponse.next_page_offset}</span>
                            )}
                            <div className="flex flex-col gap-2 max-h-[30vh] overflow-y-auto pr-1 custom-scrollbar text-xs">
                              {apiResponse.points.map((pt, idx) => (
                                <div key={idx} className="bg-white/5 border border-white/5 p-3 rounded flex flex-col gap-1.5">
                                  <div className="flex justify-between items-center text-xs border-b border-white/5 pb-1">
                                    <span className="text-[#d9a34a] font-bold">{pt.payload?.filename || 'Unknown'} (idx: {pt.payload?.chunk_index})</span>
                                    <span className="font-mono text-[11px] opacity-40">id: {pt.id?.substring(0, 8)}...</span>
                                  </div>
                                  <p className="line-clamp-2 text-xs sm:text-sm leading-relaxed opacity-85">{pt.payload?.text}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Raw JSON Details */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-xs uppercase tracking-wider text-[rgba(255,244,223,0.5)] font-bold">Raw JSON (Truncated Vectors)</span>
                            <button
                              onClick={() => copyToClipboard(JSON.stringify(apiResponse, null, 2))}
                              className="text-xs hover:text-[#d9a34a] transition-all flex items-center gap-1 opacity-70"
                            >
                              <Copy size={10} />
                              Copy JSON
                            </button>
                          </div>
                          
                          {/* Truncated code render */}
                          <pre className="bg-[#050403] border border-white/5 p-3 text-xs font-mono text-green-400 overflow-x-auto rounded max-h-36 overflow-y-auto custom-scrollbar">
                            <code>
                              {JSON.stringify(
                                {
                                  ...apiResponse,
                                  results: apiResponse.results?.map(r => ({
                                    ...r,
                                    vector: r.vector ? [r.vector[0], r.vector[1], r.vector[2], "... 1024 floats ..."] : undefined
                                  })),
                                  points: apiResponse.points?.map(p => ({
                                    ...p,
                                    vector: p.vector ? [p.vector[0], p.vector[1], p.vector[2], "... 1024 floats ..."] : undefined
                                  }))
                                }, 
                                null, 
                                2
                              )}
                            </code>
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Integration Snippets */}
                  <div className="bg-[#1d1611] border border-[rgba(255,244,223,0.08)] p-5 flex flex-col gap-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#d9a34a] flex items-center gap-1.5">
                      <Code size={14} />
                      Getting Started with the Embeddings API
                    </h3>
                    
                    <div className="flex flex-col gap-3 text-xs sm:text-sm leading-relaxed">
                      <p className="opacity-75">
                        Perform a semantic search programmatically against the collection index via cURL, Node.js, or Python:
                      </p>
                      
                      {/* cURL Tab */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-xs opacity-60">
                          <span>cURL Request Example</span>
                          <button 
                            onClick={() => copyToClipboard(`curl -X POST http://localhost:3000/api/research \\\n  -H "Content-Type: application/json" \\\n  -d '{"action": "search", "query": "Mississippi riverboat", "limit": 3}'`)} 
                            className="hover:text-[#d9a34a] transition-all flex items-center gap-0.5"
                          >
                            <Copy size={10} />
                            Copy
                          </button>
                        </div>
                        <pre className="bg-black/60 border border-white/5 p-3 text-xs font-mono text-[rgba(255,244,223,0.85)] overflow-x-auto rounded select-all">
{`curl -X POST http://localhost:3000/api/research \\
  -H "Content-Type: application/json" \\
  -d '{"action": "search", "query": "Mississippi riverboat", "limit": 3}'`}
                        </pre>
                      </div>

                      {/* JS Tab */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-xs opacity-60">
                          <span>JavaScript Fetch Example</span>
                          <button 
                            onClick={() => copyToClipboard(`async function queryArchive(prompt) {\n  const res = await fetch('http://localhost:3000/api/research', {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json' },\n    body: JSON.stringify({ action: 'search', query: prompt, limit: 3 })\n  });\n  const data = await res.json();\n  return data.results;\n}`)} 
                            className="hover:text-[#d9a34a] transition-all flex items-center gap-0.5"
                          >
                            <Copy size={10} />
                            Copy
                          </button>
                        </div>
                        <pre className="bg-black/60 border border-white/5 p-3 text-xs font-mono text-[rgba(255,244,223,0.85)] overflow-x-auto rounded select-all">
{`async function queryArchive(prompt) {
  const res = await fetch('http://localhost:3000/api/research', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'search',
      query: prompt,
      limit: 3
    })
  });
  const data = await res.json();
  return data.results;
}`}
                        </pre>
                      </div>

                      {/* Python Tab */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-xs opacity-60">
                          <span>Python Requests Example</span>
                          <button 
                            onClick={() => copyToClipboard(`import requests\n\ndef query_archive(prompt):\n    url = "http://localhost:3000/api/research"\n    payload = {"action": "search", "query": prompt, "limit": 3}\n    res = requests.post(url, json=payload)\n    return res.json().get("results", [])`)} 
                            className="hover:text-[#d9a34a] transition-all flex items-center gap-0.5"
                          >
                            <Copy size={10} />
                            Copy
                          </button>
                        </div>
                        <pre className="bg-black/60 border border-white/5 p-3 text-xs font-mono text-[rgba(255,244,223,0.85)] overflow-x-auto rounded select-all">
{`import requests

def query_archive(prompt):
    url = "http://localhost:3000/api/research"
    payload = {
        "action": "search",
        "query": prompt,
        "limit": 3
    }
    res = requests.post(url, json=payload)
    return res.json().get("results", [])`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
