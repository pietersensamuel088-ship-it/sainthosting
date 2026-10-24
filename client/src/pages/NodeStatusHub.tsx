import React, { useRef } from 'react';
import { useCluster } from '../context/ClusterContext';
import { TelemetryGrid } from '../components/TelemetryGrid';
import { CapacityAlert } from '../components/CapacityAlert';
import { Sparkles, GitBranch, ShieldCheck, ArrowRight, Server, CheckCircle, HelpCircle } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

interface NodeStatusHubProps {
  onNavigate: (tab: 'status' | 'pipeline' | 'blueprint' | 'gatekeeper' | 'admin') => void;
}

export const NodeStatusHub: React.FC<NodeStatusHubProps> = ({ onNavigate }) => {
  const { cluster } = useCluster();

  const containerRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const missionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const statusSectionRef = useRef<HTMLElement>(null);
  const philosophySectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // 1. Page Introduction (On-Load Reveal Timeline)
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

      tl.from(badgeRef.current, {
        y: -18,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      })
        .from(
          titleRef.current,
          {
            y: 45,
            opacity: 0,
            duration: 1.1,
            ease: 'power4.out',
          },
          '-=0.5'
        )
        .from(
          descRef.current,
          {
            y: 25,
            opacity: 0,
            duration: 0.9,
            ease: 'power3.out',
          },
          '-=0.7'
        )
        .from(
          missionRef.current,
          {
            y: 15,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out',
          },
          '-=0.6'
        );

      // Staggered reveal for action gateway cards
      if (cardsRef.current) {
        const cards = cardsRef.current.children;
        tl.from(
          cards,
          {
            y: 40,
            opacity: 0,
            duration: 0.9,
            stagger: 0.12,
            ease: 'power4.out',
          },
          '-=0.5'
        );
      }

      // 2. Page Scrolling (ScrollTrigger-Driven Transitions)
      if (statusSectionRef.current) {
        gsap.from(statusSectionRef.current, {
          scrollTrigger: {
            trigger: statusSectionRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
          y: 45,
          opacity: 0,
          duration: 1,
          ease: 'power3.out',
        });
      }

      if (philosophySectionRef.current) {
        gsap.from(philosophySectionRef.current, {
          scrollTrigger: {
            trigger: philosophySectionRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
          y: 35,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
        });
      }
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="space-y-12">
      {/* Clean, Refined Hero Section with GSAP Reveal Targets */}
      <section className="pt-6 pb-2 text-center max-w-4xl mx-auto space-y-4">
        <div
          ref={badgeRef}
          className="inline-flex items-center space-x-2 px-3 py-1 bg-charcoal-900 border border-zinc-800 text-xs font-mono text-zinc-400"
        >
          <span className="w-2 h-2 bg-crimson-bright rounded-full"></span>
          <span>SAINT HOSTING // COLD STEEL CLUSTER</span>
          <span className="text-zinc-600">•</span>
          <span className="text-white">sa1nt.xyz</span>
        </div>

        <h1
          ref={titleRef}
          className="text-3xl sm:text-5xl font-black font-mono tracking-tight text-white uppercase overflow-hidden"
        >
          COMMUNITY BOT HOSTING <span className="text-crimson-bright">&</span> ARCHITECTURE
        </h1>

        <p
          ref={descRef}
          className="text-sm sm:text-base text-zinc-300 font-mono max-w-2xl mx-auto leading-relaxed"
        >
          High-performance, isolated container hosting for your Discord and automation bots.
          No sleep timeouts, no credit paywalls, and no fake statistics.
        </p>

        <div ref={missionRef} className="pt-2 text-xs font-mono text-zinc-400">
          <span className="text-crimson-bright font-bold">Mission: </span>
          Hosting your bots is the primary infrastructure engine; creating them with AI is a side gig.
        </div>
      </section>

      {/* Primary Action Gateways (Staggered Intro) */}
      <section ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gateway 1: Request a Bot */}
        <div
          onClick={() => onNavigate('blueprint')}
          className="group cursor-pointer bg-charcoal-900 border border-zinc-800 hover:border-crimson-bright p-6 transition-all duration-200 flex flex-col justify-between hover:shadow-crimson-glow"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-pitch border border-zinc-800 group-hover:border-crimson-bright flex items-center justify-center transition-colors">
                <Sparkles className="w-5 h-5 text-crimson-bright" />
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-zinc-800 text-zinc-300 group-hover:bg-crimson-bright group-hover:text-pitch font-bold transition-colors">
                CREATE FROM SCRATCH
              </span>
            </div>

            <h2 className="text-lg font-bold font-mono text-white mb-2 group-hover:text-crimson-bright transition-colors">
              01 // Request a Bot
            </h2>

            <p className="text-xs text-zinc-400 font-mono leading-relaxed mb-6">
              Don't have code written yet? Describe what you want your bot to do and define its slash commands. 
              Saint will architect and compile the complete bot blueprint for you.
            </p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('blueprint');
            }}
            className="w-full py-2.5 px-4 bg-charcoal-950 border border-zinc-800 text-white font-mono text-xs font-bold uppercase group-hover:bg-crimson-bright group-hover:border-white transition-all flex items-center justify-center space-x-2"
          >
            <span>BUILD BOT BLUEPRINT</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Gateway 2: Request Hosting for Existing Bot */}
        <div
          onClick={() => onNavigate('pipeline')}
          className="group cursor-pointer bg-charcoal-900 border border-zinc-800 hover:border-crimson-bright p-6 transition-all duration-200 flex flex-col justify-between hover:shadow-crimson-glow"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-pitch border border-zinc-800 group-hover:border-crimson-bright flex items-center justify-center transition-colors">
                <GitBranch className="w-5 h-5 text-crimson-bright" />
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-zinc-800 text-zinc-300 group-hover:bg-crimson-bright group-hover:text-pitch font-bold transition-colors">
                DEPLOY CODE
              </span>
            </div>

            <h2 className="text-lg font-bold font-mono text-white mb-2 group-hover:text-crimson-bright transition-colors">
              02 // Request Hosting
            </h2>

            <p className="text-xs text-zinc-400 font-mono leading-relaxed mb-6">
              Already have a repository? Submit your public GitHub link. The cluster isolates your code in a dedicated 
              cgroup container with 24/7 uptime and zero sleep cycles.
            </p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('pipeline');
            }}
            className="w-full py-2.5 px-4 bg-charcoal-950 border border-zinc-800 text-white font-mono text-xs font-bold uppercase group-hover:bg-crimson-bright group-hover:border-white transition-all flex items-center justify-center space-x-2"
          >
            <span>HOST YOUR REPO</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Gateway 3: Gatekeeper & Intake */}
        <div
          onClick={() => onNavigate('gatekeeper')}
          className="group cursor-pointer bg-charcoal-900 border border-zinc-800 hover:border-zinc-700 p-6 transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-pitch border border-zinc-800 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-zinc-300" />
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-zinc-800 text-zinc-400 font-bold">
                DIAGNOSTIC & CONTACT
              </span>
            </div>

            <h2 className="text-lg font-bold font-mono text-white mb-2">
              03 // Intake Node
            </h2>

            <p className="text-xs text-zinc-400 font-mono leading-relaxed mb-6">
              Run the pre-flight checklist to verify your tokens and entrypoint, send direct encrypted questions, or upload a configuration file.
            </p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('gatekeeper');
            }}
            className="w-full py-2.5 px-4 bg-charcoal-950 border border-zinc-800 text-zinc-300 hover:text-white font-mono text-xs font-bold uppercase hover:border-zinc-600 transition-all flex items-center justify-center space-x-2"
          >
            <span>OPEN INTAKE NODE</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* Critical Capacity Alert */}
      <CapacityAlert />

      {/* Real Infrastructure Status with ScrollTrigger */}
      <section ref={statusSectionRef} className="pt-4 border-t border-zinc-900">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-crimson-bright"></span>
            <h3 className="text-sm font-bold text-white font-mono tracking-widest uppercase">
              REAL HOST STATUS & CONTAINER ALLOCATION
            </h3>
          </div>
          <div className="text-xs text-zinc-500 font-mono">
            {cluster?.activeBotsCount === 0 ? 'No fake bots • Real state active' : `${cluster?.activeBotsCount} real bots deployed`}
          </div>
        </div>

        <TelemetryGrid />
      </section>

      {/* Clean Transparent Philosophy with ScrollTrigger */}
      <section
        ref={philosophySectionRef}
        className="bg-charcoal-900 border border-zinc-800 p-6 font-mono text-xs text-zinc-400 leading-relaxed space-y-3"
      >
        <div className="text-white font-bold uppercase tracking-wider text-sm flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-crimson-bright" />
          <span>REAL HOSTING STANDARDS</span>
        </div>
        <p>
          Unlike generic commercial hosts, Saint does not use fake metrics, fake sleep intervals, or artificial resource throttle gates. 
          Each bot runs in a dedicated lightweight Docker sandbox inside a Proxmox virtual environment with a hard cap of 5 bots per container node.
        </p>
        <p className="text-zinc-500 text-[11px]">
          Proxmox hypervisor integration parameters can be plugged directly into <code className="text-zinc-300">.env</code> to stream real-time cluster telemetry from your PVE nodes.
        </p>
      </section>
    </div>
  );
};
