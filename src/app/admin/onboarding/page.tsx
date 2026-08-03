"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, ShieldCheck, Facebook, CreditCard } from "lucide-react";

export default function AdminOnboardingCheckout() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [storeName, setStoreName] = useState("");
  const [trxId, setTrxId] = useState("");
  const [activated, setActivated] = useState(false);

  const handleActivation = (e: React.FormEvent) => {
    e.preventDefault();
    setActivated(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-xl bg-slate-900 border-slate-800 shadow-2xl">
        <CardHeader className="border-b border-slate-800 text-center pb-6">
          <CardTitle className="text-2xl font-bold text-slate-100 flex items-center justify-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-400" /> Smart Messenger AI Instant Activation
          </CardTitle>
          <p className="text-slate-400 text-xs mt-1">Zero-friction SaaS Onboarding for Bangladeshi Merchants</p>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {!activated ? (
            <form onSubmit={handleActivation} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Store Name (দোকানের নাম)</label>
                <Input 
                  required
                  placeholder="e.g. Fashion House BD"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="mt-1 bg-slate-950 border-slate-800 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Email Address</label>
                  <Input 
                    type="email"
                    required
                    placeholder="merchant@store.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 bg-slate-950 border-slate-800 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Phone Number (bKash Number)</label>
                  <Input 
                    type="tel"
                    required
                    placeholder="01700000000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 bg-slate-950 border-slate-800 text-slate-100"
                  />
                </div>
              </div>

              <div className="p-4 bg-indigo-950/40 border border-indigo-800/60 rounded-xl space-y-2">
                <p className="text-xs text-indigo-300 font-semibold flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" /> bKash Personal/Merchant Payment Number
                </p>
                <p className="text-lg font-mono font-bold text-emerald-400">01700-123456 (Send Money: ৳1,500/Month)</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">bKash / Nagad Transaction TrxID</label>
                <Input 
                  required
                  placeholder="e.g. BK89234X"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  className="mt-1 bg-slate-950 border-slate-800 text-slate-100 font-mono"
                />
              </div>

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold text-white py-3 rounded-xl">
                Activate Account (Instant 30 Days Access)
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-6 py-4">
              <div className="inline-flex p-3 bg-emerald-950 border border-emerald-800 rounded-full text-emerald-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-100">Account Activated Successfully!</h3>
                <p className="text-xs text-slate-400 mt-1">Credentials have been sent to {email}. Valid for 30 days.</p>
              </div>

              {/* 1-Click Facebook OAuth Connect */}
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl text-left space-y-3">
                <p className="text-xs font-bold text-slate-200">Step 2: Connect Facebook Page</p>
                <p className="text-xs text-slate-400">One-click setup with Facebook Business Login SDK. No copy-pasting tokens!</p>
                <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-2 py-2.5">
                  <Facebook className="w-4 h-4 fill-white" /> Connect Facebook Page via OAuth
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
