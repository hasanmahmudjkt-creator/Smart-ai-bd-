"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sliders, Save, Bot, MessageSquareText } from "lucide-react";

export default function SmartRulesPage() {
  const [aiTone, setAiTone] = useState("FRIENDLY");
  const [maxDiscount, setMaxDiscount] = useState(10);
  const [paymentDetectedText, setPaymentDetectedText] = useState("পেমেন্ট ট্রানজেকশন রিসিভ হয়েছে। আমাদের টিম এটি ভেরিফাই করছে। ধন্যবাদ!");
  const [stockOutText, setStockOutText] = useState("দুঃখিত, এই প্রোডাক্টটি বর্তমানে স্টক আউট রয়েছে।");
  const [unclearRequestText, setUnclearRequestText] = useState("দুঃখিত, আপনার কথাটি বুঝতে পারিনি। বিস্তারিত বলবেন কি?");
  const [customPromptRules, setCustomPromptRules] = useState("Always respond politely in Bangla or Banglish. Confirm delivery district before creating an order. Do not give discounts higher than 10%.");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 p-6 rounded-xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" /> Smart Rules & AI Behavior
          </h1>
          <p className="text-slate-400 text-xs mt-1">Configure Gemini 1.5 Flash persona, fallback templates, and discount rules</p>
        </div>

        <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">
          <Save className="w-4 h-4 mr-2" /> {saved ? "Saved Successfully!" : "Save Rule Settings"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tone & Prompt Tuning */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-400" /> AI Persona & Tone Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300">AI Conversational Tone</label>
              <select 
                value={aiTone}
                onChange={(e) => setAiTone(e.target.value)}
                className="mt-1 w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="FRIENDLY">Friendly (আলাপচারী ও আন্তরিক)</option>
                <option value="PROFESSIONAL">Professional (পেশাদার ও সংক্ষিপ্ত)</option>
                <option value="DIRECT">Direct (সরাসরি পেমেন্ট ও অর্ডার ফোকাসড)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Maximum Allowed Discount (%)</label>
              <Input 
                type="number" 
                value={maxDiscount} 
                onChange={(e) => setMaxDiscount(Number(e.target.value))}
                className="mt-1 bg-slate-950 border-slate-800 text-slate-100" 
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Custom System Instruction Rules</label>
              <textarea 
                rows={4}
                value={customPromptRules}
                onChange={(e) => setCustomPromptRules(e.target.value)}
                className="mt-1 w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Fallback Text Templates */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <MessageSquareText className="w-5 h-5 text-emerald-400" /> Fallback Response Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300">Payment Screenshot Reply Template</label>
              <textarea 
                rows={2}
                value={paymentDetectedText}
                onChange={(e) => setPaymentDetectedText(e.target.value)}
                className="mt-1 w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-lg p-2.5 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Stock Out Notification Template</label>
              <textarea 
                rows={2}
                value={stockOutText}
                onChange={(e) => setStockOutText(e.target.value)}
                className="mt-1 w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-lg p-2.5 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Unclear Request Fallback Template</label>
              <textarea 
                rows={2}
                value={unclearRequestText}
                onChange={(e) => setUnclearRequestText(e.target.value)}
                className="mt-1 w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-lg p-2.5 text-sm"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
