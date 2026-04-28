"use client";

import { useMemo, useState } from "react";

type FinanceCalculatorProps = {
  price: number;
};

export default function FinanceCalculator({ price }: FinanceCalculatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [downPayment, setDownPayment] = useState(Math.round(price * 0.2));
  const [months, setMonths] = useState(60);
  const [annualRate, setAnnualRate] = useState(6.5);

  const monthlyPayment = useMemo(() => {
    const principal = Math.max(price - downPayment, 0);
    if (principal <= 0) return 0;

    const monthlyRate = annualRate / 100 / 12;
    if (monthlyRate === 0) return principal / months;

    const factor = Math.pow(1 + monthlyRate, months);
    return (principal * monthlyRate * factor) / (factor - 1);
  }, [price, downPayment, months, annualRate]);

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <button
        type="button"
        onClick={() => setIsExpanded((value) => !value)}
        className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-500"
      >
        <span>Loan Calculator</span>
        <span>{isExpanded ? "−" : "+"}</span>
      </button>

      {isExpanded && (
        <>
          <label className="mt-3 block text-xs text-slate-600">Downpayment (EUR)</label>
          <input
            type="number"
            min="0"
            max={price}
            value={downPayment}
            onChange={(e) => setDownPayment(Number(e.target.value))}
            className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm outline-none focus:border-slate-500"
          />

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-600">Loan Term</label>
              <select
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm outline-none focus:border-slate-500"
              >
                <option value={24}>24 months</option>
                <option value={36}>36 months</option>
                <option value={48}>48 months</option>
                <option value={60}>60 months</option>
                <option value={72}>72 months</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-600">Interest (%)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={annualRate}
                onChange={(e) => setAnnualRate(Number(e.target.value))}
                className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm outline-none focus:border-slate-500"
              />
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-600">Estimated monthly payment</p>
          <p className="text-lg font-bold text-slate-900">
            EUR {Math.round(monthlyPayment).toLocaleString()}
          </p>
        </>
      )}
    </div>
  );
}
