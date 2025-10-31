'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Search,
  ShieldCheck,
  Bell,
  CreditCard,
  CheckCircle,
  Mail,
  FileText,
  BarChart3,
  Calendar,
  Plane,
  Home,
  Users,
  Map
} from 'lucide-react';

export default function FlowVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const container = containerRef.current;
    canvas.width = 1600;
    canvas.height = 500;

    // Define node positions
    const centerY = canvas.height / 2;
    const row1Y = centerY - 80;
    const row2Y = centerY + 80;

    const nodes = [
      { x: 400, y: row1Y },      // 0 - Employee
      { x: 580, y: row1Y },      // 1 - Search
      { x: 800, y: row1Y },      // 2 - Policy Check
      { x: 1000, y: row1Y },     // 3 - Approval
      { x: 1220, y: row1Y },     // 4 - Payment
      { x: 1420, y: row1Y },     // 5 - Booked
      { x: 1420, y: row2Y },     // 6 - Confirmation
      { x: 1200, y: row2Y },     // 7 - Invoice
      { x: 980, y: row2Y },      // 8 - Expense Report
      { x: 760, y: row2Y },      // 9 - Budget
      { x: 540, y: row2Y },      // 10 - Sync
    ];

    // Define connections
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5],
      [5, 6], [6, 7], [7, 8], [8, 9], [9, 10]
    ];

    // Draw curved paths
    const drawPath = (from: number, to: number, progress: number) => {
      const start = nodes[from];
      const end = nodes[to];

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';

      // Calculate control points for curve
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      const offsetY = Math.abs(end.y - start.y) > 50 ? 40 : 0;

      // Draw the full path
      ctx.moveTo(start.x, start.y);
      ctx.quadraticCurveTo(midX, midY - offsetY, end.x, end.y);
      ctx.stroke();

      // Draw animated progress line with lime green
      if (progress > 0) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(173, 248, 2, 0.6)';
        ctx.lineWidth = 4;

        // Calculate the point at progress
        const t = Math.min(progress, 1);
        const x = start.x + (midX - start.x) * 2 * t * (1 - t) + (end.x - start.x) * t * t;
        const y = start.y + (midY - offsetY - start.y) * 2 * t * (1 - t) + (end.y - start.y) * t * t;

        ctx.moveTo(start.x, start.y);
        ctx.quadraticCurveTo(
          start.x + (midX - start.x) * progress,
          start.y + (midY - offsetY - start.y) * progress,
          x,
          y
        );
        ctx.stroke();
      }
    };

    // Particle class for floating background particles
    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 3 + 1;

        const isGreen = Math.random() > 0.7;
        this.color = isGreen
          ? `rgba(173, 248, 2, ${0.6 + Math.random() * 0.3})`
          : `rgba(0, 0, 0, ${0.6 + Math.random() * 0.3})`;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }

    // Create particles
    const particles: Particle[] = [];
    for (let i = 0; i < 30; i++) {
      particles.push(new Particle());
    }

    // Animation state
    let animationProgress = 0;
    let currentConnection = 0;
    const animationSpeed = 0.015;

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw and update particles
      particles.forEach(particle => {
        particle.update();
        particle.draw(ctx);
      });

      // Draw all connection paths (background)
      connections.forEach(([from, to]) => {
        drawPath(from, to, 0);
      });

      // Draw animated connections up to current
      for (let i = 0; i <= currentConnection; i++) {
        const [from, to] = connections[i];
        const progress = i === currentConnection ? animationProgress : 1;
        drawPath(from, to, progress);
      }

      // Update animation progress
      animationProgress += animationSpeed;

      if (animationProgress >= 1) {
        animationProgress = 0;
        currentConnection++;

        if (currentConnection >= connections.length) {
          // Loop back to start
          setTimeout(() => {
            currentConnection = 0;
          }, 2000);
        }
      }

      requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <section className="w-full relative py-12 sm:py-16 lg:py-20 overflow-hidden bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-gray-100 to-gray-100 rounded-full text-xs sm:text-sm font-semibold text-gray-700 mb-4 sm:mb-6 animate-bounce">
            <Plane className="w-3 h-3 sm:w-4 sm:h-4" />
            How It Works
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
            From Request to Booking in Minutes
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Watch how bvodo automates your entire corporate travel workflow
          </p>
        </div>

        {/* Flow Visualization */}
        <div ref={containerRef} className="relative bg-white rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-8 overflow-x-auto">
          {/* Phase Labels */}
          <div className="absolute top-8 left-0 w-full pointer-events-none z-20">
            <div className="relative max-w-[1600px] mx-auto">
              <div className="absolute" style={{ left: '350px', top: '-20px' }}>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200" style={{ textShadow: '0 1px 2px rgba(173, 248, 2, 0.2)' }}>
                  Request
                </span>
              </div>
              <div className="absolute" style={{ left: '750px', top: '-20px' }}>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200" style={{ textShadow: '0 1px 2px rgba(173, 248, 2, 0.2)' }}>
                  Approval
                </span>
              </div>
              <div className="absolute" style={{ left: '1170px', top: '-20px' }}>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200" style={{ textShadow: '0 1px 2px rgba(173, 248, 2, 0.2)' }}>
                  Booking
                </span>
              </div>
              <div className="absolute" style={{ left: '750px', top: '290px' }}>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200" style={{ textShadow: '0 1px 2px rgba(173, 248, 2, 0.2)' }}>
                  Completion
                </span>
              </div>
            </div>
          </div>

          {/* Canvas */}
          <canvas ref={canvasRef} className="w-full h-auto" style={{ maxWidth: '1600px', margin: '0 auto' }} />

          {/* Phone Mockup */}
          <div className="absolute top-1/2 -translate-y-1/2 phone-mockup z-30" style={{ left: '100px' }}>
            <div className="w-[200px] h-[400px] bg-gradient-to-b from-black to-gray-900 rounded-[32px] shadow-2xl border-8 border-gray-900 relative overflow-hidden">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-b-2xl z-20"></div>

              {/* Status Bar */}
              <div className="absolute top-2 left-0 right-0 px-6 flex justify-between items-center text-white text-xs z-10">
                <span className="font-semibold">9:41</span>
                <div className="flex gap-1 items-center">
                  <div className="w-4 h-3 border border-white rounded-sm"></div>
                  <div className="w-1 h-1 bg-white rounded-full"></div>
                </div>
              </div>

              {/* Phone Content */}
              <div className="absolute top-10 left-0 right-0 bottom-0 bg-white rounded-t-3xl overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                      <Plane className="w-4 h-4 text-[#ADF802]" strokeWidth={3} />
                    </div>
                    <span className="font-bold text-sm">bvodo</span>
                  </div>
                  <Bell className="w-4 h-4 text-gray-400" />
                </div>

                {/* Scrolling Content */}
                <div className="phone-content-wrapper px-4 py-3 space-y-2">
                  <div className="phone-feature bg-gray-50 rounded-xl p-3 border border-gray-200 transition-all hover:border-[#ADF802]">
                    <div className="flex items-center gap-2 mb-1">
                      <Plane className="w-4 h-4 text-gray-700" />
                      <span className="text-xs font-semibold text-gray-900">Book Flights</span>
                    </div>
                    <p className="text-[10px] text-gray-500">Lagos → London</p>
                  </div>

                  <div className="phone-feature bg-gray-50 rounded-xl p-3 border border-gray-200 transition-all hover:border-[#ADF802]">
                    <div className="flex items-center gap-2 mb-1">
                      <Home className="w-4 h-4 text-gray-700" />
                      <span className="text-xs font-semibold text-gray-900">Find Hotels</span>
                    </div>
                    <p className="text-[10px] text-gray-500">Best rates guaranteed</p>
                  </div>

                  <div className="phone-feature bg-gray-50 rounded-xl p-3 border border-gray-200 transition-all hover:border-[#ADF802]">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-gray-700" />
                      <span className="text-xs font-semibold text-gray-900">Team Travel</span>
                    </div>
                    <p className="text-[10px] text-gray-500">Group bookings made easy</p>
                  </div>

                  <div className="phone-feature bg-gray-50 rounded-xl p-3 border border-gray-200 transition-all hover:border-[#ADF802]">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-gray-700" />
                      <span className="text-xs font-semibold text-gray-900">Reports</span>
                    </div>
                    <p className="text-[10px] text-gray-500">Auto-generated invoices</p>
                  </div>

                  <div className="phone-feature bg-gray-50 rounded-xl p-3 border border-gray-200 transition-all hover:border-[#ADF802]">
                    <div className="flex items-center gap-2 mb-1">
                      <BarChart3 className="w-4 h-4 text-gray-700" />
                      <span className="text-xs font-semibold text-gray-900">Analytics</span>
                    </div>
                    <p className="text-[10px] text-gray-500">Track spending in real-time</p>
                  </div>

                  <button className="w-full bg-black text-white rounded-xl py-2.5 text-xs font-semibold hover:bg-[#ADF802] hover:text-black transition-all">
                    Book Your Trip Now
                  </button>
                </div>

                {/* Bottom Nav */}
                <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-2 flex justify-between items-center">
                  <Home className="w-5 h-5 text-[#ADF802]" strokeWidth={2.5} />
                  <Search className="w-5 h-5 text-gray-400" strokeWidth={2} />
                  <Calendar className="w-5 h-5 text-gray-400" strokeWidth={2} />
                  <Users className="w-5 h-5 text-gray-400" strokeWidth={2} />
                </div>
              </div>
            </div>
          </div>

          {/* Flow Nodes */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="relative max-w-[1600px] h-[500px] mx-auto">
              {/* Node 0 - Employee */}
              <div className="node absolute" style={{ left: '320px', top: '50%', transform: 'translateY(-130px)' }}>
                <div className="node-card group bg-white border-2 border-black rounded-2xl shadow-lg p-4 h-[140px] flex flex-col items-center justify-center relative overflow-hidden transition-all hover:scale-105 hover:shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ADF802] to-transparent opacity-0 group-hover:opacity-[0.08] transition-opacity"></div>
                  <img src="https://i.pravatar.cc/150?img=68" alt="Employee" className="w-12 h-12 rounded-full mb-2 border-2 border-gray-200" />
                  <div className="text-center relative z-10">
                    <div className="text-sm font-bold text-gray-900">Employee</div>
                    <div className="text-xs text-gray-600 mt-1">Chioma requests</div>
                  </div>
                </div>
              </div>

              {/* Node 1 - Search */}
              <div className="node absolute" style={{ left: '500px', top: '50%', transform: 'translateY(-130px)' }}>
                <div className="node-card group bg-white border-2 border-black rounded-2xl shadow-lg p-4 h-[140px] flex flex-col items-center justify-center relative overflow-hidden transition-all hover:scale-105 hover:shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ADF802] to-transparent opacity-0 group-hover:opacity-[0.08] transition-opacity"></div>
                  <Search className="w-8 h-8 text-gray-700 mb-2" strokeWidth={2.5} />
                  <div className="text-center relative z-10">
                    <div className="text-sm font-bold text-gray-900">Search</div>
                    <div className="text-xs text-gray-600 mt-1">Find best flights</div>
                  </div>
                </div>
              </div>

              {/* Node 2 - Policy Check */}
              <div className="node absolute" style={{ left: '720px', top: '50%', transform: 'translateY(-130px)' }}>
                <div className="node-card group bg-white border-2 border-black rounded-2xl shadow-lg p-4 h-[140px] flex flex-col items-center justify-center relative overflow-hidden transition-all hover:scale-105 hover:shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ADF802] to-transparent opacity-0 group-hover:opacity-[0.08] transition-opacity"></div>
                  <ShieldCheck className="w-8 h-8 text-gray-700 mb-2" strokeWidth={2.5} />
                  <div className="text-center relative z-10">
                    <div className="text-sm font-bold text-gray-900">Policy Check</div>
                    <div className="text-xs text-gray-600 mt-1">Auto-validate</div>
                  </div>
                </div>
              </div>

              {/* Node 3 - Approval */}
              <div className="node absolute" style={{ left: '920px', top: '50%', transform: 'translateY(-130px)' }}>
                <div className="node-card group bg-white border-2 border-black rounded-2xl shadow-lg p-4 h-[140px] flex flex-col items-center justify-center relative overflow-hidden transition-all hover:scale-105 hover:shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ADF802] to-transparent opacity-0 group-hover:opacity-[0.08] transition-opacity"></div>
                  <img src="https://i.pravatar.cc/150?img=12" alt="Manager" className="w-12 h-12 rounded-full mb-2 border-2 border-gray-200" />
                  <div className="text-center relative z-10">
                    <div className="text-sm font-bold text-gray-900">Approval</div>
                    <div className="text-xs text-gray-600 mt-1">Manager reviews</div>
                  </div>
                </div>
              </div>

              {/* Node 4 - Payment */}
              <div className="node absolute" style={{ left: '1140px', top: '50%', transform: 'translateY(-130px)' }}>
                <div className="node-card group bg-white border-2 border-black rounded-2xl shadow-lg p-4 h-[140px] flex flex-col items-center justify-center relative overflow-hidden transition-all hover:scale-105 hover:shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ADF802] to-transparent opacity-0 group-hover:opacity-[0.08] transition-opacity"></div>
                  <CreditCard className="w-8 h-8 text-gray-700 mb-2" strokeWidth={2.5} />
                  <div className="text-center relative z-10">
                    <div className="text-sm font-bold text-gray-900">Payment</div>
                    <div className="text-xs text-gray-600 mt-1">Auto-charge card</div>
                  </div>
                </div>
              </div>

              {/* Node 5 - Booked */}
              <div className="node absolute" style={{ left: '1340px', top: '50%', transform: 'translateY(-130px)' }}>
                <div className="node-card group bg-white border-2 border-black rounded-2xl shadow-lg p-4 h-[140px] flex flex-col items-center justify-center relative overflow-hidden transition-all hover:scale-105 hover:shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ADF802] to-transparent opacity-0 group-hover:opacity-[0.08] transition-opacity"></div>
                  <CheckCircle className="w-8 h-8 text-gray-700 mb-2" strokeWidth={2.5} />
                  <div className="text-center relative z-10">
                    <div className="text-sm font-bold text-gray-900">Booked</div>
                    <div className="text-xs text-gray-600 mt-1">Ticket issued</div>
                  </div>
                </div>
              </div>

              {/* Node 6 - Confirmation */}
              <div className="node absolute" style={{ left: '1340px', top: '50%', transform: 'translateY(30px)' }}>
                <div className="node-card group bg-white border-2 border-black rounded-2xl shadow-lg p-4 h-[140px] flex flex-col items-center justify-center relative overflow-hidden transition-all hover:scale-105 hover:shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ADF802] to-transparent opacity-0 group-hover:opacity-[0.08] transition-opacity"></div>
                  <Mail className="w-8 h-8 text-gray-700 mb-2" strokeWidth={2.5} />
                  <div className="text-center relative z-10">
                    <div className="text-sm font-bold text-gray-900">Confirmation</div>
                    <div className="text-xs text-gray-600 mt-1">Email sent</div>
                  </div>
                </div>
              </div>

              {/* Node 7 - Invoice */}
              <div className="node absolute" style={{ left: '1120px', top: '50%', transform: 'translateY(30px)' }}>
                <div className="node-card group bg-white border-2 border-black rounded-2xl shadow-lg p-4 h-[140px] flex flex-col items-center justify-center relative overflow-hidden transition-all hover:scale-105 hover:shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ADF802] to-transparent opacity-0 group-hover:opacity-[0.08] transition-opacity"></div>
                  <FileText className="w-8 h-8 text-gray-700 mb-2" strokeWidth={2.5} />
                  <div className="text-center relative z-10">
                    <div className="text-sm font-bold text-gray-900">Invoice</div>
                    <div className="text-xs text-gray-600 mt-1">Auto-generated</div>
                  </div>
                </div>
              </div>

              {/* Node 8 - Expense Report */}
              <div className="node absolute" style={{ left: '900px', top: '50%', transform: 'translateY(30px)' }}>
                <div className="node-card group bg-white border-2 border-black rounded-2xl shadow-lg p-4 h-[140px] flex flex-col items-center justify-center relative overflow-hidden transition-all hover:scale-105 hover:shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ADF802] to-transparent opacity-0 group-hover:opacity-[0.08] transition-opacity"></div>
                  <BarChart3 className="w-8 h-8 text-gray-700 mb-2" strokeWidth={2.5} />
                  <div className="text-center relative z-10">
                    <div className="text-sm font-bold text-gray-900">Expense</div>
                    <div className="text-xs text-gray-600 mt-1">Report filed</div>
                  </div>
                </div>
              </div>

              {/* Node 9 - Budget */}
              <div className="node absolute" style={{ left: '680px', top: '50%', transform: 'translateY(30px)' }}>
                <div className="node-card group bg-white border-2 border-black rounded-2xl shadow-lg p-4 h-[140px] flex flex-col items-center justify-center relative overflow-hidden transition-all hover:scale-105 hover:shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ADF802] to-transparent opacity-0 group-hover:opacity-[0.08] transition-opacity"></div>
                  <BarChart3 className="w-8 h-8 text-gray-700 mb-2" strokeWidth={2.5} />
                  <div className="text-center relative z-10">
                    <div className="text-sm font-bold text-gray-900">Budget</div>
                    <div className="text-xs text-gray-600 mt-1">Tracked</div>
                  </div>
                </div>
              </div>

              {/* Node 10 - Sync */}
              <div className="node absolute" style={{ left: '460px', top: '50%', transform: 'translateY(30px)' }}>
                <div className="node-card group bg-white border-2 border-black rounded-2xl shadow-lg p-4 h-[140px] flex flex-col items-center justify-center relative overflow-hidden transition-all hover:scale-105 hover:shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ADF802] to-transparent opacity-0 group-hover:opacity-[0.08] transition-opacity"></div>
                  <Calendar className="w-8 h-8 text-gray-700 mb-2" strokeWidth={2.5} />
                  <div className="text-center relative z-10">
                    <div className="text-sm font-bold text-gray-900">Sync</div>
                    <div className="text-xs text-gray-600 mt-1">Calendar updated</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
          {[
            { icon: <Plane className="w-6 h-6" />, number: '15 mins', label: 'Average Booking Time' },
            { icon: <BarChart3 className="w-6 h-6" />, number: '30%', label: 'Cost Savings' },
            { icon: <CheckCircle className="w-6 h-6" />, number: '100%', label: 'Policy Compliance' },
            { icon: <Map className="w-6 h-6" />, number: 'Zero', label: 'Manual Data Entry' },
          ].map((stat, index) => (
            <div key={index} className="text-center group hover:scale-110 transition-transform duration-300 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex justify-center mb-3 text-gray-700">
                {stat.icon}
              </div>
              <div className="text-2xl sm:text-3xl font-bold bg-gray-900 bg-clip-text text-transparent mb-2">
                {stat.number}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .phone-content-wrapper {
          animation: autoScroll 8s ease-in-out infinite;
        }

        @keyframes autoScroll {
          0%, 20% { transform: translateY(0); }
          45%, 55% { transform: translateY(-60%); }
          80%, 100% { transform: translateY(0); }
        }

        .phone-mockup {
          animation: phoneAppear 1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          animation-delay: 300ms;
          opacity: 0;
        }

        @keyframes phoneAppear {
          from {
            opacity: 0;
            transform: translateY(-50%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(-50%) scale(1);
          }
        }

        .node {
          animation: nodeAppear 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          opacity: 0;
        }

        .node:nth-child(1) { animation-delay: 500ms; }
        .node:nth-child(2) { animation-delay: 600ms; }
        .node:nth-child(3) { animation-delay: 700ms; }
        .node:nth-child(4) { animation-delay: 800ms; }
        .node:nth-child(5) { animation-delay: 900ms; }
        .node:nth-child(6) { animation-delay: 1000ms; }
        .node:nth-child(7) { animation-delay: 1100ms; }
        .node:nth-child(8) { animation-delay: 1200ms; }
        .node:nth-child(9) { animation-delay: 1300ms; }
        .node:nth-child(10) { animation-delay: 1400ms; }
        .node:nth-child(11) { animation-delay: 1500ms; }

        @keyframes nodeAppear {
          from {
            opacity: 0;
            transform: translateY(-50px) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 768px) {
          .phone-mockup {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}
