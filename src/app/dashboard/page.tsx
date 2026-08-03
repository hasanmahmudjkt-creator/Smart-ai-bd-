"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Clock, MessageSquare, AlertCircle, PhoneCall, ShieldAlert, Zap } from "lucide-react";

export default function DashboardOverview() {
  const [isSystemActive, setIsSystemActive] = useState(true);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6 space-y-8">
      {/* Top Header & Master Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Smart Messenger AI Control Center</h1>
            <span className="bg-indigo-950 text-indigo-400 border border-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              v19.0 Meta Ready
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">Autonomous Facebook Multimodal Sales Agent for E-commerce Merchants</p>
        </div>

        <div className="flex items-center gap-4 bg-slate-950 px-5 py-3 rounded-xl border border-slate-800">
          <span className="font-semibold text-sm flex items-center gap-2">
            <Zap className={isSystemActive ? "w-4 h-4 text-emerald-400 fill-emerald-400" : "w-4 h-4 text-slate-500"} />
            System Status: 
            <span className={isSystemActive ? "text-emerald-400 font-bold" : "text-amber-500 font-bold"}>
              {isSystemActive ? "AI ACTIVE" : "PAUSED"}
            </span>
          </span>
          <Switch 
            checked={isSystemActive} 
            onCheckedChange={setIsSystemActive}
            className="data-[state=checked]:bg-emerald-500" 
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Today's Orders" value="28" subtitle="৳18,400 Total Revenue" icon={<ShoppingBag className="w-5 h-5 text-indigo-400" />} />
        <MetricCard title="Pending Review" value="5" subtitle="bKash/Nagad Payments" icon={<Clock className="w-5 h-5 text-amber-400" />} />
        <MetricCard title="Active Conversations" value="142" subtitle="Messenger Threads" icon={<MessageSquare className="w-5 h-5 text-sky-400" />} />
        <MetricCard title="Subscription Expiry" value="24 Days Left" subtitle="Valid until Aug 22, 2026" icon={<AlertCircle className="w-5 h-5 text-emerald-400" />} />
      </div>

      {/* Live Agent Takeover Feed & WhatsApp Support */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-slate-900 border-slate-800 col-span-2">
          <CardHeader className="border-b border-slate-800/80 pb-4">
            <CardTitle className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" /> Live Human Takeover Feed (Active Silence Locks)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
              <div>
                <p className="font-semibold text-slate-200">Customer: Tanvir Hasan (PSID: 88490219)</p>
                <p className="text-xs text-amber-400 mt-0.5">Trigger Word: "কথা বলতে চাই" (24h Silence Active)</p>
              </div>
              <Button size="sm" variant="outline" className="border-amber-500/50 text-amber-400 hover:bg-amber-950">
                Resume AI Agent
              </Button>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
              <div>
                <p className="font-semibold text-slate-200">Customer: Nusrat Jahan (PSID: 99120488)</p>
                <p className="text-xs text-sky-400 mt-0.5">Reason: Admin replied directly in Meta Business Suite</p>
              </div>
              <Button size="sm" variant="outline" className="border-sky-500/50 text-sky-400 hover:bg-sky-950">
                Resume AI Agent
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Floating WhatsApp Support Button Widget */}
        <Card className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 border-emerald-800/40 flex flex-col justify-between p-6">
          <div>
            <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
              <PhoneCall className="w-5 h-5" /> 24/7 Merchant Support
            </h3>
            <p className="text-slate-300 text-sm mt-3 leading-relaxed">
              Need assistance with Facebook Business OAuth login, bKash TrxID verification, or Steadfast/Pathao courier CSV export?
            </p>
          </div>
          <a 
            href="https://wa.me/8801700000000" 
            target="_blank" 
            rel="noreferrer"
            className="mt-6 w-full text-center bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <PhoneCall className="w-4 h-4" /> Open WhatsApp Support
          </a>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon }: { title: string; value: string; subtitle: string; icon: React.ReactNode }) {
  return (
    <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-slate-400">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight text-slate-50">{value}</div>
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
