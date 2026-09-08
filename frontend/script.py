import pathlib
content = '''import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon } from "lucide-react";

const TIME_SLOTS = [
  { label: "8:00 AM", hour: 8 },
  { label: "9:00 AM", hour: 9 },
  { label: "10:00 AM", hour: 10 },
  { label: "11:00 AM", hour: 11 },
  { label: "12:00 PM", hour: 12 },
  { label: "1:00 PM", hour: 13 },
  { label: "2:00 PM", hour: 14 },
  { label: "3:00 PM", hour: 15 },
  { label: "4:00 PM", hour: 16 },
  { label: "5:00 PM", hour: 17 },
  { label: "6:00 PM", hour: 18 },
  { label: "7:00 PM", hour: 19 },
  { label: "8:00 PM", hour: 20 },
];

function formatDisplay(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const datePart = d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
  let hr = d.getHours();
  const ampm = hr >= 12 ? "PM" : "AM";
  hr = hr % 12 || 12;
  return \\ · \:00 \\;
}

export default function RentalDateTimePicker({ label, value, min, onChange, type, variant = "search", errorClass = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempDate, setTempDate] = useState("");
  const [tempHour, setTempHour] = useState(null);

  const containerRef = useRef(null);

  useEffect(() => {
    if (isOpen && value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        const pad = (n) => String(n).padStart(2, "0");
        setTempDate(\\-\-\\);
        setTempHour(d.getHours());
      }
    }
  }, [isOpen, value]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleConfirm = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!tempDate || tempHour === null) return;
    const pad = (n) => String(n).padStart(2, "0");
    const iso = \\T\:00:00\;
    onChange(iso);
    setIsOpen(false);
  };

  const minDateStr = min ? min.split("T")[0] : "";
  const minHour = min && tempDate === minDateStr ? parseInt(min.split("T")[1].split(":")[0], 10) : -1;

  const isStrictlyAfter = type === "return";

  const containerClass = variant === "search"
    ? "flex flex-col justify-center relative border border-slate-200 rounded-xl p-3 hover:border-teal-500 focus-within:border-teal-600 focus-within:ring-1 focus-within:ring-teal-600 focus-within:bg-white transition-all bg-slate-50 h-[72px] lg:col-span-2 w-full"
    : \elative input-field w-full flex items-center justify-between cursor-pointer \\;

  return (
    <div className={containerClass} ref={containerRef}>
      {variant === "search" ? (
        <>
          <label 
            className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1 cursor-pointer" 
            onClick={() => setIsOpen(!isOpen)}
          >
            <CalendarIcon className="h-3.5 w-3.5" /> {label}
          </label>
          <div 
            className="w-full bg-transparent text-slate-900 font-bold text-sm focus:outline-none cursor-pointer flex justify-between items-center"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span>{value ? formatDisplay(value) : "Select Date & Time"}</span>
            <CalendarIcon className="h-4 w-4 text-teal-600" />
          </div>
        </>
      ) : (
        <div 
          className="w-full bg-transparent text-gray-900 font-medium text-sm focus:outline-none cursor-pointer flex justify-between items-center"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{value ? formatDisplay(value) : "Select Date & Time"}</span>
          <CalendarIcon className="h-4 w-4 text-gray-500" />
        </div>
      )}

      {isOpen && (
        <div className="absolute left-0 w-[300px] sm:w-[360px] bg-white rounded-xl shadow-2xl z-50 p-4 border border-slate-100 transform origin-top-left transition-all" style={{ top: variant === "form" ? "60px" : "80px", zIndex: 100 }}>
          <div className="font-bold text-slate-800 mb-4">{type === "pickup" ? "Select Pickup Date & Time" : "Select Return Date & Time"}</div>
          
          <div className="mb-4">
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Select Date</label>
            <input 
              type="date"
              className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-teal-500 focus:outline-none cursor-pointer"
              min={minDateStr}
              value={tempDate}
              onChange={(e) => {
                setTempDate(e.target.value);
                setTempHour(null);
              }}
            />
          </div>

          <div className="mb-6">
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Select Time</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {TIME_SLOTS.map(slot => {
                let isDisabled = false;
                if (tempDate === minDateStr) {
                  isDisabled = isStrictlyAfter ? slot.hour <= minHour : slot.hour < minHour;
                }
                const isSelected = tempHour === slot.hour;
                return (
                  <button
                    key={slot.hour}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => setTempHour(slot.hour)}
                    className={\p-2 text-xs font-bold rounded-lg transition-all \\}
                  >
                    {slot.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
            <button 
              type="button" 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(false); }}
              className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={handleConfirm}
              disabled={!tempDate || tempHour === null}
              className="px-4 py-2 text-sm font-bold bg-teal-600 text-white rounded-lg hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
'''
pathlib.Path('src/components/RentalDateTimePicker.js').write_text(content, encoding='utf-8')
