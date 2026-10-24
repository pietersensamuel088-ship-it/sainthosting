import React, { useRef } from 'react';
import { useCluster } from '../context/ClusterContext';
import { useAuth } from '../context/AuthContext';
import { TelemetryGrid } from '../components/TelemetryGrid';
import { CapacityAlert } from '../components/CapacityAlert';
import { Sparkles, GitBranch, ShieldCheck, ArrowRight, CheckCircle2, Bot, Layers, CheckSquare } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

interface NodeStatusHubProps {
  onNavigate: (tab: 'status' | 'pipeline' | 'blueprint' | 'gatekeeper' | 'mybots' | 'admin') => void;
}

export const NodeStatusHub: React.FC<NodeStatusHubProps> = ({ onNavigate }) => {
  const { cluster } = useCluster();
  const { requireAuth } = useAuth();

  const containerRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const statusSectionRef = useRef<HTMLElement>(null);
  const philosophySectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      if (badgeRef.current) {
        tl.fromTo(
          badgeRef.current,
          { opacity: 0, y: -12 },
          { opacity: 1, y: 0, duration: 0.6, clearProps: 'transform,opacity' }
        );
      }

      if (titleRef.current) {
        tl.fromTo(
          titleRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8, clearProps: 'transform,opacity' },
          '-=0.3'
        );
      }

      if (descRef.current) {
        tl.fromTo(
          descRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.7, clearProps: 'transform,opacity' },
          '-=0.4'
        );
      }

      if (cardsRef.current) {
        const cards = Array.from(cardsRef.current.children);
        tl.fromTo(
          cards,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.12,
            clearProps: 'transform,opacity',
          },
          '-=0.3'
        );
      }

      if (statusSectionRef.current) {
        gsap.fromTo(
          statusSectionRef.current,
          { opacity: 0, y: 35 },
          {
            scrollTrigger: {
              trigger: statusSectionRef.current,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
            opacity: 1,
            y: 0,
            duration: 0.8,
            clearProps: 'transform,opacity',
          }
        );
      }

      if (philosophySectionRef.current) {
        gsap.fromTo(
          philosophySectionRef.current,
          { opacity: 0, y: 30 },
          {
            scrollTrigger: {
              trigger: philosophySectionRef.current,
              start: 'top 88%',
              toggleActions: 'play none none none',
            },
            opacity: 1,
            y: 0,
            duration: 0.8,
            clearProps: 'transform,opacity',
          }
        );
      }
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="space-y-12 font-mono">
      {/* Hero Section */}
      <section className="pt-6 pb-2 text-center max-w-3xl mx-auto space-y-4">
        <div
          ref={badgeRef}
          className="inline-flex items-center space-x-2 px-3 py-1 bg-charcoal-900 border border-zinc-800 text-xs text-zinc-400"
        >
          <span className="w-2 h-2 bg-crimson-bright rounded-full"></span>
          <span>SAINT HOSTING</span>
          <span className="text-zinc-600">•</span>
          <span className="text-white font-semibold">Always Online</span>
        </div>

        <h1
          ref={titleRef}
          className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase leading-tight"
        >
          EFFORTLESS BOT HOSTING <span className="text-crimson-bright">&</span> CREATION
        </h1>

        <p
          ref={descRef}
          className="text-sm sm:text-base text-zinc-300 leading-relaxed"
        >
          Run your bots 24/7 without surprise fees or sleep timeouts. Need a bot built from scratch? 
          We'll write the logic. Already have code? We'll host it immediately.
        </p>
      </section>

      {/* Main 3 Gateway Cards */}
      <section ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Request a New Bot */}
        <div
          onClick={() => requireAuth(() => onNavigate('blueprint'))}
          className="group cursor-pointer bg-charcoal-900 border border-zinc-800 hover:border-crimson-bright p-6 transition-all duration-200 flex flex-col justify-between hover:shadow-crimson-glow"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-pitch border border-zinc-800 group-hover:border-crimson-bright flex items-center justify-center transition-colors">
                <Sparkles className="w-5 h-5 text-crimson-bright" />
              </div>
              <span className="text-[10px] uppercase px-2 py-0.5 bg-zinc-800 text-zinc-300 group-hover:bg-crimson-bright group-hover:text-pitch font-bold transition-colors">
                CREATE BOT
              </span>
            </div>

            <h2 className="text-lg font-bold text-white mb-2 group-hover:text-crimson-bright transition-colors">
              1. Build a Custom Bot
            </h2>

            <p className="text-xs text-zinc-400 leading-relaxed mb-6">
              Pick your presence (Do Not Disturb, Online), embed colors, and slash commands. Saint writes the logic and harnesses it for you.
            </p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              requireAuth(() => onNavigate('blueprint'));
            }}
            className="w-full py-2.5 px-4 bg-charcoal-950 border border-zinc-800 text-white text-xs font-bold uppercase group-hover:bg-crimson-bright group-hover:border-white transition-all flex items-center justify-center space-x-2"
          >
            <span>BUILD MY BOT</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: Request Hosting for Existing Bot */}
        <div
          onClick={() => requireAuth(() => onNavigate('pipeline'))}
          className="group cursor-pointer bg-charcoal-900 border border-zinc-800 hover:border-crimson-bright p-6 transition-all duration-200 flex flex-col justify-between hover:shadow-crimson-glow"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-pitch border border-zinc-800 group-hover:border-crimson-bright flex items-center justify-center transition-colors">
                <GitBranch className="w-5 h-5 text-crimson-bright" />
              </div>
              <span className="text-[10px] uppercase px-2 py-0.5 bg-zinc-800 text-zinc-300 group-hover:bg-crimson-bright group-hover:text-pitch font-bold transition-colors">
                HOST CODE
              </span>
            </div>

            <h2 className="text-lg font-bold text-white mb-2 group-hover:text-crimson-bright transition-colors">
              2. Host an Existing Bot
            </h2>

            <p className="text-xs text-zinc-400 leading-relaxed mb-6">
              Already have a public GitHub repo? Paste your link and we'll spin it up in an isolated Docker container with 24/7 uptime.
            </p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              requireAuth(() => onNavigate('pipeline'));
            }}
            className="w-full py-2.5 px-4 bg-charcoal-950 border border-zinc-800 text-white text-xs font-bold uppercase group-hover:bg-crimson-bright group-hover:border-white transition-all flex items-center justify-center space-x-2"
          >
            <span>HOST MY REPOSITORY</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 3: Gatekeeper / Help */}
        <div
          onClick={() => onNavigate('gatekeeper')}
          className="group cursor-pointer bg-charcoal-900 border border-zinc-800 hover:border-zinc-600 p-6 transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-pitch border border-zinc-800 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-zinc-300" />
              </div>
              <span className="text-[10px] uppercase px-2 py-0.5 bg-zinc-800 text-zinc-400 font-bold">
                SUPPORT & FAQ
              </span>
            </div>

            <h2 className="text-lg font-bold text-white mb-2">
              3. Help & Contact
            </h2>

            <p className="text-xs text-zinc-400 leading-relaxed mb-6">
              Quick pre-flight check for tokens and environment variables, plus direct messaging to connect with Saint.
            </p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('gatekeeper');
            }}
            className="w-full py-2.5 px-4 bg-charcoal-950 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-bold uppercase hover:border-zinc-500 transition-all flex items-center justify-center space-x-2"
          >
            <span>GET HELP / CONTACT</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* Critical Capacity Alert */}
      <CapacityAlert />

      {/* Real Live Host Status */}
      <section ref={statusSectionRef} className="pt-4 border-t border-zinc-900">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-crimson-bright"></span>
            <h3 className="text-sm font-bold text-white tracking-widest uppercase">
              LIVE HOST STATUS & CONTAINER ALLOCATION
            </h3>
          </div>
          <div className="text-xs text-zinc-500">
            {cluster?.activeBotsCount === 0 ? '0 active bots • Real state active' : `${cluster?.activeBotsCount} bots online`}
          </div>
        </div>

        <TelemetryGrid />
      </section>

      {/* Transparent Info Banner */}
      <section
        ref={philosophySectionRef}
        className="bg-charcoal-900 border border-zinc-800 p-6 text-xs text-zinc-400 leading-relaxed space-y-2"
      >
        <div className="text-white font-bold uppercase tracking-wider text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-crimson-bright" />
          <span>HOW SAINT HOSTING WORKS</span>
        </div>
        <p>
          Each bot runs in a dedicated lightweight Docker container inside a Proxmox virtual environment. 
          Containers are capped at 5 bots each to guarantee dedicated CPU slices and memory without noisy neighbors.
        </p>
      </section>
    </div>
  );
};
