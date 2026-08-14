
import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, Bell, ChevronDown, Clock3, MapPin, Plane, Route, Search, ShieldCheck, Sparkles, Star, TrendingDown } from 'lucide-react';



const money = value => new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(value);
const hours = value => `${Math.floor(value)} h ${Math.round((value % 1) * 60)} min`;
const dateText = value => new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
const daysBetween = (a, b) => Math.round((new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`)) / 86400000);


const TOKYO = ['HND', 'NRT'];
const OSAKA = ['KIX', 'ITM', 'UKB'];
const PRIMARY = ['ARN', 'OSL', 'CPH'];


const baseRoutes = [
  { id: 1, start: 'ARN', outboundAirport: 'HND', inboundAirport: 'HND', outbound: 'ARN–HEL–HND', inbound: 'HND–HEL–ARN', airline: 'Finnair', depart: '2027-03-12', home: '2027-03-27', adultFare: 5890, infantFare: 620, positioningAdult: 0, groundTransport: 0, baggage: 0, outboundHours: 14.35, inboundHours: 14.2, longestLayover: 1.55, baseline: 8300, protected: true },
  { id: 2, start: 'CPH', outboundAirport: 'NRT', inboundAirport: 'KIX', outbound: 'ARN–CPH + CPH–WAW–NRT', inbound: 'KIX–WAW–CPH + CPH–ARN', airline: 'LOT', depart: '2027-04-08', home: '2027-04-23', adultFare: 5120, infantFare: 540, positioningAdult: 690, groundTransport: 0, baggage: 600, outboundHours: 15.45, inboundHours: 15.3, longestLayover: 2.4, baseline: 8100, protected: false },
  { id: 3, start: 'OSL', outboundAirport: 'KIX', inboundAirport: 'HND', outbound: 'ARN–OSL + OSL–IST–KIX', inbound: 'HND–IST–OSL + OSL–ARN', airline: 'Turkish Airlines', depart: '2027-05-18', home: '2027-06-02', adultFare: 5480, infantFare: 575, positioningAdult: 720, groundTransport: 0, baggage: 0, outboundHours: 15.55, inboundHours: 15.4, longestLayover: 3.15, baseline: 8500, protected: false },
  { id: 4, start: 'FRA', outboundAirport: 'HND', inboundAirport: 'KIX', outbound: 'ARN–FRA + FRA–HND', inbound: 'KIX–FRA + FRA–ARN', airline: 'Demo Air', depart: '2027-06-04', home: '2027-06-19', adultFare: 4690, infantFare: 510, positioningAdult: 1150, groundTransport: 0, baggage: 800, outboundHours: 17.2, inboundHours: 16.8, longestLayover: 5.1, baseline: 8400, protected: false, stopoverCity: 'Frankfurt', stopoverApproved: true },
  { id: 5, start: 'ARN', outboundAirport: 'NGO', inboundAirport: 'NGO', outbound: 'ARN–FRA–NGO', inbound: 'NGO–FRA–ARN', airline: 'Lufthansa', depart: '2027-04-11', home: '2027-04-26', adultFare: 6250, infantFare: 650, positioningAdult: 0, groundTransport: 0, baggage: 0, outboundHours: 15.7, inboundHours: 15.5, longestLayover: 2.1, baseline: 8200, protected: true }
];


function routeAnalysis(route, priority) {
  const familyTotal = route.adultFare * 2 + route.infantFare + route.positioningAdult * 2 + route.groundTransport + route.baggage;
  const normalFamilyTotal = route.baseline * 2 + Math.round(route.baseline * 0.1);
  const discount = Math.max(0, Math.round((1 - familyTotal / normalFamilyTotal) * 100));
  const tokyoOsaka = (TOKYO.includes(route.outboundAirport) && OSAKA.includes(route.inboundAirport)) || (OSAKA.includes(route.outboundAirport) && TOKYO.includes(route.inboundAirport));
  const openJaw = route.outboundAirport !== route.inboundAirport;
  const otherJapanOpenJaw = openJaw && !tokyoOsaka;
  const destinationScore = Math.max(priority[route.outboundAirport] || 3, priority[route.inboundAirport] || 3) * 2;
  const openJawBonus = tokyoOsaka ? 5 : otherJapanOpenJaw ? 2 : 0;
  const riskPenalty = route.protected ? 0 : route.longestLayover < 2 ? 12 : route.longestLayover < 3 ? 6 : 2;
  const score = Math.max(0, Math.min(100,
    Math.round(discount * 1.1) + destinationScore +
    (route.protected ? 16 : 7) +
    (Math.max(route.outboundHours, route.inboundHours) <= 16 ? 12 : route.stopoverApproved ? 7 : 2) +
    openJawBonus - riskPenalty
  ));
  const effectiveCost = familyTotal - (tokyoOsaka ? 1000 : 0);
  const reasons = [
    `${discount} % under syntetiskt normalpris`,
    tokyoOsaka ? 'Tokyo–Osaka Open Jaw får +5 och inget Open Jaw-avdrag' : openJaw ? 'Annan Open Jaw får +2 och inget automatiskt avdrag' : 'Vanlig tur och retur',
    route.protected ? 'Genomgående biljett med skyddad anslutning' : `Separata biljetter, anslutningsmarginal ${hours(route.longestLayover)}`,
    route.positioningAdult ? `Positionering från ARN ingår: ${money(route.positioningAdult * 2)}` : 'Ingen separat positionering krävs',
    `Reslängd ${daysBetween(route.depart, route.home)} dagar`
  ];
  return { familyTotal, normalFamilyTotal, discount, tokyoOsaka, openJaw, openJawBonus, riskPenalty, destinationScore, score, effectiveCost, reasons };
}


const scoreTone = score => score >= 85 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : score >= 70 ? 'text-blue-700 bg-blue-50 border-blue-200' : 'text-amber-700 bg-amber-50 border-amber-200';


export default function JapanPriceWatcher() {
  const [tab, setTab] = useState('routes');
  const [query, setQuery] = useState('');
  const [includeEurope, setIncludeEurope] = useState(true);
  const [allowOpenJaw, setAllowOpenJaw] = useState(true);
  const [maxPrice, setMaxPrice] = useState(16000);
  const [maxJourney, setMaxJourney] = useState(16);
  const [maxLayover, setMaxLayover] = useState(4);
  const [selected, setSelected] = useState(2);
  const [expanded, setExpanded] = useState(null);
  const [alerts, setAlerts] = useState([1]);
  const [priority, setPriority] = useState({ HND: 5, NRT: 5, KIX: 5, ITM: 5, UKB: 5, NGO: 5, FUK: 3, OKA: 4 });
  const [liveRoutes, setLiveRoutes] = useState(null);
  const [liveStatus, setLiveStatus] = useState('demo');
  const [liveMessage, setLiveMessage] = useState('Testdata visas tills backend är ansluten.');
  const [lastLiveSearch, setLastLiveSearch] = useState(null);


  const sourceRoutes = liveRoutes || baseRoutes;


  const searchLivePrices = async () => {
    setLiveStatus('loading');
    setLiveMessage('Hämtar priser från den manuella backend-sökningen...');
    try {
      const response = await fetch('/api/flights/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passengers: [{ type: 'adult' }, { type: 'adult' }, { age: 1 }],
          cabinClass: 'economy',
          primaryOrigins: PRIMARY,
          includeEurope,
          allowOpenJaw,
          destinations: Object.keys(priority).filter(code => priority[code] > 0),
          maxPrice,
          maxJourney,
          maxLayover
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Backend-sökningen svarade med ett fel.');
      if (!Array.isArray(payload.routes)) throw new Error('Backend-svaret saknar listan routes.');
      setLiveRoutes(payload.routes);
      setLastLiveSearch(new Date());
      setLiveStatus('live');
      setLiveMessage(`${payload.routes.length} live-rutter hämtades och skickades genom poängmotorn.`);
    } catch (error) {
      setLiveStatus('error');
      setLiveMessage(`${error.message} Testdata visas fortfarande. Lägg backend-funktionen på /api/flights/search för att aktivera knappen.`);
    }
  };


  const routes = useMemo(() => sourceRoutes.map(route => ({ ...route, analysis: routeAnalysis(route, priority) })).filter(route => {
    const europeOk = PRIMARY.includes(route.start) || includeEurope;
    const openJawOk = !route.analysis.openJaw || allowOpenJaw;
    const timeOk = (Math.max(route.outboundHours, route.inboundHours) <= maxJourney && route.longestLayover <= maxLayover) || (route.stopoverApproved && route.analysis.discount >= 30);
    const text = `${route.start} ${route.outboundAirport} ${route.inboundAirport} ${route.airline} ${route.outbound} ${route.inbound}`.toLowerCase();
    return europeOk && openJawOk && timeOk && route.analysis.familyTotal <= maxPrice && text.includes(query.toLowerCase());
  }).sort((a, b) => b.analysis.score - a.analysis.score || a.analysis.effectiveCost - b.analysis.effectiveCost), [query, includeEurope, allowOpenJaw, maxPrice, maxJourney, maxLayover, priority]);

  const best = routes[0];
  const setStars = (code, value) => setPriority(current => ({ ...current, [code]: value }));

  return <div className='min-h-screen bg-[#07101f] text-slate-100'>
    <div className='fixed inset-0 pointer-events-none overflow-hidden'>
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(37,99,235,0.16),transparent_34%),radial-gradient(circle_at_88%_12%,rgba(220,38,38,0.12),transparent_30%),linear-gradient(180deg,#07101f_0%,#0b1628_46%,#0d1725_100%)]'/>
      <div className='absolute inset-0 opacity-[0.04] bg-[linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] bg-[size:48px_48px]'/>
      <div className='absolute -top-40 left-1/2 h-80 w-[70rem] -translate-x-1/2 rounded-[100%] border border-white/10'/>
      <div className='absolute top-20 left-1/2 h-48 w-[55rem] -translate-x-1/2 rounded-[100%] border border-white/5'/>
    </div>


    <header className='relative z-20 border-b border-white/10 bg-[#07101f]/85 backdrop-blur-xl'>
      <div className='max-w-[1440px] mx-auto px-5 lg:px-8'>
        <div className='h-auto min-h-20 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <div className='flex items-center gap-4'>
            <div className='h-10 w-10 bg-red-600 flex items-center justify-center shadow-lg shadow-red-950/30'><Plane size={20}/></div>
            <div><div className='flex items-center gap-2'><h1 className='text-lg font-semibold tracking-tight'>Japan Fare Radar</h1><span className='border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-slate-400'>MVP</span></div><p className='text-xs text-slate-400 mt-1'>Smart ruttanalys för familjeresor till Japan</p></div>
          </div>
          <nav className='flex gap-1 overflow-x-auto border border-white/10 bg-white/[0.035] p-1'>{[['routes','Ruttöversikt'],['profile','Sökprofil'],['engine','Metod & ranking']].map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`px-4 py-2 text-sm whitespace-nowrap transition ${tab === id ? 'bg-white text-slate-950 font-medium shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>{label}</button>)}</nav>
        </div>
      </div>
    </header>

    <main className='relative z-10 max-w-[1440px] mx-auto px-5 lg:px-8 py-7 space-y-7'>
      <section className='relative overflow-hidden border border-white/10 bg-gradient-to-r from-[#101e34]/95 via-[#0d1a2d]/95 to-[#151d2c]/95 px-6 py-7 lg:px-8 lg:py-9 shadow-2xl shadow-black/20'>
        <div className='absolute right-0 top-0 h-full w-2 bg-red-600'/>
        <div className='grid lg:grid-cols-[1fr_auto] gap-8 items-end'>
          <div><div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-400'><Route size={15}/>Smart route intelligence</div><h2 className='mt-3 max-w-3xl text-3xl lg:text-4xl font-semibold tracking-tight text-white'>Hitta den bästa hela familjeresan, inte bara den billigaste flygbiljetten.</h2><p className='mt-4 max-w-2xl text-sm leading-6 text-slate-400'>Ruttmotorn väger samman flygpris, spädbarn, positionering från ARN, bagage, restid, biljettsskydd och värdet av Tokyo–Osaka Open Jaw.</p></div>
          {best && <div className='min-w-[260px] border-l border-white/10 pl-6'><div className='text-xs uppercase tracking-[0.16em] text-slate-500'>Bäst rankad nu</div><div className='mt-2 flex items-center gap-2 text-xl font-semibold'>{best.start}<ArrowRight size={18}/>{best.outboundAirport}{best.analysis.openJaw && <><span className='text-slate-600'>/</span>{best.inboundAirport}</>}</div><div className='mt-2 text-3xl font-semibold text-white'>{money(best.analysis.familyTotal)}</div><div className='mt-1 text-sm text-emerald-400'>Score {best.analysis.score}/100 · {best.analysis.discount}% under normalpris</div><button onClick={searchLivePrices} className='mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white'>Sök livepriser</button></div>}
        </div>
      </section>
      <div className='border-l-2 border-amber-400/70 bg-amber-300/[0.07] px-4 py-3 flex gap-3 text-sm text-amber-100'><AlertTriangle size={18} className='shrink-0 mt-0.5'/><div><strong>Syntetisk MVP.</strong> Logik och ranking fungerar mot testdata. Resultaten är inte livepriser och kan inte bokas från sidan.</div></div>


      {tab === 'routes' && <>
        <section className='grid grid-cols-2 lg:grid-cols-4 border border-white/10 bg-[#0c1728]/80 divide-x divide-y lg:divide-y-0 divide-white/10'>
          {[[routes.length,'Godkända rutter',Route],[routes.filter(r => r.analysis.tokyoOsaka).length,'Tokyo–Osaka Open Jaw',Plane],[includeEurope ? 'Europa' : 'Norden','Starttäckning',MapPin],[alerts.length,'Aktiva bevakningar',Bell]].map(([value,label,Icon]) => <div key={label} className='p-5 lg:p-6'><div className='flex items-center justify-between'><span className='text-xs uppercase tracking-[0.14em] text-slate-500'>{label}</span><Icon size={17} className='text-slate-500'/></div><div className='mt-4 text-2xl font-semibold text-white'>{value}</div></div>)}
        </section>

        <section className='border border-white/10 bg-[#0c1728]/75 p-3 shadow-xl shadow-black/10'><div className='relative'><Search className='absolute left-4 top-3.5 text-slate-500' size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder='Sök flygplats, flygbolag eller routing' className='w-full border border-white/10 bg-[#07101f]/70 py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20'/></div></section>
        <section className='space-y-3'>{routes.map((route, index) => <article key={route.id} className={`overflow-hidden border bg-white text-slate-900 shadow-lg shadow-black/10 transition ${selected === route.id ? 'border-blue-500 ring-1 ring-blue-500/30' : 'border-slate-200 hover:border-slate-300'}`}>
          <div className='grid lg:grid-cols-[64px_1.5fr_1fr_220px] cursor-pointer' onClick={() => setSelected(route.id)}>
            <div className='border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50 px-4 py-5 flex lg:flex-col items-center justify-between lg:justify-start lg:gap-3'><span className='text-xs font-semibold uppercase tracking-widest text-slate-400'>Rank</span><span className='text-2xl font-semibold text-slate-900'>{String(index + 1).padStart(2,'0')}</span></div>
            <div className='px-5 py-5 lg:px-6'>
              <div className='flex flex-wrap gap-2'><span className={`border px-2.5 py-1 text-xs font-semibold ${scoreTone(route.analysis.score)}`}>Score {route.analysis.score}</span>{route.analysis.tokyoOsaka && <span className='border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700'>Tokyo–Osaka +5</span>}{route.protected && <span className='border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700'>Skyddad biljett</span>}</div>
              <div className='mt-4 flex flex-wrap items-center gap-3'><span className='text-2xl font-semibold tracking-tight'>{route.start}</span><div className='h-px w-10 bg-slate-300 relative'><Plane size={15} className='absolute -top-[7px] left-1/2 -translate-x-1/2 text-slate-500'/></div><span className='text-2xl font-semibold tracking-tight'>{route.outboundAirport}</span>{route.analysis.openJaw && <><span className='text-sm text-slate-400'>hem från</span><span className='text-2xl font-semibold tracking-tight'>{route.inboundAirport}</span></>}</div>
              <p className='mt-3 text-sm text-slate-500'>{route.airline} · {dateText(route.depart)} till {dateText(route.home)} · {daysBetween(route.depart, route.home)} dagar</p>
            </div>
            <div className='border-t lg:border-t-0 lg:border-l border-slate-200 px-5 py-5 grid grid-cols-2 gap-x-5 gap-y-4 text-sm'><div><span className='block text-xs text-slate-400'>Utresa</span><strong>{hours(route.outboundHours)}</strong></div><div><span className='block text-xs text-slate-400'>Hemresa</span><strong>{hours(route.inboundHours)}</strong></div><div><span className='block text-xs text-slate-400'>Transit</span><strong>{hours(route.longestLayover)}</strong></div><div><span className='block text-xs text-slate-400'>Upplägg</span><strong>{route.analysis.tokyoOsaka ? 'Tokyo ↔ Osaka' : route.analysis.openJaw ? 'Open Jaw' : 'Tur/retur'}</strong></div></div>
            <div className='border-t lg:border-t-0 lg:border-l border-slate-200 bg-slate-50 px-5 py-5 lg:text-right flex lg:block items-end justify-between'><div><span className='block text-xs uppercase tracking-wider text-slate-400'>Familjetotal</span><div className='mt-1 text-2xl font-semibold'>{money(route.analysis.familyTotal)}</div><div className='mt-1 text-sm font-medium text-emerald-600'>−{route.analysis.discount}% mot normalpris</div></div><button onClick={event => { event.stopPropagation(); setAlerts(current => current.includes(route.id) ? current.filter(id => id !== route.id) : [...current, route.id]); }} className={`mt-4 border px-3 py-2 text-xs font-semibold transition ${alerts.includes(route.id) ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white hover:border-slate-500'}`}><Bell size={14} className='inline mr-1.5'/>{alerts.includes(route.id) ? 'Bevakas' : 'Bevaka'}</button></div>
          </div>
          <div className='border-t border-slate-200 bg-white px-5 py-3 flex items-center justify-between'><span className='text-xs text-slate-400'>Effektiv kostnad: <strong className='text-slate-600'>{money(route.analysis.effectiveCost)}</strong></span><button onClick={() => setExpanded(expanded === route.id ? null : route.id)} className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-900'>Detaljer <ChevronDown size={16} className={`transition ${expanded === route.id ? 'rotate-180' : ''}`}/></button></div>

          {expanded === route.id && <div className='border-t border-slate-200 bg-[#f8fafc] p-5 lg:p-6'>
            <div className='grid lg:grid-cols-3 gap-6'>
              <div><h3 className='text-xs font-semibold uppercase tracking-[0.15em] text-slate-400'>Routing</h3><div className='mt-3 space-y-3 text-sm'><p><strong className='block text-slate-400 font-normal'>Utresa</strong>{route.outbound}</p><p><strong className='block text-slate-400 font-normal'>Hemresa</strong>{route.inbound}</p></div></div>
              <div><h3 className='text-xs font-semibold uppercase tracking-[0.15em] text-slate-400'>Kostnadsbild</h3><div className='mt-3 divide-y divide-slate-200 text-sm'>{[['Två vuxna',route.adultFare*2],['Spädbarn',route.infantFare],['Positionering',route.positioningAdult*2],['Bagage',route.baggage],['Marktransport',route.groundTransport]].map(([label,value]) => <div key={label} className='flex justify-between py-2'><span className='text-slate-500'>{label}</span><strong>{money(value)}</strong></div>)}</div></div>
              <div><h3 className='text-xs font-semibold uppercase tracking-[0.15em] text-slate-400'>Varför denna ranking?</h3><ul className='mt-3 space-y-2 text-sm text-slate-600'>{route.analysis.reasons.map(reason => <li key={reason} className='flex gap-2'><span className='mt-1.5 h-1.5 w-1.5 shrink-0 bg-blue-500'/>{reason}</li>)}</ul></div>
            </div>          </div>}
        </article>)}</section>
      </>}

      {tab === 'profile' && <section className='grid lg:grid-cols-[1fr_320px] gap-6'>
        <div className='border border-slate-200 bg-white text-slate-900 shadow-xl shadow-black/10'>
          <div className='border-b border-slate-200 px-6 py-5'><h2 className='text-xl font-semibold'>Sökprofil</h2><p className='mt-1 text-sm text-slate-500'>Styr vilka rutter som genereras och hur de rankas.</p></div>
          <div className='p-6 space-y-7'>
            <div className='grid md:grid-cols-2 gap-4'><button onClick={() => setAllowOpenJaw(value => !value)} className={`border p-5 text-left transition ${allowOpenJaw ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-400'}`}><div className='flex items-center justify-between'><strong>Tillåt Open Jaw</strong><span className={`h-5 w-9 p-0.5 transition ${allowOpenJaw ? 'bg-blue-600' : 'bg-slate-300'}`}><span className={`block h-4 w-4 bg-white transition ${allowOpenJaw ? 'translate-x-4' : ''}`}/></span></div><p className='mt-3 text-sm leading-5 text-slate-500'>Tokyo ↔ Osaka får +5. Annan Japan Open Jaw får +2. Inget generellt Open Jaw-avdrag.</p></button><button onClick={() => setIncludeEurope(value => !value)} className={`border p-5 text-left transition ${includeEurope ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-400'}`}><div className='flex items-center justify-between'><strong>Alla Europastarter</strong><ShieldCheck size={19} className={includeEurope ? 'text-emerald-600' : 'text-slate-400'}/></div><p className='mt-3 text-sm leading-5 text-slate-500'>Positioneringsflyg från ARN räknas alltid in för två vuxna.</p></button></div>
            <div><div className='mb-4 flex items-center justify-between'><h3 className='font-semibold'>Hårda gränser</h3><span className='text-xs uppercase tracking-wider text-slate-400'>Filter före ranking</span></div><div className='grid sm:grid-cols-3 gap-6'>{[['Max familjepris',maxPrice,setMaxPrice,8000,30000,500,money(maxPrice)],['Max restid per väg',maxJourney,setMaxJourney,10,24,.5,`${maxJourney} h`],['Max transit',maxLayover,setMaxLayover,1,8,.5,`${maxLayover} h`]].map(([label,value,setter,min,max,step,shown]) => <label key={label} className='text-sm text-slate-600'><span className='flex justify-between'><span>{label}</span><strong className='text-slate-900'>{shown}</strong></span><input type='range' min={min} max={max} step={step} value={value} onChange={event => setter(Number(event.target.value))} className='w-full mt-4 accent-blue-600'/></label>)}</div></div>
            <div className='border-t border-slate-200 pt-6'><h3 className='font-semibold'>Destinationprioritet</h3><p className='mt-1 text-sm text-slate-500'>Hög prioritet påverkar ranking men ersätter aldrig pris- och tidsgränser.</p><div className='mt-5 grid md:grid-cols-2 gap-x-8 gap-y-4'>{[['HND','Haneda'],['NRT','Narita'],['KIX','Osaka Kansai'],['ITM','Osaka Itami'],['UKB','Osaka Kobe'],['NGO','Nagoya'],['OKA','Okinawa'],['FUK','Fukuoka']].map(([code,name]) => <div key={code} className='flex items-center justify-between border-b border-slate-100 pb-3'><span className='text-sm'>{name} <span className='text-slate-400'>{code}</span></span><div className='flex gap-1'>{[1,2,3,4,5].map(value => <button key={value} onClick={() => setStars(code,value)} aria-label={`${value} stjärnor`}><Star size={18} className={value <= priority[code] ? 'fill-amber-400 text-amber-400' : 'text-slate-250'}/></button>)}</div></div>)}</div></div>
          </div>
        </div>
        <aside className='border border-white/10 bg-[#0c1728]/85 h-fit shadow-xl shadow-black/10'><div className='border-b border-white/10 px-5 py-4'><h3 className='font-semibold'>Aktiv standard</h3></div><ul className='divide-y divide-white/10 text-sm'>{['HND, NRT, KIX, ITM, UKB och NGO: 5/5','Tokyo–Osaka Open Jaw: +5','Annan Japan Open Jaw: +2','Ingen generell Open Jaw-straff','Full familjekostnad används'].map(item => <li key={item} className='px-5 py-4 flex gap-3 text-slate-300'><span className='text-emerald-400'>✓</span>{item}</li>)}</ul></aside>
      </section>}

    {tab === 'engine' && <section className='border border-slate-200 bg-white text-slate-900 shadow-xl shadow-black/10'><div className='border-b border-slate-200 px-6 py-5'><div className='flex items-center gap-3'><div className='h-9 w-9 bg-slate-900 text-white flex items-center justify-center'><Sparkles size={18}/></div><div><h2 className='text-xl font-semibold'>Metod och ranking</h2><p className='text-sm text-slate-500'>Så omvandlas råa rutter till en jämförbar familjeresa.</p></div></div></div><div className='grid md:grid-cols-3 lg:grid-cols-6 divide-x divide-y lg:divide-y-0 divide-slate-200'>{[['01','Generera','Primär- och Europastart'],['02','Kombinera','Tur/retur och Open Jaw'],['03','Normalisera','Vuxna, infant och bagage'],['04','Riskbedöm','Skyddad eller separat'],['05','Vikta','Destination och upplägg'],['06','Ranka','Score och effektiv kostnad']].map(([n,title,text]) => <div key={n} className='p-5'><div className='text-xs font-semibold tracking-[0.18em] text-red-600'>{n}</div><strong className='block mt-3'>{title}</strong><span className='block mt-1 text-xs leading-5 text-slate-500'>{text}</span></div>)}</div><div className='border-t border-slate-200 bg-slate-50 p-6 grid md:grid-cols-[1fr_auto] gap-5 items-center'><div><h3 className='font-semibold'>Effektiv kostnad</h3><p className='mt-1 text-sm leading-6 text-slate-600'>Tokyo–Osaka Open Jaw får en intern nyttovärdering på 1 000 kr vid sortering. Den faktiska familjetotalen ändras aldrig.</p></div><div className='flex items-center gap-3 border-l border-slate-300 pl-5'><TrendingDown size={22} className='text-emerald-600'/><div><div className='text-xs uppercase tracking-wider text-slate-400'>Prioriterat upplägg</div><strong>Tokyo ↔ Osaka</strong></div></div></div></section>}
    </main>
  </div>;
}
